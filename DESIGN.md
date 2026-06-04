# AKTU Batch Tracker — Frontend Design Specification

## Design Philosophy

**Aesthetic Direction: Academic Dark Luxury**

Think a premium sports leaderboard crossed with a university portal — dark backgrounds, sharp accent colors, clean data tables, smooth animations. Not corporate, not childish. Something a college student would actually be proud to show their batchmates.

- Dark base with vibrant accent (deep navy + electric blue or deep charcoal + amber gold)
- Heavy use of glassmorphism cards for student result cards
- Smooth scroll-triggered animations — elements slide/fade in as user scrolls
- Micro-interactions on hover (row highlights, button pulses)
- Mobile optimized — touch-friendly tap targets, bottom nav for mobile

---

## Typography

```
Display / Hero headings  →  "Syne" (Google Fonts) — bold, geometric, modern
Body / Data text         →  "DM Sans" (Google Fonts) — clean, readable at small sizes
Monospace / Roll numbers →  "JetBrains Mono" — for roll numbers, stats, ranks
```

Import in `layout.tsx`:
```
https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap
```

---

## Color System

```css
:root {
  /* Base */
  --bg-primary: #0A0C10;        /* near black — main background */
  --bg-secondary: #111318;      /* slightly lighter — card backgrounds */
  --bg-tertiary: #1A1D24;       /* hover states, table rows */
  --bg-glass: rgba(255,255,255,0.04);  /* glassmorphism surfaces */

  /* Accent */
  --accent-primary: #4F8EF7;    /* electric blue — CTAs, highlights, ranks */
  --accent-gold: #F5C842;       /* gold — top 3 positions, trophies */
  --accent-success: #3DDC84;    /* green — PASS, clean record badge */
  --accent-danger: #FF5C5C;     /* red — backs indicator */
  --accent-muted: #8B95A1;      /* muted blue-gray — secondary text */

  /* Borders */
  --border-subtle: rgba(255,255,255,0.06);
  --border-accent: rgba(79,142,247,0.3);

  /* Text */
  --text-primary: #F0F2F5;
  --text-secondary: #8B95A1;
  --text-tertiary: #4A5260;
}
```

---

## Animations & Transitions

Use **Framer Motion** for all animations in Next.js.

```bash
npm install framer-motion
```

### Page Transitions
Wrap every page in a motion div:
```jsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -16 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

### Scroll-triggered Animations
Use `whileInView` for leaderboard rows and cards:
```jsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.4, delay: index * 0.05 }}
>
```

### Staggered List Reveal
Each leaderboard row appears with a slight delay cascade — rows 1, 2, 3... appear sequentially as you scroll.

### Hover Micro-interactions
- Table rows: `background` shifts to `--bg-tertiary` + left border accent line appears
- Buttons: scale(1.02) + glow shadow on hover
- Rank badges: slight rotation + scale on hover

### Number Counter Animation
On the home page stats bar, numbers count up from 0 to their value on page load using Framer Motion's `useMotionValue` + `animate`.

### Scroll Progress Bar
Thin accent-colored line at top of page that fills as user scrolls down leaderboard.

---

## Component Designs

### Navbar
```
[AKTU TRACKER]              [Leaderboard] [Subjects] [Search]    [Upload ↑]
```
- Sticky top, blurred background (`backdrop-filter: blur(12px)`)
- Logo in Syne font, accent colored
- On mobile: hamburger menu → bottom sheet drawer
- "Upload" button glows subtly

### Hero Section (Home Page)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   GL Bajaj Batch 2024-28                           │
│   Result Tracker                                    │
│                                                     │
│   [ 143 submitted ]  [ Avg SGPA: 7.2 ]  [ 12 toppers ] │
│                                                     │
│         [ 🏆 View Leaderboard ]  [ Upload Result ↑ ] │
│                                                     │
└─────────────────────────────────────────────────────┘
```
- Large Syne display text, animated word-by-word reveal on load
- Stats bar with animated number counters
- Subtle animated grid/dot pattern in background
- Two prominent CTA buttons

### Stats Bar (Home)
Four metric cards in a row:
```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ Submitted  │  │ Avg SGPA   │  │ Toppers    │  │ Clean Rec. │
│   143      │  │   7.24     │  │    23      │  │    89      │
│ of 600     │  │ batch avg  │  │ 8.5+ SGPA  │  │  no backs  │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### Leaderboard Table
```
Rank  Name              Branch    S1    S2    S3   CGPA   Backs
──────────────────────────────────────────────────────────────
🥇 1  Aryan Pratap      CSE      6.5   7.45  8.2   7.38    0
🥈 2  [Name]            CST      ...   ...   ...   7.21    0
🥉 3  [Name]          CSE AI/ML  ...   ...   ...   7.10    2  ⚠️
──────────────────────────────────────────────────────────────
   4  [Name]            CSE      ...
```
- Top 3 get gold/silver/bronze rank badges
- Backs shown as red badge with count
- Clicking a row expands to show subject-wise marks in a smooth accordion
- Sticky header on scroll
- Alternating row backgrounds

### Filter Bar
```
[ All Branches ▾ ]  [ All Semesters ▾ ]  [ Sort: CGPA ▾ ]  [ ✓ Clean Record Only ]
```
- Pill-shaped dropdowns
- Filter changes animate the table re-sort (items slide to new positions)
- Active filters shown as dismissible tags below the bar

### Student Expanded Row (accordion)
When a leaderboard row is clicked:
```
▼ Aryan Pratap Singh — CSE — Roll: 2405110100040
  ┌──────────────────────────────────────────────────┐
  │ Semester 1 — SGPA: 6.5                           │
  │ Engineering Physics      C   22+31=53            │
  │ Engineering Maths-I      E   19+22=41            │
  │ ...                                              │
  ├──────────────────────────────────────────────────┤
  │ Semester 2 — SGPA: 7.45                          │
  │ ...                                              │
  └──────────────────────────────────────────────────┘
