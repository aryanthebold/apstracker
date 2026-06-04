# AKTU Batch Result Tracker — Implementation Plan

## Project Overview

A web app where students of GL Bajaj (Batch 2024-28) can voluntarily upload their AKTU result PDFs. The app parses the PDF, stores structured data in a cloud database, and displays a public leaderboard with rankings, filters, and analytics. An admin panel gives full control to the owner.

---

## Tech Stack

| Layer | Technology | Hosting | Cost |
|---|---|---|---|
| Frontend | Next.js 14 (App Router) | Netlify | Free |
| Backend | FastAPI (Python) | Render | Free |
| Database | Supabase (PostgreSQL) | Supabase | Free |
| PDF Parsing | pdfplumber (Python library) | On backend | Free |
| Auth (Admin) | Supabase Auth | Supabase | Free |

---

## Folder Structure

```
aktu-tracker/
│
├── frontend/                        # Next.js app
│   ├── app/
│   │   ├── page.tsx                 # Home page
│   │   ├── leaderboard/
│   │   │   └── page.tsx             # Main leaderboard
│   │   ├── subject/
│   │   │   └── page.tsx             # Subject-wise toppers
│   │   ├── search/
│   │   │   └── page.tsx             # Student search page
│   │   ├── upload/
│   │   │   └── page.tsx             # Upload result page
│   │   ├── admin/
│   │   │   └── page.tsx             # Admin dashboard (protected)
│   │   └── layout.tsx               # Root layout with navbar
│   ├── components/                  # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── StudentCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── UploadModal.tsx
│   │   ├── SubjectToppers.tsx
│   │   └── StatsBar.tsx
│   ├── lib/
│   │   ├── api.ts                   # All backend API call functions
│   │   └── supabase.ts              # Supabase client
│   ├── public/
│   └── .env.local                   # API URL, Supabase keys
│
├── backend/                         # FastAPI app
│   ├── main.py                      # App entry point
│   ├── routers/
│   │   ├── upload.py                # PDF upload & parsing endpoint
│   │   ├── students.py              # Student data endpoints
│   │   ├── leaderboard.py           # Rankings & filters endpoints
│   │   └── admin.py                 # Admin-only endpoints
│   ├── services/
│   │   ├── pdf_parser.py            # pdfplumber parsing logic
│   │   ├── db.py                    # Supabase DB operations
│   │   └── validator.py             # Roll no. validation logic
│   ├── models/
│   │   └── schemas.py               # Pydantic data models
│   ├── requirements.txt
│   └── .env                         # Supabase URL, keys, invite code
│
├── scripts/
│   └── seed_students.py             # One-time script to import 600 students from PDF
│
└── README.md
```

---

## Database Schema (Supabase / PostgreSQL)

### Table: `students`
Seeded from the batch PDF. Every student exists here before they upload.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL,
  enrollment_number TEXT,
  name TEXT NOT NULL,
  father_name TEXT,
  branch TEXT CHECK (branch IN ('CSE', 'CSE_AIML', 'CST')),
  gender TEXT,
  has_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `results`
One row per student. Updated/replaced when they upload a newer PDF.

```sql
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE NOT NULL,
  total_semesters_submitted INTEGER,
  overall_sgpa FLOAT,
  total_backs INTEGER DEFAULT 0,
  has_backs BOOLEAN DEFAULT FALSE,
  raw_session_summary TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `semester_results`
One row per student per semester.

```sql
CREATE TABLE semester_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  semester INTEGER NOT NULL,
  sgpa FLOAT,
  total_marks INTEGER,
  result_status TEXT,
  backs_in_sem INTEGER DEFAULT 0,
  date_of_declaration DATE,
  UNIQUE(roll_number, semester)
);
```

### Table: `subject_marks`
One row per student per subject per semester.

```sql
CREATE TABLE subject_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  semester INTEGER NOT NULL,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_type TEXT CHECK (subject_type IN ('Theory', 'Practical', 'CA')),
  internal_marks INTEGER,
  external_marks INTEGER,
  total_marks INTEGER,
  grade TEXT,
  is_back BOOLEAN DEFAULT FALSE,
  UNIQUE(roll_number, subject_code)
);
```

---

## Upload & Parsing Pipeline

This is the core flow of the entire app.

```
Student uploads PDF
        │
        ▼
