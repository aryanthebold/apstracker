import os
import sys
import re
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.db import get_db, save_parsed_result
from services.pdf_parser import parse_pdf

MOCK_TEXT = """
Name: Rahul Kumar
Roll No: 2400970100045
Enrollment No: 2400970100045A
Father's Name: Suresh Kumar
Branch: (10) CSE
Gender: M
Result Status: PASS

Semester : 1
SGPA: 8.5
Result Status: PASS
Total Marks: 900
Date of Declaration: 2025-02-15
KCS101T Programming in C Theory 40 50 90 A+ --
KAS101T Engineering Physics Theory 35 45 80 A --
KCS151P Programming Lab Practical 45 48 93 O --

Semester : 2
SGPA: 7.8
Result Status: PASS
Total Marks: 900
Date of Declaration: 2025-08-10
KCS201T Data Structures Theory 30 40 70 B --
KAS201T Engineering Chemistry Theory 28 32 60 C --
KCS251P Data Structures Lab Practical 42 45 87 A+ --
"""

def generate_mock_pdf(pdf_path: str):
    from reportlab.pdfgen import canvas
    c = canvas.Canvas(pdf_path)
    y = 800
    for line in MOCK_TEXT.split("\n"):
        if line.strip():
            c.drawString(50, y, line)
            y -= 15
        else:
            y -= 10
    c.save()

def main():
    db = get_db()
    test_roll = "2400970100045"
    
    print("1. Cleaning existing test data from DB...")
    # Delete student and let CASCADE handle results
    db.table("students").delete().eq("roll_number", test_roll).execute()
    
    print("2. Seeding a mock student into 'students' table...")
    student_data = {
        "roll_number": test_roll,
        "name": "Rahul Kumar",
        "branch": "CSE", # Matches check constraint 'CSE'
        "has_submitted": False
    }
    res = db.table("students").insert(student_data).execute()
    student_id = res.data[0]["id"]
    print(f"Mock student created with ID: {student_id}")
    
    print("3. Generating mock result PDF...")
    pdf_path = os.path.join(os.path.dirname(__file__), "temp_test_result.pdf")
    generate_mock_pdf(pdf_path)
    
    print("4. Parsing PDF...")
    parsed_data = parse_pdf(pdf_path)
    
    print("5. Saving parsed results to database...")
    save_parsed_result(student_id, test_roll, parsed_data)
    print("Successfully called save_parsed_result!")
    
    print("\n6. Verifying database entries:")
    
    # Query student updates
    student_db = db.table("students").select("*").eq("id", student_id).execute().data[0]
    print(f"  Student table updated: Enrollment={student_db['enrollment_number']}, Father={student_db['father_name']}, has_submitted={student_db['has_submitted']}")
    
    # Query overall results
    result_db = db.table("results").select("*").eq("student_id", student_id).execute().data[0]
    print(f"  Results table: GPA={result_db['overall_sgpa']}, Backs={result_db['total_backs']}, HasBacks={result_db['has_backs']}")
    
    # Query semester results
    sems_db = db.table("semester_results").select("*").eq("student_id", student_id).order("semester").execute().data
    print(f"  Semester results in DB: {len(sems_db)}")
    for sem in sems_db:
        print(f"    Sem {sem['semester']}: SGPA={sem['sgpa']}, Status={sem['result_status']}")
        
    # Query subjects
    subs_db = db.table("subject_marks").select("*").eq("student_id", student_id).order("semester").execute().data
    print(f"  Subject marks in DB: {len(subs_db)}")
    for sub in subs_db:
        print(f"    Sem {sub['semester']} - {sub['subject_code']}: Marks={sub['total_marks']}, Grade={sub['grade']}, Back={sub['is_back']}")

    # Clean up
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    print("\nTest completed successfully! Cleaning up mock PDF file.")

if __name__ == "__main__":
    main()
