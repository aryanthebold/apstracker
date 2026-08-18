from fastapi import APIRouter, Depends, HTTPException, Header, Request
import os
import hmac
from services.db import get_db
from routers.rate_limit import admin_limiter

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_SECRET = os.environ.get("ADMIN_SECRET")
if not ADMIN_SECRET:
    raise RuntimeError("ADMIN_SECRET environment variable must be set.")

# Enforce a minimum secret length so weak passwords can't slip through
if len(ADMIN_SECRET) < 16:
    raise RuntimeError(
        "ADMIN_SECRET is too short. Use at least 16 characters for security."
    )


def verify_admin(
    request: Request,
    authorization: str = Header(..., description="Bearer <admin_secret>"),
    _rate: None = Depends(admin_limiter),
):
    """
    1. Rate-limited (30 req/min per IP) to block brute-force attempts.
    2. Constant-time compare to prevent timing-based secret extraction.
    3. Returns 401 for any mismatch — never leaks which part is wrong.
    """
    expected = f"Bearer {ADMIN_SECRET}"
    # hmac.compare_digest prevents timing attacks that could brute-force the token
    if not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@router.get("/all-students", dependencies=[Depends(verify_admin)])
def get_all_students():
    supabase = get_db()
    res = supabase.table("students").select(
        "id, roll_number, name, branch, has_submitted, created_at, results(overall_sgpa)"
    ).execute()

    all_results = (
        supabase.table("results")
        .select("roll_number, overall_sgpa, total_backs")
        .not_.is_("overall_sgpa", "null")
        .order("overall_sgpa", desc=True)
        .order("total_backs", desc=False)
        .execute()
    )
    rank_map = {r["roll_number"]: idx for idx, r in enumerate(all_results.data, start=1)}

    data = []
    for item in res.data:
        results = item.pop("results", [])
        item["overall_sgpa"] = results[0].get("overall_sgpa") if (results and len(results) > 0) else None
        item["rank"] = rank_map.get(item["roll_number"])
        data.append(item)

    return {"data": data}


@router.get("/not-submitted", dependencies=[Depends(verify_admin)])
def get_not_submitted():
    supabase = get_db()
    res = supabase.table("students").select(
        "id, roll_number, name, branch, has_submitted, created_at"
    ).eq("has_submitted", False).execute()
    return {"data": res.data}


@router.get("/backs", dependencies=[Depends(verify_admin)])
def get_all_backs():
    supabase = get_db()

    # Primary query: any student where total_backs > 0 (catches cases where
    # has_backs was incorrectly saved as False despite total_backs > 0)
    res = (
        supabase.table("results")
        .select("*, students(*)")
        .gt("total_backs", 0)
        .execute()
    )

    # Also include students where has_backs=True (catches students whose backs were
    # detected via session summary fallback rather than subject-level is_back flags)
    has_backs_res = (
        supabase.table("results")
        .select("*, students(*)")
        .eq("has_backs", True)
        .execute()
    )

    # Merge the two sets (deduplicate by roll_number)
    seen_rolls = set(r["roll_number"] for r in res.data)
    merged = list(res.data)
    for item in has_backs_res.data:
        if item["roll_number"] not in seen_rolls:
            merged.append(item)
            seen_rolls.add(item["roll_number"])

    # Auto-repair: any row with total_backs > 0 but has_backs = False is corrupted
    corrupted_rolls = [
        r["roll_number"] for r in merged
        if r.get("total_backs", 0) > 0 and not r.get("has_backs", False)
    ]
    if corrupted_rolls:
        supabase.table("results").update({"has_backs": True}).in_("roll_number", corrupted_rolls).execute()
        # Reflect the fix in our in-memory response
        for item in merged:
            if item["roll_number"] in corrupted_rolls:
                item["has_backs"] = True

    # Optionally fetch all subject_marks where is_back=True
    backs_res = supabase.table("subject_marks").select("*, students(*)").eq("is_back", True).execute()

    all_results = (
        supabase.table("results")
        .select("roll_number, overall_sgpa, total_backs")
        .not_.is_("overall_sgpa", "null")
        .order("overall_sgpa", desc=True)
        .order("total_backs", desc=False)
        .execute()
    )
    rank_map = {r["roll_number"]: idx for idx, r in enumerate(all_results.data, start=1)}

    for item in merged:
        item["rank"] = rank_map.get(item["roll_number"])

    return {
        "students_with_backs": merged,
        "back_subjects": backs_res.data
    }


