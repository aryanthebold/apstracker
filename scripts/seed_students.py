import pdfplumber
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
if not url or not key:
    raise ValueError("Missing Supabase credentials")

supabase: Client = create_client(url, key)

def map_branch(branch_str):
    if not branch_str:
        return None
    branch_str = branch_str.upper().strip()
    if "CSE" in branch_str and ("AI" in branch_str or "ML" in branch_str or "AIML" in branch_str or "DS" in branch_str):
        return "CSE_AIML"
    if "AI" in branch_str or "DS" in branch_str:
        return "CSE_AIML"
    if "CST" in branch_str:
        return "CST"
    if "CSE" in branch_str:
        return "CSE"
    return None

def seed_students(pdf_path: str):
    """
    Parses a PDF containing student names, roll numbers, and branches,
    and inserts/upserts them into the students table.
    """
    students = []
    skipped_lateral = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            table = page.extract_table()
            if not table:
                continue
            
            # Identify columns
            # Some pages start with the GL Bajaj header, we skip rows that don't have student data.
            # Header typically has "Roll No." or "Roll Number"
            for row in table:
                if not row or len(row) < 4:
                    continue
                
                # Clean elements
                s_no = (row[0] or "").strip()
                roll = (row[1] or "").strip()
                name = (row[2] or "").strip()
                branch_raw = (row[3] or "").strip()
                
                # Skip main headers or sub-headers
                if roll.lower() in ["roll no.", "roll no", "roll_number", "roll number"] or name.lower() in ["name", "student name"]:
                    continue
                
                if "GL BAJAJ" in s_no or "DEPARTMENT OF" in s_no or "YEAR:" in s_no:
                    continue
                
                # If roll is empty but we have a name (like lateral entries)
                if not roll:
                    if name:
                        skipped_lateral.append({"name": name, "branch": branch_raw})
                    continue
                
                if not roll.isdigit():
                    continue
                
                branch = map_branch(branch_raw)
                if not branch:
                    # Default fallback or skip
                    print(f"Warning: Could not map branch '{branch_raw}' for student {name} ({roll})")
                    continue
                
                students.append({
                    "roll_number": roll,
                    "name": name,
                    "branch": branch,
                    "has_submitted": False
                })

    print(f"Parsed {len(students)} students with valid roll numbers.")
    print(f"Skipped {len(skipped_lateral)} lateral entry students due to missing roll numbers in PDF.")
    
    if not students:
        print("No students parsed. Exiting.")
        return

    # Upsert to avoid unique key conflicts on roll_number
    # Upsert automatically matches by UNIQUE constraint (roll_number in this case)
    print("Upserting students into Supabase 'students' table...")
    
    # Batch upsert in chunks of 100
    chunk_size = 100
    for i in range(0, len(students), chunk_size):
        chunk = students[i:i + chunk_size]
        try:
            supabase.table("students").upsert(chunk, on_conflict="roll_number").execute()
            print(f"Successfully upserted batch {i // chunk_size + 1} ({len(chunk)} students)")
        except Exception as e:
            print(f"Error upserting batch {i // chunk_size + 1}: {e}")
            
    print("Database seeding completed.")

if __name__ == "__main__":
    pdf_path = os.path.join(os.path.dirname(__file__), '..', 'students.pdf')
    if os.path.exists(pdf_path):
        seed_students(pdf_path)
    else:
        print(f"Error: Could not find PDF at {pdf_path}")
