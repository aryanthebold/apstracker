import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

res = supabase.table("semester_results").select("*").eq("roll_number", "2405110100040").execute()
print("Semester Results for 2405110100040:")
for r in res.data:
    print(r)

sub_res = supabase.table("subject_marks").select("semester,subject_code,subject_name").eq("roll_number", "2405110100040").execute()
print("\nSubjects for 2405110100040:")
for s in sub_res.data:
    print(s)
