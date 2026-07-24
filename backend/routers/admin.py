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
    # Find students with backs
    res = supabase.table("results").select("*, students(*)").eq("has_backs", True).execute()

    # Optionally we can fetch all subject_marks where is_back=True
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

    for item in res.data:
        item["rank"] = rank_map.get(item["roll_number"])

    return {
        "students_with_backs": res.data,
        "back_subjects": backs_res.data
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
