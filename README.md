# APS Tracker — GL Bajaj Batch 2024-28

> Your academic leaderboard, report card tracker, and analytics hub — all in one place.

**Live at → [apstracker.netlify.app](https://apstracker.netlify.app)**

---

## What is this?

APS Tracker is a voluntary result tracking web app built specifically for the GL Bajaj Group of Institutions, Mathura — Batch 2024-28 (CSE, CSE AI/ML, CST).

Students upload their official AKTU result PDFs and the app automatically parses them, stores the data, and displays a live leaderboard with rankings, subject toppers, and detailed scorecards. No manual data entry. No scraping. Just upload your PDF and you're on the board.

---

## Features

- **Live Leaderboard** — Ranked by cumulative SGPA across all submitted semesters. Filter by branch, sort by performance, view semester-wise SGPA for every student.
- **Top 3 Podium** — Branch-aware podium that updates dynamically based on the active branch filter.
- **SGPA Trend Sparklines** — Tiny inline charts showing each student's SGPA progression across semesters at a glance.
- **Subject Toppers** — See who scored highest in every subject across each semester. Filters by branch and semester.
- **Student Search** — Find any student by name or roll number. View their full scorecard with semester summaries, subject-wise Internal + External marks, and grades.
- **Participation Tracker** — Live progress bar showing how many of the 600 batch students have submitted their results.
- **Branch Standings** — Side-by-side average SGPA comparison across CSE, CSE AI/ML, and CST.
- **Most Improved** — Highlights the student with the biggest SGPA jump between semesters.
- **Share Results** — Share a direct link to any student's result card.
- **OverPower (Admin Console)** — Full admin dashboard for managing submissions, viewing backlogs, tracking pending uploads, and managing student data. Protected by secret access key.

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Netlify |
| Backend | FastAPI (Python) | Render |
| Database | Supabase (PostgreSQL) | Supabase |
| PDF Parsing | pdfplumber | On backend |
| Animations | Framer Motion | — |

---

## How It Works

```
Student uploads AKTU result PDF + invite code
            ↓
Backend validates invite code + roll number against batch registry
            ↓
pdfplumber parses the PDF in memory (never saved to disk)
            ↓
Structured data stored in Supabase:
  students → semester_results → subject_marks
            ↓
Frontend reads from Supabase and displays leaderboard, scorecards, analytics
```

PDFs are **never stored** — they are parsed in memory and immediately discarded. Only the extracted data lives in the database.

---

## Project Structure

```
apstracker/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── page.tsx           # Home
│   │   ├── leaderboard/       # Leaderboard page
│   │   ├── subject/           # Subject toppers page
│   │   ├── search/            # Student search page
│   │   ├── upload/            # PDF upload page
│   │   └── admin/             # Admin console (OverPower)
│   ├── components/            # Reusable UI components
│   └── lib/
│       ├── api.ts             # Backend API call functions
│       └── supabase.ts        # Supabase client
│
├── backend/                   # FastAPI app
│   ├── main.py                # App entry point
│   ├── routers/
│   │   ├── upload.py          # PDF upload & parsing
│   │   ├── students.py        # Student data endpoints
│   │   ├── leaderboard.py     # Rankings & filters
│   │   └── admin.py           # Admin-only endpoints
│   ├── services/
│   │   ├── pdf_parser.py      # pdfplumber parsing logic
│   │   ├── db.py              # Supabase operations
│   │   └── validator.py       # Roll number validation
│   └── requirements.txt
│
└── scripts/
    └── seed_students.py       # One-time script to seed 600 students
```

---

## Database Schema

**`students`** — Pre-seeded with all 600 batch students. Tracks submission status.

**`results`** — One row per student. Stores overall SGPA, total backs, submission metadata.

**`semester_results`** — One row per student per semester. SGPA, result status, backs per sem.

**`subject_marks`** — One row per student per subject. Internal, external, total, grade, back paper status.

---

## Security

- Upload requires a **secret invite code** — only shared within the batch
- Admin console requires a separate **admin secret key**
- Both secrets use **constant-time comparison** (`hmac.compare_digest`) to prevent timing attacks
- **Rate limiting** on all endpoints — 10 uploads/min, 30 admin requests/min
- **Roll number validation** — only students in the pre-seeded batch registry can upload
- **PDF magic-byte validation** — rejects fake PDFs
- **5MB file size cap** — prevents memory exhaustion
- PDFs never written to disk — parsed in memory only
- CORS restricted to frontend origin only
- API docs (`/docs`, `/redoc`) disabled in production

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Netlify | Base: `frontend`, Build: `npm run build` |
| Backend | Render | Root: `backend`, Start: `uvicorn main:app --host 0.0.0.0 --port 10000` |
| Database | Supabase | Free tier, PostgreSQL |

> **Note:** Render free tier spins down after 15 minutes of inactivity. First request after sleep may take 30-50 seconds to respond.

> **Note:** Supabase free tier pauses the database after 7 days of inactivity. Resume it from the Supabase dashboard if the app stops working.

---

## Built By

Made with way too much free time by **APS** — CSE, GL Bajaj Group of Institutions, Mathura (Batch 2024-28).

If this helped you stalk your batchmates' GPAs, you're welcome. 😄

---

## License

This project is private and intended for internal use by GL Bajaj Batch 2024-28 only. Not affiliated with or endorsed by AKTU or GL Bajaj Group of Institutions.
