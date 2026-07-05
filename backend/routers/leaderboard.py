from fastapi import APIRouter, Query, Path, HTTPException, Depends, Request
from typing import Optional
from services.db import get_db
from routers.rate_limit import general_limiter
import re

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

# Allowlist for branch values to prevent injection via query params
ALLOWED_BRANCHES = {"CSE", "CSE_AIML", "CST", "CST_IOT"}

# Allowlist for sort fields
ALLOWED_SORT = {"sgpa", "backs"}

# Allowlist for order direction
ALLOWED_ORDER = {"asc", "desc"}


def _validate_branch(branch: Optional[str]) -> Optional[str]:
    if branch is None:
        return None
    if branch not in ALLOWED_BRANCHES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid branch. Must be one of: {', '.join(sorted(ALLOWED_BRANCHES))}",
        )
    return branch


@router.get("/", dependencies=[Depends(general_limiter)])
def get_overall_leaderboard(
    branch: Optional[str] = None,
    sort: str = Query("sgpa", regex="^(sgpa|backs)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    has_backs: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    branch = _validate_branch(branch)
    supabase = get_db()

    query = supabase.table("results").select("*, students!inner(*)")

    if branch:
        query = query.eq("students.branch", branch)

    if has_backs is not None:
        query = query.eq("has_backs", has_backs)

    if sort == "sgpa":
        query = query.order("overall_sgpa", desc=(order == "desc"))
    elif sort == "backs":
        query = query.order("total_backs", desc=(order == "desc"))

    res = query.range(offset, offset + limit - 1).execute()
    return {"data": res.data}


@router.get("/semester/{sem}", dependencies=[Depends(general_limiter)])
def get_semester_leaderboard(
    sem: int = Path(..., ge=1, le=8),
    branch: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    branch = _validate_branch(branch)
    supabase = get_db()
    query = (
        supabase.table("semester_results")
        .select("*, students!inner(*)")
        .eq("semester", sem)
    )

    if branch:
        query = query.eq("students.branch", branch)

    query = query.order("sgpa", desc=True)
    res = query.range(offset, offset + limit - 1).execute()
    return {"data": res.data}


@router.get("/subject", dependencies=[Depends(general_limiter)])
def get_subject_toppers(
    semester: int = Query(..., ge=1, le=8),
    branch: Optional[str] = None,
):
    branch = _validate_branch(branch)
    supabase = get_db()
    query = (
        supabase.table("subject_marks")
        .select("*, students!inner(*)")
        .eq("semester", semester)
    )

    if branch:
        query = query.eq("students.branch", branch)

    res = query.execute()

    subjects: dict = {}
    for mark in res.data:
        code = mark["subject_code"]
        if code not in subjects:
            subjects[code] = {
                "subject_name": mark["subject_name"],
                "subject_code": code,
                "marks": [],
            }
        subjects[code]["marks"].append(mark)

    for code, data in subjects.items():
        data["marks"].sort(key=lambda x: x.get("total_marks") or 0, reverse=True)
        data["top_3"] = data["marks"][:3]
        del data["marks"]

    return {"data": list(subjects.values())}
