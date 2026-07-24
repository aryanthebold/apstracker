from fastapi import APIRouter, Query, HTTPException, Depends, Request
from services.db import get_db
from routers.rate_limit import general_limiter
import re

router = APIRouter(prefix="/students", tags=["Students"])

ROLL_RE = re.compile(r"^[A-Za-z0-9]{6,20}$")

# Only allow safe characters in search queries (letters, digits, spaces)
SEARCH_SAFE_RE = re.compile(r"^[A-Za-z0-9\s]+$")


@router.get("/search", dependencies=[Depends(general_limiter)])
def search_student(q: str = Query(..., min_length=3, max_length=50)):
    # Reject queries containing special characters to block injection attempts
    if not SEARCH_SAFE_RE.match(q):
        raise HTTPException(
            status_code=400,
            detail="Search query must contain only letters, numbers, and spaces.",
        )

    supabase = get_db()

    # Supabase client uses parameterized queries internally; the ilike filter
    # value is passed as a bound parameter, not interpolated into raw SQL.
    res = (
        supabase.table("students")
        .select("id, roll_number, name, branch, has_submitted, results(raw_session_summary, overall_sgpa)")
        .or_(f"name.ilike.%{q}%,roll_number.ilike.%{q}%")
        .limit(25)  # Cap results to avoid data-scraping via wildcard search
        .execute()
    )

    # Rank map calculation
    all_results_res = (
        supabase.table("results")
        .select("roll_number, overall_sgpa, total_backs")
        .not_.is_("overall_sgpa", "null")
        .order("overall_sgpa", desc=True)
        .order("total_backs", desc=False)
        .execute()
    )
    rank_map = {r["roll_number"]: idx for idx, r in enumerate(all_results_res.data, start=1)}

    data = []
    for item in res.data:
        has_ufm = False
        results = item.pop("results", [])
        overall_sgpa = None
        if results and results[0]:
            if results[0].get("raw_session_summary") and "UFM_FLAG" in results[0]["raw_session_summary"]:
                has_ufm = True
            overall_sgpa = results[0].get("overall_sgpa")
        item["has_ufm"] = has_ufm
        item["overall_sgpa"] = overall_sgpa
        item["rank"] = rank_map.get(item["roll_number"])
        data.append(item)

    return {"data": data}


@router.get("/stats", dependencies=[Depends(general_limiter)])
def get_stats():
    supabase = get_db()

    # Total students
    total_res = supabase.table("students").select("id", count="exact").execute()
    total_students = total_res.count

    # Submitted
    sub_res = (
        supabase.table("students")
        .select("id", count="exact")
        .eq("has_submitted", True)
        .execute()
    )
    total_submitted = sub_res.count

    # Average SGPA
    sgpa_res = (
        supabase.table("results")
        .select("overall_sgpa")
        .not_.is_("overall_sgpa", "null")
        .execute()
    )
    sgpas = [r["overall_sgpa"] for r in sgpa_res.data]
    avg_sgpa = sum(sgpas) / len(sgpas) if sgpas else 0

    # Total backs
    backs_res = supabase.table("results").select("total_backs").execute()
    total_backs = sum(
        [r["total_backs"] for r in backs_res.data if r.get("total_backs")]
    )

    return {
        "total_students": total_students,
        "total_submitted": total_submitted,
        "average_sgpa": avg_sgpa,
        "total_backs": total_backs,
    }


@router.get("/{roll_number}", dependencies=[Depends(general_limiter)])
def get_student_details(roll_number: str):
    # Validate roll number format to prevent injection / path manipulation
    if not ROLL_RE.match(roll_number):
        raise HTTPException(status_code=400, detail="Invalid roll number format")

    supabase = get_db()

    student_res = (
        supabase.table("students")
        .select("id, roll_number, enrollment_number, name, father_name, branch, gender, has_submitted, created_at")
        .eq("roll_number", roll_number)
        .execute()
    )
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    student = student_res.data[0]

    result_res = (
        supabase.table("results")
        .select("*")
        .eq("roll_number", roll_number)
        .execute()
    )
    result = result_res.data[0] if result_res.data else None

    semesters_res = (
        supabase.table("semester_results")
        .select("*")
        .eq("roll_number", roll_number)
        .order("semester")
        .execute()
    )
    subjects_res = (
        supabase.table("subject_marks")
        .select("*")
        .eq("roll_number", roll_number)
        .order("semester")
        .execute()
    )

    subjects_by_sem: dict = {}
    for sub in subjects_res.data:
        sem_num = sub["semester"]
        if sem_num not in subjects_by_sem:
            subjects_by_sem[sem_num] = []
        subjects_by_sem[sem_num].append(sub)

    semesters_data = []
    for sem in semesters_res.data:
        sem_num = sem["semester"]
        sem["subjects"] = subjects_by_sem.get(sem_num, [])
        semesters_data.append(sem)

    if result and result.get("overall_sgpa") is not None:
        # Calculate rank among submitted results
        all_results_res = (
            supabase.table("results")
            .select("roll_number, overall_sgpa, total_backs")
            .not_.is_("overall_sgpa", "null")
            .order("overall_sgpa", desc=True)
            .order("total_backs", desc=False)
            .execute()
        )
        rank = None
        for idx, r in enumerate(all_results_res.data, start=1):
            if r["roll_number"] == roll_number:
                rank = idx
                break
        result["rank"] = rank
        student["rank"] = rank
    elif result:
        result["rank"] = None
        student["rank"] = None
    else:
        student["rank"] = None

    return {
        "student": student,
        "result": result,
        "semesters": semesters_data,
    }
