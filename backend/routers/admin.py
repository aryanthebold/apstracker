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
        "id, roll_number, name, branch, has_submitted, created_at"
    ).execute()
    return {"data": res.data}


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

    return {
        "students_with_backs": res.data,
        "back_subjects": backs_res.data
    }


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
