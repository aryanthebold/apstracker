"""
Endpoint smoke-test script.

NEVER hard-code secrets here.  Load them from environment variables instead:

  Windows PowerShell:
    $env:ADMIN_SECRET = "your-secret"
    python scripts/test_endpoints.py

  Bash/Linux:
    ADMIN_SECRET=your-secret python scripts/test_endpoints.py
"""
import urllib.request
import json
import os
import sys

BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET")

if not ADMIN_SECRET:
    print(
        "ERROR: ADMIN_SECRET environment variable is not set.\n"
        "Usage: ADMIN_SECRET=your-secret python scripts/test_endpoints.py"
    )
    sys.exit(1)


def make_request(path: str, headers: dict = None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 0, str(e)


def test():
    print("=== Testing FastAPI Endpoints ===")

    # 1. Root
    code, res = make_request("/")
    print(f"GET / -> Status: {code}, Response: {res}")

    # 2. Stats
    code, res = make_request("/students/stats")
    print(f"GET /students/stats -> Status: {code}, Response: {res}")

    # 3. Student details
    code, res = make_request("/students/2400970100045")
    print(f"GET /students/2400970100045 -> Status: {code}")
    if code == 200:
        print(f"  Name: {res['student']['name']}, Semesters submitted: {len(res['semesters'])}")
    else:
        print(f"  Error: {res}")

    # 4. Search
    code, res = make_request("/students/search?q=Rahul")
    print(f"GET /students/search?q=Rahul -> Status: {code}")
    if code == 200:
        print(f"  Found {len(res['data'])} student(s)")
    else:
        print(f"  Error: {res}")

    # 5. Leaderboard
    code, res = make_request("/leaderboard")
    print(f"GET /leaderboard -> Status: {code}")
    if code == 200:
        print(f"  Leaderboard count: {len(res['data'])}")
    else:
        print(f"  Error: {res}")

    # 6. Admin unauthorized
    code, res = make_request("/admin/all-students")
    print(f"GET /admin/all-students (No Token) -> Status: {code}, Response: {res}")

    # 7. Admin authorized
    headers = {"Authorization": f"Bearer {ADMIN_SECRET}"}
    code, res = make_request("/admin/all-students", headers=headers)
    print(f"GET /admin/all-students (Authorized) -> Status: {code}")
    if code == 200:
        print(f"  Retrieved {len(res['data'])} students in admin list")
    else:
        print(f"  Error: {res}")


if __name__ == "__main__":
    test()