```

### Subject Toppers Page
Grid of subject cards, one per subject:
```
┌─────────────────────┐  ┌─────────────────────┐
│ Data Structures     │  │ Maths-IV             │
│ Sem 3 · Theory      │  │ Sem 3 · Theory       │
│                     │  │                      │
│ 🥇 [Name]  96/100  │  │ 🥇 [Name]  94/100   │
│ 🥈 [Name]  94/100  │  │ 🥈 [Name]  91/100   │
│ 🥉 [Name]  92/100  │  │ 🥉 [Name]  90/100   │
└─────────────────────┘  └─────────────────────┘
```
- Filter by semester at top
- Cards animate in on scroll

### Search Page
```
┌────────────────────────────────────────────┐
│  🔍  Search by name or roll number...      │
└────────────────────────────────────────────┘
```
- Live search as user types (debounced 300ms)
- Results appear as student cards below
- If no result found:
```
┌──────────────────────────────────────────────────┐
│  Hmm, couldn't find "[name]" in our records.     │
│                                                  │
│  Know them? Help us out!                         │
│  [ Wanna help me? Upload their result ↑ ]        │
└──────────────────────────────────────────────────┘
```
- The "Wanna help me?" button is styled differently — warmer color, slightly playful

### Upload Page
```
┌───────────────────────────────────────────┐
│  Upload Your Result                        │
│                                           │
│  [ Enter invite code ]                    │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  │   📄  Drop your AKTU result PDF     │  │
│  │       or click to browse            │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  [ Submit Result ]                        │
└───────────────────────────────────────────┘
```
- Drag and drop PDF upload zone with dashed border
- Progress states with animated steps:
  `Uploading → Parsing PDF → Validating → Saving → Done ✓`
- Each step animates in with a checkmark when complete
- Success state: confetti burst + "You're on the leaderboard!" message
- Error state: clear message explaining what went wrong

### Admin Dashboard
- Protected by password prompt on page load
- Sidebar navigation: Overview / All Students / Backs List / Not Submitted / Danger Zone
- Data tables with full detail
- Delete buttons with confirmation dialog
- Export to CSV button for each table

---

## Mobile Layout

### Bottom Navigation Bar (mobile only)
```
[ 🏠 Home ]  [ 🏆 Board ]  [ 🔍 Search ]  [ ⬆ Upload ]
```
Replaces top navbar links on screens < 768px

### Table → Card transformation
On mobile, leaderboard table becomes stacked cards:
```
┌──────────────────────────┐
│ #1  Aryan Pratap Singh   │
│ CSE · Roll: 240511...    │
│ CGPA: 7.38  Backs: 0 ✓  │
│ S1: 6.5  S2: 7.45  S3: 8.2 │
└──────────────────────────┘
```

### Touch interactions
- Swipe left on a student card to see quick subject breakdown
- Pull to refresh on leaderboard

---

## Page-by-page Animation Sequences

### Home Page Load
1. (0ms) Background grid fades in
2. (100ms) "GL Bajaj Batch 2024-28" slides up
3. (200ms) "Result Tracker" slides up
4. (400ms) Stats bar cards fade in left to right with numbers counting up
5. (700ms) CTA buttons pop in with spring animation

### Leaderboard Page
1. Filter bar slides down from top
2. Table header fades in
3. Rows 1-10 stagger in (50ms delay each) as page loads
4. Remaining rows animate in as user scrolls

### Search Results
- Results fade+slide in as typing (debounced)
- "Not found" state fades in after 500ms of no results

---

## Connecting Design to Backend

Every page component fetches from the FastAPI backend using functions defined in `lib/api.ts`. When importing your design, connect each component to its endpoint:

| Component | API Function | Endpoint |
|---|---|---|
| `StatsBar` | `fetchStats()` | `GET /stats` |
| `LeaderboardTable` | `fetchLeaderboard(filters)` | `GET /leaderboard` |
| `SubjectToppers` | `fetchSubjectToppers(sem)` | `GET /leaderboard/subject` |
| `SearchBar` | `searchStudents(query)` | `GET /students/search?q=` |
| `UploadForm` | `uploadResult(file, code)` | `POST /upload` |
| `AdminTable` | `fetchAllStudents()` | `GET /admin/all-students` |

All API functions live in `frontend/lib/api.ts` and use `fetch` with the base URL from `NEXT_PUBLIC_API_URL` environment variable.

---

## Libraries to Install

```bash
# In /frontend
npm install framer-motion          # animations
npm install @supabase/supabase-js  # supabase client
npm install react-dropzone         # drag and drop PDF upload
npm install react-hot-toast        # toast notifications
npm install lucide-react           # icons
```

---

## Design Assets Needed

- GL Bajaj or AKTU logo (optional, for navbar)
- Trophy / medal icons (use lucide-react: `Trophy`, `Medal`)
- Favicon — can generate from text "AT" in accent color

---

## Notes for Stitch / AI Design Tool Import

When building pages in Stitch or similar:
1. Build each page as a **separate component file**
2. Leave `// TODO: connect to API` comments where data should come from backend
3. Use **hardcoded mock data** during design phase — replace with API calls after
4. All endpoints are documented in `IMPLEMENTATION_PLAN.md` under API Endpoints
5. Environment variable `NEXT_PUBLIC_API_URL` is the only thing that changes between local and deployed
