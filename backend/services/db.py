import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db():
    return supabase

def get_student_by_roll(roll_number: str):
    response = supabase.table("students").select("*").eq("roll_number", roll_number).execute()
    return response.data[0] if response.data else None

async def save_parsed_result(student_id: str, roll_number: str, parsed_data: dict):
    loop = asyncio.get_event_loop()

    # 1. Update students table info if missing
    student_update = {}
    student_info = parsed_data.get("student", {})
    if student_info.get("enrollment_number"):
        student_update["enrollment_number"] = student_info["enrollment_number"]
    if student_info.get("gender"):
        student_update["gender"] = student_info["gender"]
    if student_info.get("father_name"):
        student_update["father_name"] = student_info["father_name"]
    student_update["has_submitted"] = True

    await loop.run_in_executor(
        None,
        lambda: supabase.table("students").update(student_update).eq("id", student_id).execute()
    )

    # 2. Delete existing results in parallel (re-upload safe)
    await asyncio.gather(
        loop.run_in_executor(
            None,
            lambda: supabase.table("semester_results").delete().eq("student_id", student_id).execute()
        ),
        loop.run_in_executor(
            None,
            lambda: supabase.table("subject_marks").delete().eq("student_id", student_id).execute()
        ),
    )

    # 3. Calculate derived overall stats
    total_semesters = len(parsed_data["semesters"])
    valid_sgpas = [sem["sgpa"] for sem in parsed_data["semesters"] if sem.get("sgpa") is not None]
    overall_sgpa = sum(valid_sgpas) / len(valid_sgpas) if valid_sgpas else None

    total_backs = sum([sem.get("backs_in_sem", 0) for sem in parsed_data["semesters"]])
    has_backs = total_backs > 0

    result_entry = {
        "student_id": student_id,
        "roll_number": roll_number,
        "total_semesters_submitted": total_semesters,
        "overall_sgpa": overall_sgpa,
        "total_backs": total_backs,
        "has_backs": has_backs,
        "raw_session_summary": parsed_data.get("overall_result_status")
    }

    # 4. Build semester and subject rows
    sem_inserts = []
    sub_inserts = []

    for sem in parsed_data["semesters"]:
        sem_inserts.append({
            "student_id": student_id,
            "roll_number": roll_number,
            "semester": sem["semester"],
            "sgpa": sem.get("sgpa"),
            "total_marks": sem.get("total_marks"),
            "result_status": sem.get("result_status"),
            "backs_in_sem": sem.get("backs_in_sem", 0),
            "date_of_declaration": sem.get("date_of_declaration")
        })

        for sub in sem.get("subjects", []):
            sub_inserts.append({
                "student_id": student_id,
                "roll_number": roll_number,
                "semester": sem["semester"],
                "subject_code": sub["subject_code"],
                "subject_name": sub["subject_name"],
                "subject_type": sub.get("subject_type"),
                "internal_marks": sub.get("internal_marks"),
                "external_marks": sub.get("external_marks"),
                "total_marks": sub.get("total_marks"),
                "grade": sub.get("grade"),
                "is_back": sub.get("is_back", False)
            })

    # 5. Upsert overall result + insert semesters and subjects in parallel
    tasks = [
        loop.run_in_executor(
            None,
            lambda: supabase.table("results").upsert(result_entry, on_conflict="roll_number").execute()
        ),
    ]
    if sem_inserts:
        tasks.append(loop.run_in_executor(
            None,
            lambda: supabase.table("semester_results").insert(sem_inserts).execute()
        ))
    if sub_inserts:
        tasks.append(loop.run_in_executor(
            None,
            lambda: supabase.table("subject_marks").insert(sub_inserts).execute()
        ))

    await asyncio.gather(*tasks)

    return {"message": "Result saved successfully"}

