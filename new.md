# APS Tracker — New Features Implementation

## Context
This is a Next.js frontend connected to a FastAPI backend at `https://apstracker-backend.onrender.com`. All new features described here are additions only — do NOT modify or break any existing functionality. The existing API endpoints are already built and working.

---

## Feature 1 — SGPA Sparkline Trend Graph on Leaderboard

### What it is
Next to each student row on the leaderboard, add a tiny inline sparkline chart showing their SGPA progression across semesters (e.g. 6.5 → 7.45 → 8.2). A line going up means improving, going down means declining.

### How to build it
- Use the `recharts` library which is already available — specifically `LineChart` or just use a plain SVG sparkline for performance
- Each student row already has semester-wise SGPA data — map it into an array like `[6.5, 7.45, 8.2]` and render a mini line chart
- Sparkline dimensions: max width 80px, height 30px — keep it tiny and inline
- Color the line green if the trend is upward (last sem SGPA > first sem SGPA), red if downward, grey if flat
- On mobile, hide the sparkline to keep the table clean (display: none below 768px)
- Add a tooltip on hover showing "Sem 1: 6.5 | Sem 2: 7.45 | Sem 3: 8.2"

### Where to add it
In the leaderboard table, add a new column header "Trend" and place the sparkline in each row's corresponding cell, between the semester SGPA columns and the CGPA column.

---

## Feature 2 — "Most Improved Student" Section on Home Page

### What it is
A highlighted card on the home page that showcases the student with the biggest SGPA jump between any two consecutive semesters in the batch.

### How to calculate it
- For each student, calculate the difference between their highest and lowest semester SGPA
- The student with the largest positive jump wins "Most Improved"
- Example: Student went from Sem 1 SGPA 5.8 to Sem 3 SGPA 8.2 → improvement of +2.4

### API
Create a new frontend API call to:
```
GET /leaderboard?sort=improvement&limit=1
```
If the backend doesn't support this yet, calculate it client-side from the existing leaderboard data that's already fetched on the home page.

### UI Design
Place this as a card in the home page below the stats bar and above the feature cards section.

Card design:
```
┌─────────────────────────────────────────┐
│ 📈 Most Improved This Batch             │
│                                         │
│  [Student Name]          Branch: CSE    │
│  Sem 1: 6.2  →  Sem 3: 8.5            │
│  Improvement: +2.3 SGPA  🔥            │
│                                         │
└─────────────────────────────────────────┘
```

- Card background should use a subtle green-tinted glassmorphism style to distinguish it
- The improvement number should be in green and bold
- Clicking the card navigates to the Search page with that student's name pre-filled

---

## Feature 3 — Batch Participation Progress Bar on Home Page

### What it is
A visual progress bar on the home page showing how many students out of 600 have submitted their results. Creates social urgency for students who haven't uploaded yet.

### Data source
Call `GET /stats` endpoint which already returns `total_submitted` and total student count.

### UI Design
Place this directly below the hero section title and above the CTA buttons.

```
┌─────────────────────────────────────────────────┐
│  143 of 600 students have submitted             │
│  [████████████░░░░░░░░░░░░░░░░░░░] 23.8%       │
│  Upload yours and join the leaderboard →        │
└─────────────────────────────────────────────────┘
```

- The progress bar fills with the accent blue color (`#4F8EF7`)
- Animate the bar filling from 0% to the actual percentage on page load using framer-motion
- The "Upload yours" text is a clickable link to `/upload`
- Below 10% submissions: bar color is red (low participation)
- 10-50%: amber/yellow
- Above 50%: accent blue
- Above 80%: green

---

## Feature 4 — Branch vs Branch Comparison Card on Home Page

### What it is
A card showing the average SGPA of each branch side by side so students can see which branch is performing best overall.

### Data source
Calculate from existing leaderboard data — group by branch, average the overall SGPAs.

Or call:
```
GET /leaderboard?branch=CSE
GET /leaderboard?branch=CSE_AIML  
GET /leaderboard?branch=CST
```
And calculate average client-side.

### UI Design
Place this on the home page next to or below the "Most Improved" card.

```
┌─────────────────────────────────────────────────┐
│ 🏆 Branch Standings                             │
│                                                 │
│  CSE          ████████████░░  7.42 avg SGPA    │
│  CSE AI/ML    ██████████░░░░  7.18 avg SGPA    │
│  CST          ███████████░░░  7.31 avg SGPA    │
│                                                 │
│  Based on 143 submitted results                 │
└─────────────────────────────────────────────────┘
```

- Each branch has a horizontal mini progress bar showing relative performance
- The leading branch bar is highlighted in gold, others in accent blue
- Show how many students from each branch have submitted in smaller text below each bar
- Animate the bars filling on scroll into view using framer-motion `whileInView`

---

## Feature 5 — Share Button on Student Result Card

### What it is
When a student is found on the Search page, their result card shows a "Share" button. Clicking it copies a direct link to the clipboard that pre-fills the search with that student's roll number.

### URL format
```
https://apstracker.netlify.app/search?q=[roll_number]
```

### Behavior
- The Search page should read the `?q=` query parameter on load and auto-search for that value if present
- This means if someone opens a shared link, the result loads automatically

### Share button UI
- Place it in the top-right corner of the student result card
- Use lucide-react `Share2` icon + "Share" text
- On click: copy the URL to clipboard using `navigator.clipboard.writeText()`
- After copying: button text changes to "Copied! ✓" for 2 seconds then reverts back
- Style: small outlined pill button, not filled — should feel secondary to the main content

---

## Feature 6 — Hide Empty Semesters on Subject Toppers Page

### What it is
The Subject Toppers page currently shows semester tabs for Sem 1 through Sem 8 even though only Sems 1, 2, and 3 have real data. Clicking Sem 4-8 shows nothing or an error. Fix this so only semesters with actual data are shown as tabs.

### How to implement
- On page load, fetch the subject toppers data
- Dynamically generate semester tabs only for semesters that return at least one subject with data
- If a semester returns empty results, don't render its tab at all
- Default to the highest available semester (e.g. Sem 3) as the active tab on load instead of Sem 1

### Edge case
When Sem 4 results come out later and students re-upload, Sem 4 tab should automatically appear without any code change — because it's dynamic based on data, not hardcoded.

---

## Implementation Order

Do these in this exact order:

1. **Feature 6** (hide empty semesters) — smallest change, least risk, fixes existing broken UX
2. **Feature 5** (share button + URL param search) — self-contained, no new API needed
3. **Feature 3** (participation progress bar) — uses existing /stats endpoint
4. **Feature 1** (sparkline trend on leaderboard) — adds to existing leaderboard data
5. **Feature 2** (most improved card) — calculates from existing data
6. **Feature 4** (branch comparison card) — calculates from existing data

---

## Important Rules
- Do NOT modify any existing API endpoints or backend code
- Do NOT break existing leaderboard, search, or upload functionality
- Do NOT remove or change any existing UI elements — only add new ones
- All new data should be derived from already-fetched data where possible to avoid extra API calls
- Every new animated element must use framer-motion (already installed)
- All new components go in the `components/` folder with descriptive names