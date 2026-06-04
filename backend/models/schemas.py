from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

class SubjectMarkBase(BaseModel):
    subject_code: str
    subject_name: str
    subject_type: Optional[str] = None
    internal_marks: Optional[int] = None
    external_marks: Optional[int] = None
    total_marks: Optional[int] = None
    grade: Optional[str] = None
    is_back: bool = False

class SemesterResultBase(BaseModel):
    semester: int
    sgpa: Optional[float] = None
    total_marks: Optional[int] = None
    result_status: Optional[str] = None
    backs_in_sem: int = 0
    date_of_declaration: Optional[date] = None
    subjects: List[SubjectMarkBase] = []

class ParsedResult(BaseModel):
    roll_number: str
    enrollment_number: Optional[str] = None
    name: str
    father_name: Optional[str] = None
    branch: Optional[str] = None
    gender: Optional[str] = None
    overall_result_status: Optional[str] = None
    overall_total_marks: Optional[int] = None
    semesters: List[SemesterResultBase] = []

class StudentResponse(BaseModel):
    id: UUID
    roll_number: str
    name: str
    branch: Optional[str] = None
    has_submitted: bool

class LeaderboardEntry(BaseModel):
    student_id: UUID
    roll_number: str
    name: str
    branch: Optional[str] = None
    overall_sgpa: Optional[float] = None
    total_backs: int
    has_backs: bool
    total_semesters_submitted: Optional[int] = None

class PaginatedLeaderboard(BaseModel):
    data: List[LeaderboardEntry]
    total: int
    offset: int
    limit: int