@router.post("/repair-backs", dependencies=[Depends(verify_admin)])
def repair_backs():
    """
    One-time repair: recounts total_backs for every student from grade data
    already stored in subject_marks, then updates results.total_backs and
    results.has_backs accordingly.

    Uses the same is_back logic as the fixed pdf_parser:
      - grade in ('F', 'ABS', 'E')
      - grade ends with '*'

    No PDF re-uploads needed.
    """
    supabase = get_db()

    # 1. Pull every subject mark row
    back_marks = supabase.table("subject_marks").select("roll_number, grade").execute()

    # 2. Recount per roll_number using the corrected is_back logic
    back_counts: dict = {}
    for row in back_marks.data:
        roll = row["roll_number"]
        grade = (row.get("grade") or "").strip()
        grade_clean = grade.replace("*", "")
        is_back = grade_clean in ("F", "ABS", "E") or grade.endswith("*")
        if is_back:
            back_counts[roll] = back_counts.get(roll, 0) + 1

    # 3. Pull current results to find who needs updating
    all_results = supabase.table("results").select("roll_number, total_backs, has_backs").execute()

    needs_update = []
    for r in all_results.data:
        roll = r["roll_number"]
        correct_backs = back_counts.get(roll, 0)
        correct_has_backs = correct_backs > 0

        # Preserve existing has_backs=True from session-summary fallback
        # (students flagged via FAIL summary but 0 subject-level backs)
        if r.get("has_backs") and correct_backs == 0:
            correct_has_backs = True

        if r["total_backs"] != correct_backs or r["has_backs"] != correct_has_backs:
            needs_update.append({
                "roll_number": roll,
                "total_backs": correct_backs,
                "has_backs": correct_has_backs,
            })

    # 4. Apply updates
    for item in needs_update:
        supabase.table("results").update({
            "total_backs": item["total_backs"],
            "has_backs": item["has_backs"],
        }).eq("roll_number", item["roll_number"]).execute()

    return {
        "message": f"Repair complete. {len(needs_update)} student(s) corrected.",
        "corrected_rolls": [i["roll_number"] for i in needs_update],
    }


@router.get("/ufm-students", dependencies=[Depends(verify_admin)])
def get_ufm_students():
    """Returns all students who have a UFM_FLAG in their result summary."""
    supabase = get_db()

    # Fetch results containing UFM_FLAG
    res = (
        supabase.table("results")
        .select("roll_number, overall_sgpa, total_backs, raw_session_summary, students(*)")
        .like("raw_session_summary", "%UFM_FLAG%")
        .execute()
    )

    all_results = (
        supabase.table("results")
        .select("roll_number, overall_sgpa, total_backs")
        .not_.is_("overall_sgpa", "null")
        .order("overall_sgpa", desc=True)
        .order("total_backs", desc=False)
        .execute()
    )
    rank_map = {r["roll_number"]: idx for idx, r in enumerate(all_results.data, start=1)}

    data = []
    for item in res.data:
        # Extract UFM remark from summary string
        ufm_remark = None
        if item.get("raw_session_summary") and "UFM_FLAG:" in item["raw_session_summary"]:
            ufm_remark = item["raw_session_summary"].split("UFM_FLAG:")[1].strip()
        item["ufm_remark"] = ufm_remark
        item["rank"] = rank_map.get(item["roll_number"])
        data.append(item)

    return {"data": data}


# Allowlist of valid branch values to prevent injection via PATCH body
ALLOWED_BRANCHES = {"CSE", "CSE_AIML", "CST", "CST_IOT"}


@router.patch("/student/{roll_number}", dependencies=[Depends(verify_admin)])
def update_student(roll_number: str, payload: dict):
    """Update a student's name and/or branch. Useful for fixing OCR errors from PDF parsing."""
    import re

    if not re.match(r"^[A-Za-z0-9]{6,20}$", roll_number):
        raise HTTPException(status_code=400, detail="Invalid roll number format")

    # Only allow updating name and branch — never id, roll_number, has_submitted etc.
    allowed_fields = {"name", "branch"}
    update_data = {k: v for k, v in payload.items() if k in allowed_fields}

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update. Allowed: name, branch")

    if "branch" in update_data:
        if update_data["branch"] not in ALLOWED_BRANCHES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid branch. Must be one of: {', '.join(sorted(ALLOWED_BRANCHES))}",
            )

    if "name" in update_data:
        name = update_data["name"].strip()
        # Names: letters, spaces, dots, hyphens, apostrophes — max 100 chars
        if not re.match(r"^[A-Za-z\s.\-']{1,100}$", name):
            raise HTTPException(status_code=400, detail="Invalid name format")
        update_data["name"] = name

    supabase = get_db()
    student_res = supabase.table("students").select("id").eq("roll_number", roll_number).execute()
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")

    supabase.table("students").update(update_data).eq("roll_number", roll_number).execute()
    return {"message": f"Student {roll_number} updated successfully", "updated": update_data}


@router.delete("/student/{roll_number}", dependencies=[Depends(verify_admin)])
def delete_student_result(roll_number: str):
    # Validate roll number format before hitting the DB
    import re
    if not re.match(r"^[A-Za-z0-9]{6,20}$", roll_number):
        raise HTTPException(status_code=400, detail="Invalid roll number format")

    supabase = get_db()

    student_res = supabase.table("students").select("id").eq("roll_number", roll_number).execute()
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")

    student_id = student_res.data[0]["id"]

    # Delete results (Cascade delete in DB schema should handle this if configured properly,
    # but we do it manually to be safe)
    supabase.table("semester_results").delete().eq("student_id", student_id).execute()
    supabase.table("subject_marks").delete().eq("student_id", student_id).execute()
    supabase.table("results").delete().eq("student_id", student_id).execute()

    # Update has_submitted
    supabase.table("students").update({"has_submitted": False}).eq("id", student_id).execute()

    return {"message": f"Results for {roll_number} deleted successfully"}
