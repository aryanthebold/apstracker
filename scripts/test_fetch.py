import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from services.db import get_db
    print("Successfully imported db module and loaded credentials.")
except Exception as e:
    print(f"Error importing db service: {e}")
    sys.exit(1)

def test_connection():
    db = get_db()
    print("Testing Supabase connection...")
    try:
        # Check if we can select from students table
        res = db.table("students").select("id, name, roll_number").limit(5).execute()
        print("Supabase connection successful!")
        print(f"Retrieved {len(res.data)} students from database:")
        for idx, student in enumerate(res.data):
            print(f"  {idx + 1}. Name: {student['name']}, Roll: {student['roll_number']}")
        
        # Check overall results
        res_results = db.table("results").select("roll_number, overall_sgpa").limit(5).execute()
        print(f"\nRetrieved {len(res_results.data)} results from database:")
        for idx, res_item in enumerate(res_results.data):
            print(f"  {idx + 1}. Roll: {res_item['roll_number']}, SGPA: {res_item['overall_sgpa']}")
            
    except Exception as e:
        print(f"Database query failed: {e}")

if __name__ == "__main__":
    test_connection()
