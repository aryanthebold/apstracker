# APS Tracker — Complete Project Documentation

> **Purpose of this document:** Full technical reference for every file in this repository. Written so a developer can rip out the entire frontend and replace it with a new one without breaking anything. All API contracts, data shapes, routing conventions, and backend behaviour are documented here.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Complete File Tree](#3-complete-file-tree)
4. [Database Layer (Supabase / PostgreSQL)](#4-database-layer)
5. [Backend (FastAPI / Python)](#5-backend)
6. [Frontend (Next.js 16 / React 19 / Tailwind v4)](#6-frontend)
7. [Frontend ↔ Backend API Contract](#7-frontend--backend-api-contract)
8. [Deployment Setup](#8-deployment-setup)
9. [Key Environment Variables](#9-key-environment-variables)
10. [Replacing the Frontend — What to Keep](#10-replacing-the-frontend--what-to-keep)

---

## 1. Project Overview

**APS Tracker** is an academic performance tracker for the GL Bajaj Group of Institutions (Mathura) CSE/CST batch of 2024–28. Students upload their official AKTU marksheet PDFs; the backend parses them and stores structured data in Supabase. The frontend displays a live leaderboard, subject toppers, a search page with full report cards, and a protected admin panel.

| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL) |
| Backend | FastAPI (Python 3.10) |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend Hosting | Render.com |
| Frontend Hosting | Netlify |

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Browser / Client                        │
│                   Next.js 16 (React 19, TSX)                   │
│  Pages: /  /leaderboard  /search  /subject  /upload  /admin   │
└───────────────────────────┬────────────────────────────────────┘
                            │  REST API calls (fetch)
                            │  NEXT_PUBLIC_API_URL env var
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Python)                    │
│  Hosted on Render.com                                          │
│  Routers: /upload  /leaderboard  /students  /admin             │
│  Rate limiting: 20 / 60 / 30 req per IP per minute             │
└───────────────────────────┬────────────────────────────────────┘
                            │  supabase-py client
                            │  SUPABASE_URL + SUPABASE_SERVICE_KEY
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                        │
│  Tables: students | results | semester_results | subject_marks │
└────────────────────────────────────────────────────────────────┘
```

**Data Flow for a PDF Upload:**
1. Student drops a PDF on `/upload` page → `UploadForm` component.
2. Frontend POSTs `multipart/form-data` (file + invite_code) to `POST /upload/`.
3. Backend validates invite code, size, MIME type, PDF magic bytes.
4. `pdf_parser.py` extracts structured data using PyMuPDF.
5. `db.py → save_parsed_result()` upserts all four tables in parallel.
6. Frontend receives `{ message, roll_number }` and shows success.

---

## 3. Complete File Tree

```
APS Tracker/
│
├── Project.md                      ← THIS FILE — full project reference
├── README.md                       ← General project readme
├── IMPLEMENTATION_PLAN.md          ← Dev planning notes
├── supabase_schema.sql             ← Raw SQL for the database schema
├── aktu_result_downloader.py       ← Standalone utility: bulk-download AKTU PDFs
├── render.yaml                     ← Render.com deployment config (backend)
├── netlify.toml                    ← Netlify deployment config (frontend)
├── .gitignore
│
├── backend/                        ← FastAPI Python backend
│   ├── main.py                     ← App factory, CORS, security headers, router registration
│   ├── requirements.txt            ← Python dependencies
│   ├── .env                        ← Local secrets (NEVER commit)
│   │
│   ├── models/
│   │   └── schemas.py              ← Pydantic response models (data contracts)
│   │
│   ├── services/
│   │   ├── db.py                   ← Supabase client, query helpers, save_parsed_result()
│   │   └── pdf_parser.py           ← PDF text extraction + structured parsing via PyMuPDF
│   │
│   └── routers/
│       ├── upload.py               ← POST /upload/  (invite code auth, file validation)
│       ├── leaderboard.py          ← GET /leaderboard/, /leaderboard/semester/{sem}, /leaderboard/subject
│       ├── students.py             ← GET /students/search, /students/stats, /students/{roll}
│       ├── admin.py                ← Admin-only endpoints (Bearer token auth)
│       └── rate_limit.py           ← In-memory sliding-window rate limiter
│
├── scripts/                        ← One-off helper scripts (dev/ops use only)
│   ├── seed_students.py            ← Seed the students table with batch roll numbers
│   ├── check_student.py            ← Quick DB lookup for a student
│   ├── extract_text.py             ← Debug PDF text extraction
│   ├── test_endpoints.py           ← Manual endpoint smoke tests
│   ├── test_fetch.py               ← Fetch test helper
│   ├── test_insert.py              ← Direct DB insert test
│   └── test_parser.py              ← PDF parser unit test
│
└── frontend/                       ← Next.js 16 application
    ├── package.json                ← Dependencies & npm scripts
    ├── next.config.ts              ← Next.js config + security response headers
    ├── tsconfig.json               ← TypeScript compiler config (@/ path alias)
    ├── postcss.config.mjs          ← PostCSS config (enables @tailwindcss/postcss v4)
    ├── eslint.config.mjs           ← ESLint rules
    ├── .env.local                  ← NEXT_PUBLIC_API_URL for local dev
    │
    ├── app/                        ← Next.js App Router (file-based routing)
    │   ├── layout.tsx              ← Root layout: Navbar, Backgrounds, Toaster, ScrollProgress
    │   ├── globals.css             ← ENTIRE design system: CSS vars, Tailwind theme, components
    │   ├── favicon.ico
    │   ├── page.tsx                ← / (Home): Hero, StatsBar, Top Performer, Branch Standings
    │   ├── leaderboard/
    │   │   └── page.tsx            ← /leaderboard: Podium + paginated ranked table + filters
    │   ├── search/
    │   │   └── page.tsx            ← /search: Debounced student search + expandable report card
    │   ├── subject/
    │   │   └── page.tsx            ← /subject: Subject toppers per semester with branch filter
    │   ├── upload/
    │   │   └── page.tsx            ← /upload: Thin shell, renders <UploadForm />
    │   ├── admin/
    │   │   └── page.tsx            ← /admin: Full admin dashboard (Bearer token gated)
    │   └── test-home/              ← Prototype/scratch page (not in production nav)
    │       └── page.tsx
    │
    ├── components/                 ← Reusable React components
    │   ├── Navbar.tsx              ← Desktop sticky nav pill + mobile hamburger slide-in drawer
    │   ├── ConstellationBackground.tsx  ← Canvas particle/star/meteor animation (global BG)
    │   ├── IridescentBackground.tsx     ← Alternative canvas gradient BG (not used in layout)
    │   ├── PageTransition.tsx      ← Framer Motion page fade+slide transition wrapper
    │   ├── SmoothScroll.tsx        ← Lenis smooth-scroll initialiser wrapper
    │   ├── ScrollProgressBar.tsx   ← Thin fixed bar at top showing scroll percentage
    │   ├── ScrollReveal.tsx        ← Intersection Observer reveal animation wrapper
    │   ├── StatsBar.tsx            ← 4-stat grid: submitted, avg SGPA, top SGPA, clean records
    │   ├── ParticipationBar.tsx    ← Progress bar: X of Y students uploaded
    │   ├── MostImprovedCard.tsx    ← Top performer spotlight card (home page)
    │   ├── BranchStandingsCard.tsx ← Branch-wise avg SGPA comparison card (home page)
    │   ├── Podium.tsx              ← Gold/Silver/Bronze podium for top 3 (leaderboard page)
    │   ├── LeaderboardTable.tsx    ← Ranked table with expandable student detail inline panels
    │   ├── FilterBar.tsx           ← Branch / sort / order filter pill controls
    │   ├── Sparkline.tsx           ← Tiny SVG SGPA-per-semester trend chart
    │   ├── AnimatedNumber.tsx      ← Number that counts up from 0 using useCountUp
    │   └── UploadForm.tsx          ← Full upload UI: dropzone, queue, steps, per-file status
    │
    ├── hooks/
    │   └── useCountUp.ts           ← RAF-based count-up animation hook (ease-out cubic)
    │
    ├── lib/
    │   ├── api.ts                  ← ALL fetch functions + TypeScript interfaces for every entity
    │   └── utils.ts                ← cn() className merge utility (like clsx, no dependency)
    │
    └── public/                     ← Static assets served at /
        ├── favicon.svg
        └── *.svg                   ← Default Next.js placeholder SVGs
```

---

## 4. Database Layer

**Provider:** Supabase (hosted PostgreSQL)  
**Schema file:** `supabase_schema.sql`

### Table: `students` — Master list (pre-seeded before any uploads)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto-generated |
| `roll_number` | TEXT UNIQUE NOT NULL | AKTU roll number, primary lookup key |
| `enrollment_number` | TEXT | populated on first PDF upload |
| `name` | TEXT NOT NULL | student full name |
| `father_name` | TEXT | populated on first PDF upload |
| `branch` | TEXT | `CSE` \| `CSE_AIML` \| `CST` |
| `gender` | TEXT | populated on first PDF upload |
| `has_submitted` | BOOLEAN DEFAULT FALSE | set to true after first successful upload |
| `created_at` | TIMESTAMP | |

> **Critical:** Students must be pre-seeded via `scripts/seed_students.py` before any uploads can succeed. The upload endpoint validates the roll number against this table.

---

### Table: `results` — Aggregated per-student summary

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `student_id` | UUID FK → students | cascade delete |
| `roll_number` | TEXT UNIQUE | same as students.roll_number |
| `total_semesters_submitted` | INTEGER | number of semesters in the uploaded PDF |
| `overall_sgpa` | FLOAT | average of all semester SGPAs |
| `total_backs` | INTEGER | total back papers across all semesters |
| `has_backs` | BOOLEAN | true if total_backs > 0 OR session summary says FAIL |
| `raw_session_summary` | TEXT | raw result status string from PDF; may contain `UFM_FLAG:` |
| `uploaded_at` | TIMESTAMP | first upload |
| `updated_at` | TIMESTAMP | last re-upload |

---

### Table: `semester_results` — One row per semester per student

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `student_id` | UUID FK → students | |
| `roll_number` | TEXT NOT NULL | |
| `semester` | INTEGER NOT NULL | 1–8 |
| `sgpa` | FLOAT | |
| `total_marks` | INTEGER | |
| `result_status` | TEXT | |
| `backs_in_sem` | INTEGER DEFAULT 0 | |
| `date_of_declaration` | DATE | |
| UNIQUE | `(roll_number, semester)` | |

---

### Table: `subject_marks` — One row per subject per student

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `student_id` | UUID FK → students | |
| `roll_number` | TEXT NOT NULL | |
| `semester` | INTEGER NOT NULL | |
| `subject_code` | TEXT NOT NULL | e.g. `KCS301` |
| `subject_name` | TEXT NOT NULL | |
| `subject_type` | TEXT | `Theory` \| `Practical` \| `CA` |
| `internal_marks` | INTEGER | |
| `external_marks` | INTEGER | |
| `total_marks` | INTEGER | |
| `grade` | TEXT | e.g. `A`, `B+`, `F` |
| `is_back` | BOOLEAN DEFAULT FALSE | true if this subject is a back paper |
| UNIQUE | `(roll_number, subject_code)` | |

---

### How Data is Written on Upload

`services/db.py → save_parsed_result()` runs these steps:
1. UPDATE `students` row: set enrollment_number, gender, father_name, has_submitted=true.
2. DELETE existing `semester_results` and `subject_marks` for this student (parallel, makes re-upload safe).
3. Compute derived values: `overall_sgpa` (average of semester SGPAs), `total_backs`, `has_backs`.
4. UPSERT `results` row on `roll_number` conflict.
5. INSERT all `semester_results` rows.
6. INSERT all `subject_marks` rows.
7. Steps 4–6 execute in parallel via `asyncio.gather`.

---

## 5. Backend

**Language:** Python 3.10  
**Framework:** FastAPI  
**Server:** Uvicorn  
**Dependencies:** fastapi, uvicorn, pymupdf, supabase, python-dotenv, pydantic, python-multipart

### `main.py` — App Entry Point

- Creates FastAPI instance. Docs (`/docs`, `/redoc`) only available in `ENV=development`.
- CORS: reads `ALLOWED_ORIGINS` env var; never uses wildcard `*`.
- Security headers middleware on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Content-Security-Policy`, `X-XSS-Protection`, `Permissions-Policy`.
- Registers routers: `upload`, `leaderboard`, `admin`, `students`.

---

### `models/schemas.py` — Pydantic Data Models

| Model | Fields | Purpose |
|---|---|---|
| `SubjectMarkBase` | subject_code, subject_name, subject_type, internal_marks, external_marks, total_marks, grade, is_back | Single subject entry |
| `SemesterResultBase` | semester, sgpa, total_marks, result_status, backs_in_sem, date_of_declaration, subjects[] | One semester |
| `ParsedResult` | roll_number, enrollment_number, name, father_name, branch, gender, overall_result_status, overall_total_marks, semesters[] | Full parsed PDF |
| `StudentResponse` | id, roll_number, name, branch, has_submitted | Lightweight student card |
| `LeaderboardEntry` | student_id, roll_number, name, branch, overall_sgpa, total_backs, has_backs, total_semesters_submitted | One leaderboard row |
| `PaginatedLeaderboard` | data[], total, offset, limit | Paginated wrapper |

---

### `services/db.py` — Database Layer

- Creates singleton Supabase client from `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
- `get_db()` → returns the client (used in all routers via dependency).
- `get_student_by_roll(roll_number)` → single query to students table.
- `save_parsed_result(student_id, roll_number, parsed_data)` → full async upsert flow (described above).

---

### `services/pdf_parser.py` — PDF Parser

- Takes raw PDF bytes as input.
- Uses **PyMuPDF** (`fitz`) to extract text page by page.
- Parses: student name, roll number, enrollment number, gender, father's name, branch.
- Parses each semester block: SGPA, total marks, result status, declaration date, backs count.
- Parses each subject row: code, name, type, marks, grade, is_back flag.
- Detects UFM (Unfair Means) flags in result status strings; embeds `UFM_FLAG:<remark>` in `raw_session_summary`.
- Returns a dict matching the `ParsedResult` shape.

---

### `routers/rate_limit.py` — Rate Limiter

In-memory sliding-window rate limiter keyed by client IP. Uses `X-Forwarded-For` header if behind a proxy.

| Instance | Limit | Used on |
|---|---|---|
| `upload_limiter` | 20 req / 60 sec | POST /upload/ |
| `admin_limiter` | 30 req / 60 sec | all /admin/* |
| `general_limiter` | 60 req / 60 sec | /students/*, /leaderboard/* |

Returns HTTP 429 with `Retry-After` header if limit exceeded.

---

### `routers/upload.py` — `POST /upload/`

**Auth:** `invite_code` form field (constant-time compare via `hmac.compare_digest`).

**Validation pipeline (in order):**
1. Invite code must match `INVITE_CODE` env var.
2. Filename must end in `.pdf`.
3. MIME type must be `application/pdf` or `application/x-pdf`.
4. File content ≤ 5 MB.
5. First 4 bytes must be `%PDF` (magic bytes check).
6. Roll number must exist in `students` table.
7. Parsed PDF must contain at least one semester block.
8. Entire process wrapped in 25-second timeout.

**Success response:** `{ "message": "Result uploaded and parsed successfully", "roll_number": "..." }`

---

### `routers/leaderboard.py` — `/leaderboard`

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/leaderboard/` | branch, sort (sgpa\|backs), order (asc\|desc), has_backs (bool), limit (1–200), offset | Overall ranked list from `results` joined with `students` |
| GET | `/leaderboard/semester/{sem}` | branch, limit (1–100), offset | Per-semester ranking from `semester_results` |
| GET | `/leaderboard/subject` | semester (required, 1–8), branch | Top 3 scorers per subject code for a given semester |

All `branch` values are allowlisted against `{CSE, CSE_AIML, CST, CST_IOT}`.

All responses: `{ "data": [...] }`

---

### `routers/students.py` — `/students`

| Method | Path | Description |
|---|---|---|
| GET | `/students/search?q=` | Case-insensitive search on name + roll_number. Min 3 chars. Returns max 25 results with SGPA, rank, UFM flag. |
| GET | `/students/stats` | Batch-level aggregates for the stats bar. |
| GET | `/students/{roll_number}` | Full report card: student info + result summary + all semesters + all subjects. Includes computed rank. |

**`/students/stats` response shape:**
```json
{
  "total_students": 120,
  "total_submitted": 87,
  "average_sgpa": 7.42,
  "total_backs": 23,
  "top_sgpa": 9.51,
  "clean_records": 64
}
```

**`/students/{roll}` response shape:**
```json
{
  "student": { "id", "roll_number", "enrollment_number", "name", "father_name", "branch", "gender", "has_submitted", "created_at", "rank" },
  "result": { "id", "student_id", "roll_number", "total_semesters_submitted", "overall_sgpa", "total_backs", "has_backs", "raw_session_summary", "uploaded_at", "updated_at", "rank" },
  "semesters": [
    {
      "id", "student_id", "roll_number", "semester", "sgpa", "total_marks", "result_status", "backs_in_sem", "date_of_declaration",
      "subjects": [
        { "id", "student_id", "roll_number", "semester", "subject_code", "subject_name", "subject_type", "internal_marks", "external_marks", "total_marks", "grade", "is_back" }
      ]
    }
  ]
}
```

---

### `routers/admin.py` — `/admin`

All endpoints require:
```
Authorization: Bearer <ADMIN_SECRET>
```
Constant-time compare. Min 16 chars enforced at startup.

| Method | Path | Description |
|---|---|---|
| GET | `/admin/all-students` | All students with SGPA and computed rank |
| GET | `/admin/not-submitted` | Students with has_submitted=false |
| GET | `/admin/backs` | Students with total_backs > 0 or has_backs=true (deduped merge). Also returns individual back subjects. Auto-repairs corrupted has_backs flags. |
| POST | `/admin/repair-backs` | Recounts total_backs from subject_marks for every student, fixes has_backs and cleared flags. |
| GET | `/admin/ufm-students` | Students with `UFM_FLAG` in raw_session_summary. Extracts and returns the UFM remark. |
| PATCH | `/admin/student/{roll}` | Update name and/or branch. Only these two fields allowed. |
| DELETE | `/admin/student/{roll}` | Deletes semester_results, subject_marks, results for that student. Resets has_submitted=false. |

---

## 6. Frontend

**Framework:** Next.js 16 (App Router)  
**UI:** React 19 with TypeScript  
**Styling:** Tailwind CSS v4 (CSS-first, no config file)  
**Animation:** Framer Motion (page transitions), Lenis (smooth scroll), Canvas API (background)  
**State Management:** Local React state only (no Redux, Zustand, etc.)  
**Key Dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.6 | Framework |
| `react` | 19.2.4 | UI library |
| `framer-motion` | 12.40.0 | Page transition animations |
| `lenis` | 1.3.25 | Smooth scrolling |
| `lucide-react` | 1.16.0 | Icon library |
| `react-dropzone` | 15.0.0 | Drag-and-drop file upload zone |
| `@tanstack/react-virtual` | 3.14.5 | Virtualised list in UploadForm |
| `react-hot-toast` | 2.6.0 | Toast notifications |
| `tailwindcss` | 4.x | Styling |

---

### 6.1 Configuration

**`next.config.ts`** — Security headers applied to ALL routes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy` — restricts scripts to `'self' 'unsafe-inline' 'unsafe-eval'` (Next.js needs unsafe-inline for hydration), styles allow Google Fonts, connect-src allows the API URL.
- `Strict-Transport-Security: max-age=31536000` (HTTPS enforcement).

**`.env.local`:**
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

### 6.2 App Directory (Pages & Routing)

#### `app/layout.tsx` — Root Layout (wraps every page)

Sets `<html lang="en" className="dark">`. Loads fonts. Contains:
- **ConstellationBackground** — canvas animation (fixed, z-index below content).
- **Floating gradient blobs** — violet, fuchsia, cyan divs with blur animations.
- **Twinkling stars** — 20 hardcoded `<div>` dots with CSS twinkle animation.
- **Slow drifting nebula clouds** — two blurred gradient divs.
- **Toaster** — react-hot-toast at top-right.
- **ScrollProgressBar** — fixed thin indicator at top.
- **Navbar** — sticky, on top.
- **SmoothScroll** — Lenis wrapper around `<main>`.
- **PageTransition** — Framer Motion inside SmoothScroll.

---

#### `app/page.tsx` — Home Page (`/`)

`'use client'` component. Two sections:

**Section 1: Hero**
- Batch badge pill.
- Giant "APS Tracker" heading with gradient glow.
- Subtitle text.
- `<ParticipationBar />` — calls `fetchStats()`.
- Two CTA buttons → `/leaderboard` and `/upload`.
- Live Batch Performance panel:
  - `<StatsBar />` — calls `fetchStats()`.
  - `<MostImprovedCard />` — calls `fetchLeaderboard({ limit: 1 })`.
  - `<BranchStandingsCard />` — calls `fetchLeaderboard` 3 times (once per branch).
- Scroll hint chevron.

**Section 2: Features Bento Grid**
- 3 cards linking to `/leaderboard`, `/subject`, `/search`.
- Footer note with aktu.ac.in link.

---

#### `app/leaderboard/page.tsx` — Leaderboard (`/leaderboard`)

`'use client'` component. Key state:
- `filters: FilterState` — branch, sort (sgpa|backs), order (asc|desc).
- `page: number` — current pagination page (0-indexed).
- `top3: LeaderboardEntry[]` — always shows global top 3 for podium.
- `entries: LeaderboardEntry[]` — current page of ranked entries (rank 4+).
- `localSearch: string` — client-side filter on name/roll (filters current page only).

**Pagination logic:**
- Page 0: fetches `limit = PAGE_SIZE(10) + 3 + 1 = 14` from offset 0. First 3 → Podium. Next 10 → Table.
- Page N: fetches `limit = 11, offset = 3 + N * 10`. Next-page peek: if 11 results returned, there's a next page.

**Child components used:**
- `<FilterBar />` → emits FilterState via onFilterChange.
- `<Podium topEntries={top3} />` → always the global top 3.
- `<LeaderboardTable entries={filteredEntries} startIndex={listStartRank} />`.
- `<ScrollReveal>` wraps sections for enter animations.

---

#### `app/search/page.tsx` — Search (`/search`)

`'use client'` component wrapped in `<Suspense>` (needed for `useSearchParams()`).

- Reads `?q=` URL param on mount → pre-fills search input.
- Debounces input by 400ms before triggering `searchStudents(q)`.
- Results: list of student cards with name, roll, branch, SGPA, rank.
- Click card → expands inline; calls `fetchStudentDetails(roll)` lazily (cached in state).
- Expanded view: shows all semesters, each with a subject marks table.
- Share button: copies `?q=rollNumber` URL to clipboard.
- Easter egg: specific roll `2405110100040` shows error toast instead of details.

---

#### `app/subject/page.tsx` — Subject Toppers (`/subject`)

`'use client'` component.

- On mount: `Promise.allSettled` calls `fetchSubjectToppers(s)` for semesters 1–8 in parallel to discover which have data.
- Defaults to the highest available semester.
- Semester pill selector + branch dropdown filter.
- Calls `fetchSubjectToppers(semester, branch)` on filter change.
- Card grid: one card per subject showing top 3 scorers with their marks.

---

#### `app/upload/page.tsx` — Upload (`/upload`)

Thin server component. Just renders a page header and `<UploadForm />`.

---

#### `app/admin/page.tsx` — Admin Panel (`/admin`)

`'use client'` component (~67 KB). Full admin dashboard.

- **Token gate:** input field prompts for Bearer token, stored in component state only.
- **Five tabs:** All Students | Not Submitted | With Backs | UFM Students | Actions.
- **All Students:** Table with rank, name, roll, branch, SGPA, submitted status. Delete button (calls `adminDeleteStudentResult`). Inline edit form for name/branch (calls `adminUpdateStudent`).
- **Not Submitted:** List of students who haven't uploaded yet.
- **With Backs:** Two sub-views — students with back papers, and individual back subjects.
- **UFM Students:** Students flagged as Unfair Means with their UFM remark.
- **Actions:** Button to trigger `POST /admin/repair-backs`.

All data fetched using admin functions from `lib/api.ts`.

---

### 6.3 Components

#### `Navbar.tsx`
Sticky header. Desktop: pill-shaped frosted glass nav with text links + "Upload Result" CTA button. Mobile: top header with hamburger button → slide-in drawer from right with icon links. Active route highlighted. Closes drawer on route change.

Nav links: Home (`/`), Leaderboard (`/leaderboard`), Subjects (`/subject`), Search (`/search`), OverPower (`/admin`).

---

#### `ConstellationBackground.tsx`
Canvas-based animated background. Features:
- Three tiers of stars (dim/mid/bright) with individual twinkle speeds.
- Stars drift slowly.
- Lines drawn between stars within proximity threshold (constellation effect).
- On home page: additional bright "constellation" stars + interactive mouse parallax.
- Periodic meteor shower with glowing trails.
- Adapts animation intensity based on current route (`usePathname()`).

---

#### `PageTransition.tsx`
Framer Motion `AnimatePresence` + `motion.div` wrapper. Applies fade-in (opacity 0→1) and slight Y translate (8px→0) on each page load. Uses `pathname` as the animation key.

---

#### `SmoothScroll.tsx`
Initialises Lenis on mount. Attaches Lenis to `requestAnimationFrame`. Cleans up on unmount. Wraps children in a div.

---

#### `ScrollProgressBar.tsx`
Fixed `<div>` at top of viewport. `width` CSS property is updated on `scroll` event to `(scrollY / (scrollHeight - innerHeight)) * 100%`. Blue gradient colour.

---

#### `ScrollReveal.tsx`
Uses `IntersectionObserver`. Children start invisible and transform-translated. When the element enters the viewport, it transitions to visible. Supports `direction` prop (`up` | `down` | `scale`), `delay`, `duration`, `threshold`.

---

#### `StatsBar.tsx`
Calls `fetchStats()` on mount (unless `initialStats` prop provided). Renders 4 stat cards in a grid:
- Students Submitted (with "X of Y (Z%)" subtext).
- Batch Avg SGPA.
- Top SGPA.
- Clean Records (students with 0 backs).

Each value rendered via `<AnimatedNumber />`.

---

#### `ParticipationBar.tsx`
Calls `fetchStats()`. Renders a horizontal progress bar showing submission percentage. Animated width transition. Shows count and percentage label.

---

#### `MostImprovedCard.tsx`
Calls `fetchLeaderboard({ limit: 1, sort: 'sgpa', order: 'desc' })`. Shows the top-ranked student: name, roll, branch, SGPA, rank badge.

---

#### `BranchStandingsCard.tsx`
Calls `fetchLeaderboard` three times in parallel (once per branch: CSE, CSE_AIML, CST) each with `limit: 50`. Computes average SGPA for each branch. Displays three branch rows with bar chart comparison.

---

#### `Podium.tsx`
Props: `topEntries: LeaderboardEntry[]` (expects exactly 3 entries).
Renders a 3-column podium layout: 2nd (silver, medium height) | 1st (gold, tallest) | 3rd (bronze, shortest). Shows name, SGPA, backs badge.

---

#### `LeaderboardTable.tsx`
Props: `entries: LeaderboardEntry[]`, `startIndex?: number` (default 4).

Full leaderboard table with columns: Rank | Student (avatar initials + name + roll) | Branch | SGPA | Backs | Expand button.

Click row → calls `fetchStudentDetails(roll)` lazily. Expanded panel shows:
- Semester-by-semester SGPA with `<Sparkline />` trend chart.
- Backs per semester.
- Each semester's subjects as a nested table (subject code, name, type, marks, grade, is_back badge).

Easter egg: specific roll returns a toast error instead.

---

#### `FilterBar.tsx`
Props: `onFilterChange: (filters: FilterState) => void`.
`FilterState` = `{ branch: string, sort: 'sgpa'|'backs', order: 'asc'|'desc' }`.

Renders branch selector buttons (All / CSE / CSE AI/ML / CST), Sort toggle (SGPA / Backs), Order toggle (↑ Asc / ↓ Desc). Calls `onFilterChange` immediately on any change.

---

#### `Sparkline.tsx`
Props: `data: number[]` (array of SGPA values).
Renders an SVG polyline chart. Normalises values to fit within the SVG viewBox. Draws the line, adds circle dots at data points. No axes. Purely decorative/indicative.

---

#### `AnimatedNumber.tsx`
Props: `value: number`, `decimals?: number`, `enabled?: boolean`.
Uses `useCountUp(value, 800, enabled)` hook. Renders the animated value as a formatted string.

---

#### `UploadForm.tsx`
Full upload UI. State machine around the upload lifecycle:
- **States:** `idle` | `uploading` | `parsing` | `saving` | `done`.
- Uses `react-dropzone` for drag-and-drop + click-to-browse.
- Accepts multiple PDF files (queued).
- Shows animated step progress: Uploading PDF → Parsing Result → Saving to DB → Done!
- Per-file status badge: idle / uploading / success / error.
- Invite code input field (required).
- Uses `@tanstack/react-virtual` for virtualised file list (handles many files efficiently).
- `friendlyError()` function maps raw API error messages to user-friendly copy.
- On success: shows roll number and link to search page.

---

### 6.4 Hooks

#### `useCountUp.ts`
```typescript
useCountUp(target: number, duration = 800, enabled = true): number
```
Uses `requestAnimationFrame`. Animates from 0 to `target` over `duration` milliseconds using ease-out cubic easing: `eased = 1 - (1 - progress)³`. Returns the current animated value.

---

### 6.5 Lib

#### `lib/api.ts` — The API Layer

Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'`

**TypeScript Interfaces (mirrors DB + API responses):**

```typescript
interface Student {
  id: string;
  roll_number: string;
  enrollment_number: string | null;
  name: string;
  father_name: string | null;
  branch: 'CSE' | 'CSE_AIML' | 'CST' | string;
  gender: string | null;
  has_submitted: boolean;
  has_ufm?: boolean;
  rank?: number | null;
  overall_sgpa?: number | null;
  created_at: string;
}

interface OverallResult {
  id: string; student_id: string; roll_number: string;
  total_semesters_submitted: number; overall_sgpa: number | null;
  total_backs: number; has_backs: boolean;
  raw_session_summary: string | null;
  uploaded_at: string; updated_at: string; rank?: number | null;
  students?: Student;
}

interface LeaderboardEntry extends OverallResult { students: Student; }

interface SemesterResult {
  id: string; student_id: string; roll_number: string;
  semester: number; sgpa: number | null; total_marks: number | null;
  result_status: string | null; backs_in_sem: number;
  date_of_declaration: string | null; students?: Student;
}

interface SubjectMark {
  id: string; student_id: string; roll_number: string; semester: number;
  subject_code: string; subject_name: string;
  subject_type: 'Theory' | 'Practical' | 'CA' | string;
  internal_marks: number | null; external_marks: number | null;
  total_marks: number | null; grade: string | null;
  is_back: boolean; students?: Student;
}

interface BatchStats {
  total_students: number; total_submitted: number; average_sgpa: number;
  total_backs: number; top_sgpa: number; clean_records: number;
}

interface SubjectToppers {
  subject_name: string; subject_code: string;
  top_3: (SubjectMark & { students: Student })[];
}

interface StudentDetails {
  student: Student;
  result: OverallResult | null;
  semesters: (SemesterResult & { subjects: SubjectMark[] })[];
}
```

**Fetch Functions:**

| Function | Method + Path | Returns |
|---|---|---|
| `fetchStats()` | GET /students/stats | `BatchStats` |
| `fetchLeaderboard(params)` | GET /leaderboard/ | `{ data: LeaderboardEntry[] }` |
| `fetchSemesterLeaderboard(sem, branch?, limit?, offset?)` | GET /leaderboard/semester/{sem} | `{ data: (SemesterResult & {students})[] }` |
| `fetchSubjectToppers(semester, branch?)` | GET /leaderboard/subject | `{ data: SubjectToppers[] }` |
| `searchStudents(query)` | GET /students/search?q= | `{ data: Student[] }` |
| `fetchStudentDetails(rollNumber)` | GET /students/{roll} | `StudentDetails` |
| `uploadResult(file, inviteCode)` | POST /upload/ | `{ message: string, roll_number: string }` |
| `adminFetchAllStudents(token)` | GET /admin/all-students | `{ data: Student[] }` |
| `adminFetchNotSubmitted(token)` | GET /admin/not-submitted | `{ data: Student[] }` |
| `adminFetchBacks(token)` | GET /admin/backs | `AdminBacks` |
| `adminFetchUFMStudents(token)` | GET /admin/ufm-students | `{ data: UFMStudent[] }` |
| `adminDeleteStudentResult(roll, token)` | DELETE /admin/student/{roll} | `{ message: string }` |
| `adminUpdateStudent(roll, data, token)` | PATCH /admin/student/{roll} | `{ message, updated }` |

#### `lib/utils.ts`

```typescript
cn(...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]): string
```
Concatenates CSS class names. Filters falsy values. Expands object inputs using `{ 'class-name': condition }` pattern.

---

### 6.6 Global Styles — Design System

`app/globals.css` (828 lines) is the complete design system.

**Color System (all mapped to Tailwind `color-*` utilities via `@theme`):**

| Token | Value | Purpose |
|---|---|---|
| `bg-primary` | `#080A0F` | Deep space black — main background |
| `bg-secondary` | `#0E1118` | Card backgrounds |
| `bg-tertiary` | `#161B27` | Table rows, hover states |
| `bg-glass` | `rgba(255,255,255,0.025)` | Glass panel base fill |
| `accent-primary` | `#5B9CF6` | Electric blue — CTAs, active states, primary |
| `accent-gold` | `#F5C842` | Gold — stats, 1st place |
| `accent-silver` | `#C0C0C0` | Silver — 2nd place |
| `accent-bronze` | `#CD7F32` | Bronze — 3rd place |
| `accent-success` | `#3DDC84` | Green — success, clean records |
| `accent-danger` | `#FF5C5C` | Red — errors, backs |
| `accent-violet` | `#A78BFA` | Purple — top SGPA stat |
| `accent-cyan` | `#22D3EE` | Cyan — accent details |
| `text-primary` | `#EEF2FF` | Main body text |
| `text-secondary` | `#8B95A1` | Labels, captions |
| `text-tertiary` | `#3D4757` | Very faint text |
| `border-subtle` | `rgba(255,255,255,0.055)` | Panel borders |

**Typography:**
- Body: DM Sans
- Headings (h1–h3): Syne
- Monospace: JetBrains Mono
- Logo: Coolvetica

**Reusable Component Classes:**

| Class | Description |
|---|---|
| `.glass-panel` | `backdrop-blur-xl bg-bg-glass border border-border-subtle` — glass card |
| `.glass-panel-hover` | Adds `hover:bg-bg-glass-hover hover:border-border-accent` |
| `.btn-pebble` | Pill-shaped button with border + backdrop blur |
| `.glow-blue` | Blue box shadow glow — primary CTA buttons |
| `.glow-subtle` | Softer glow — secondary buttons |
| `.liquid-glass-nav` | Frosted glass effect for the navbar pill |
| `.input-glass` | Dark glass input field style |
| `.skeleton-shimmer` | Animated shimmer gradient for loading skeletons |
| `.text-gradient-blue` | `bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent` |
| `.logo-glow-gradient` | Same gradient + drop-shadow glow for the hero logo |
| `.animate-blob-float-1/2/3` | Slow floating animations for bg blobs |
| `.animate-cloud-drift-1/2` | Slow drifting for nebula cloud overlays |
| `.animate-fade-in-up` | Slide-up + fade-in entry animation |
| `.animate-fade-in-down` | Slide-down + fade-in entry animation |
| `.animate-glow-pulse` | Pulsing glow / brightness animation |
| `.animate-live-blink` | Breathing blink for "Live" indicator dot |
| `.animate-tr-fade` | Staggered table row fade-in |
| `@keyframes twinkle` | Star twinkle (opacity oscillation) |

---

## 7. Frontend ↔ Backend API Contract

**This section is the single most important thing to read before redesigning the frontend.**

All API calls live in `lib/api.ts`. Keep that file intact (or recreate it in your framework) and every page will work.

### Base URL Configuration
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### All Endpoints

```
# Public endpoints (no auth)
GET  /students/stats
GET  /students/search?q={string}
GET  /students/{roll_number}

GET  /leaderboard/?branch=&sort=sgpa|backs&order=asc|desc&has_backs=bool&limit=1-200&offset=0
GET  /leaderboard/semester/{1-8}?branch=&limit=1-100&offset=0
GET  /leaderboard/subject?semester=1-8&branch=

POST /upload/
  Content-Type: multipart/form-data
  Fields:
    file: File (PDF, max 5MB)
    invite_code: string

# Admin endpoints (Bearer token required)
GET    /admin/all-students
GET    /admin/not-submitted
GET    /admin/backs
GET    /admin/ufm-students
POST   /admin/repair-backs
PATCH  /admin/student/{roll_number}
  Content-Type: application/json
  Body: { "name"?: string, "branch"?: "CSE"|"CSE_AIML"|"CST" }
DELETE /admin/student/{roll_number}
```

### Error Format
```json
{ "detail": "Human-readable error message" }
```
Status codes: `400` (bad request), `401` (auth failed), `404` (not found), `413` (file too large), `429` (rate limited), `500` (server error), `504` (timeout).

### Admin Auth Header
```
Authorization: Bearer <ADMIN_SECRET>
```

---

## 8. Deployment Setup

### Backend — Render.com

`render.yaml`:
```yaml
services:
  - type: web
    name: aps-tracker-backend
    env: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment variables set in Render dashboard:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (or `SUPABASE_KEY`), `INVITE_CODE`, `ADMIN_SECRET`, `ALLOWED_ORIGINS` (set to Netlify URL), `ENV=production`.

### Frontend — Netlify

`netlify.toml`:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Environment variable in Netlify dashboard:
- `NEXT_PUBLIC_API_URL` = your Render backend URL.

---

## 9. Key Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key (bypasses RLS) |
| `INVITE_CODE` | ✅ | Secret code students enter to upload results |
| `ADMIN_SECRET` | ✅ | Bearer token for /admin/* (min 16 characters) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend URLs for CORS, e.g. `https://apstracker.netlify.app` |
| `ENV` | optional | Set to `development` to enable /docs and /redoc. Default: `production` |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Full deployed backend URL without trailing slash |

---

## 10. Replacing the Frontend — What to Keep

### MUST Keep (do not change these files)

1. **`lib/api.ts`** — All TypeScript interfaces and fetch functions. This is the contract between your new UI and the backend. Copy it verbatim into any React/Next.js project.
2. **`lib/utils.ts`** — The `cn()` utility (optional but used in components).
3. **`hooks/useCountUp.ts`** — Standalone animation hook (optional, can be recreated).
4. **`.env.local`** — Must define `NEXT_PUBLIC_API_URL`.
5. **`netlify.toml`** — Adjust only if changing framework/output directory.

### CAN Completely Replace

Every file in:
- `app/` — all pages (page.tsx files)
- `components/` — all components
- `app/globals.css` — entire design system
- `app/layout.tsx` — root layout wrapper

### MUST NOT Touch

- `backend/` — all backend code is stable, do not change.
- `supabase_schema.sql` — database schema is fixed.
- `scripts/` — operational helper scripts, not needed for frontend.

---

### Step-by-Step Frontend Replacement Guide

1. **Copy** `frontend/lib/api.ts` and `frontend/lib/utils.ts` into your new project's lib directory.
2. **Set** `NEXT_PUBLIC_API_URL` in your new `.env.local`.
3. **Re-implement** these 6 pages using the API functions:

| Page | API Functions | Notes |
|---|---|---|
| Home / | `fetchStats()`, `fetchLeaderboard({ limit: 1 })` | Stats bar, top performer |
| /leaderboard | `fetchLeaderboard(params)` | Paginated, offset=3 for podium separation |
| /search | `searchStudents(q)`, `fetchStudentDetails(roll)` | Debounce 400ms, lazy expand |
| /subject | `fetchSubjectToppers(sem, branch)` | Probe all 8 sems on mount |
| /upload | `uploadResult(file, inviteCode)` | `multipart/form-data` |
| /admin | All `admin*` functions | Requires `Authorization: Bearer <token>` |

4. **Upload form requirements:**
   - `Content-Type: multipart/form-data`
   - Field names MUST be `file` (the PDF File object) and `invite_code` (string).
   - Set a 30-second client timeout to match backend's 25-second processing timeout.

5. **Handle errors:**
   - All errors: `{ "detail": "message" }`.
   - 429 → rate limited, show retry message.
   - 401 → wrong invite code or admin token.
   - 404 → roll number not in batch.
   - 413 → PDF too large (>5MB).
   - 504 → upload processing timed out.

6. **Admin panel requirements:**
   - Token is user-entered (do NOT hardcode, do NOT store in localStorage for security).
   - Send as `Authorization: Bearer <token>` header.
   - All admin endpoints use this header.

---

*Generated: September 2026 · APS Tracker · GL Bajaj CSE/CST 2024–28*