Backend receives PDF + invite code
        │
        ├─ Invite code wrong? → Reject immediately
        │
        ▼
Extract roll number from PDF (pdfplumber)
        │
        ├─ Roll number not in students table? → Reject (not from batch)
        │
        ▼
Parse full PDF:
  - Student info (name, father's name, branch, enrollment no.)
  - All semester blocks
  - Per semester: SGPA, result status, backs count
  - Per subject: code, name, type, internal, external, grade, back paper
        │
        ▼
Calculate derived fields:
  - overall_sgpa = average of all valid semester SGPAs
  - total_backs = sum of backs across all semesters
  - has_backs = total_backs > 0
        │
        ▼
Check if student already has a result (has_submitted = true)
        │
        ├─ YES (re-upload with more sems):
        │     Delete old semester_results and subject_marks for this student
        │     Insert fresh parsed data
        │     Update results row
        │     Update students.has_submitted = true
        │
        └─ NO (first upload):
              Insert into results, semester_results, subject_marks
              Update students.has_submitted = true
```

### PDF Parser Logic (`pdf_parser.py`)

The AKTU PDF has a consistent structure. Here's the parsing strategy:

```
1. Extract all text using pdfplumber page by page
2. Find header block → extract name, roll no, enrollment no, father's name, branch, gender
3. Find session summary line → extract overall result, total marks
4. Split remaining text into semester blocks by detecting "Semester : N" pattern
5. For each semester block:
   a. Extract SGPA, result status, total marks, date of declaration
   b. Skip block if "No Result found" is present
   c. Parse subject table rows: split by whitespace, map to columns
   d. Detect backs: if Back Paper column is not "--" → is_back = True
   e. Count backs in that semester
6. Return structured Python dict
```

### Handling Future Sem 4 Upload

When Sem 4 result is out and a student re-uploads:
- The new PDF will contain Sems 1, 2, 3, 4
- Backend detects `has_submitted = true` for this roll number
- **Deletes** all existing `semester_results` and `subject_marks` for that student
- Re-inserts everything fresh from the new PDF
- Updates `overall_sgpa`, `total_backs` etc. in `results` table
- No PDF file is stored on server — only parsed data in DB (so no storage concerns)

> PDFs are never saved to disk or cloud storage. They are parsed in memory and discarded. This saves storage and avoids privacy issues.

---

## API Endpoints

### Public Endpoints (no auth needed)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload PDF + invite code |
| `GET` | `/leaderboard` | Overall leaderboard with filters |
| `GET` | `/leaderboard/semester/{sem}` | Semester-wise leaderboard |
| `GET` | `/leaderboard/subject` | Subject-wise toppers |
| `GET` | `/leaderboard/branch/{branch}` | Branch-filtered leaderboard |
| `GET` | `/students/search?q=name` | Search student by name |
| `GET` | `/stats` | Batch stats (total submitted, avg SGPA etc.) |

### Query Parameters for `/leaderboard`

```
?branch=CSE             → filter by branch
?semester=2             → filter by semester
?sort=sgpa              → sort field
?order=desc             → sort direction
?has_backs=false        → only clean record students
?limit=50&offset=0      → pagination
```

### Admin Endpoints (protected by Supabase Auth token)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/all-students` | All 600 students with submission status |
| `GET` | `/admin/backs` | Full backs list with details |
| `DELETE` | `/admin/student/{roll}` | Delete a student's result |
| `GET` | `/admin/not-submitted` | Students yet to upload |

---

## Pages & Their Purpose

### `/` — Home Page
- Animated hero section with batch name and tagline
- Live stats bar: total submitted, batch average SGPA, total toppers
- Quick links to Leaderboard, Subject Toppers, Search
- **"Upload Your Result"** CTA button prominently placed

### `/leaderboard` — Main Leaderboard
- Full ranked list of all submitted students
- Filter bar: Branch, Semester, Has Backs toggle, Sort by
- Rank, Name, Branch, Sem-wise SGPAs, Overall SGPA, Backs count
- Highlighted top 3 with special styling

### `/subject` — Subject Toppers
- Dropdown to select semester → shows all subjects of that sem
- Per subject: top 3 students with their marks
- Branch filter available

### `/search` — Student Search
- Search bar by name or roll number
- If found → show their result card (SGPAs, ranks, subject marks)
- If NOT found → show **"Wanna help me? Upload their result"** button that opens upload modal

### `/upload` — Upload Page
- Invite code input
- PDF upload button
- Real-time feedback: parsing → validating → saving → done
- Error states: wrong invite code, roll not in batch, already uploaded (with re-upload option)

### `/admin` — Admin Dashboard (password protected)
- Submission progress (X of 600 submitted)
- Full student table with all data
- Backs management table
- Delete entries
- Not-submitted list

---

## Invite Code Flow

```
Student enters invite code on upload page
        │
Backend checks: code === process.env.INVITE_CODE
        │
        ├─ Wrong → 401 Unauthorized, show error
        └─ Correct → proceed with PDF parsing
```

The invite code is stored only in backend `.env` — never exposed to frontend source code. Frontend just sends it with the request.

---

## Seeding the Database (One-time Setup)

You have a PDF with all 600 student names and roll numbers. The script `scripts/seed_students.py` will:

1. Parse that PDF using pdfplumber
2. Extract name, roll number, branch for each student
3. Insert all 600 rows into `students` table with `has_submitted = false`

Run once before launch. After that the students table is the source of truth for validation.

---

## Deployment Checklist

### Backend (Render)
- [ ] Push backend folder to GitHub
- [ ] Create new Web Service on Render, connect GitHub repo
- [ ] Set root directory to `/backend`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
- [ ] Add environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `INVITE_CODE`, `ADMIN_SECRET`
- [ ] Note the deployed backend URL (e.g. `https://aktu-tracker.onrender.com`)

### Frontend (Netlify)
- [ ] Push frontend folder to GitHub
- [ ] Connect repo to Netlify
- [ ] Set base directory to `/frontend`
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `frontend/.next`
- [ ] Add environment variables: `NEXT_PUBLIC_API_URL` = your Render backend URL
- [ ] Add `netlify.toml` for Next.js support

### Supabase
- [ ] Create project on supabase.com
- [ ] Run all CREATE TABLE statements in SQL editor
- [ ] Enable Row Level Security (RLS) — public can only SELECT, only backend service key can INSERT/UPDATE/DELETE
- [ ] Get `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for backend env

---

## Development Build Order

Build in this exact order to avoid blockers:

```
1. Set up Supabase — create tables, get keys
2. Build pdf_parser.py — test locally with your result PDF
3. Build seed script — populate 600 students
4. Build FastAPI backend — upload, parse, save pipeline
5. Test all API endpoints with Postman or curl
6. Deploy backend to Render
7. Build Next.js frontend pages one by one
8. Connect frontend to live backend API
9. Deploy frontend to Netlify
10. Final end-to-end test on mobile
```

---

## Environment Variables

### Backend `.env`
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
INVITE_CODE=your_secret_code_here
ADMIN_SECRET=your_admin_password_here
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Key Technical Notes

- **No PDF stored** — parsed in memory, discarded after. Zero storage cost.
- **Re-upload safe** — old data wiped and replaced cleanly when student uploads newer PDF with more sems.
- **Branch detection** — parsed from the Branch Code & Name field in PDF header. Map: `(10) CSE`, `(12) CSE AI/ML`, `(11) CST` (verify codes from your batch PDF).
- **Back detection** — if `Back Paper` column value is not `--`, mark `is_back = true` for that subject.
- **SGPA = 0 semesters** — skipped during overall SGPA calculation (the empty placeholder semester in the PDF).
- **Render free tier sleeps** after 15 min of inactivity — first request after sleep takes ~30s. Acceptable for this scale.
