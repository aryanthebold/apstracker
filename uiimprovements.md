# APS Tracker — UI & UX Improvement Tasks

## Context
This is a Next.js app deployed at apstracker.netlify.app. The backend is FastAPI on Render. All changes are frontend-only unless specified. Do NOT touch any backend logic, API calls, or data fetching logic. Only change visual/UI/UX layer.

---

## Task 1 — Navbar Fixes
- Fix "APS TrackerGL Bajaj" — add a separator between the logo text and subtitle. Make it read "APS Tracker · GL Bajaj" or put the subtitle on a second smaller line below
- Rename the "Admin" nav link to **"OverPower"** everywhere it appears (navbar, any links pointing to /admin)
- On mobile (screen width < 768px): hide all nav links and replace with a **hamburger menu icon** (three lines). Tapping it opens a slide-in drawer from the right with all nav links listed vertically. The drawer should have a close button and close when a link is tapped.
- The Upload button in the navbar should be visually distinct — make it a filled pill button with the accent color, not a plain text link

---

## Task 2 — Typography & Font Overhaul
Remove all AI-default fonts (Inter, Geist, or whatever is currently set). Replace with this font stack:

```css
/* Add to globals.css or layout */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');
```

Apply them:
- All `h1`, `h2`, `h3` headings → `font-family: 'Syne', sans-serif`
- All body text, paragraphs, labels, table cells → `font-family: 'DM Sans', sans-serif`
- All roll numbers, rank numbers, SGPA values, numeric stats → `font-family: 'JetBrains Mono', monospace`

This single change will make the site look completely hand-crafted and unique.

---

## Task 3 — Home Page Improvements

### Live Stats Bar
The stats section currently shows placeholder or no data. Connect it to the `/stats` backend endpoint and display these 4 metric cards in a horizontal row:
- **Students Submitted** (number + "of 600")
- **Batch Avg SGPA** (calculated from all submissions)
- **Top SGPA** (highest individual SGPA in the batch)
- **Clean Records** (count of students with 0 backs)

Each card should have:
- A small icon (use lucide-react: `Users`, `TrendingUp`, `Trophy`, `ShieldCheck`)
- The number in JetBrains Mono font, large size
- Animate the number counting up from 0 to its value on page load using framer-motion

### Feature Cards (Leaderboard, Subject Toppers, Search)
- Add a relevant lucide-react icon to each card header
- Make the cards have a subtle hover effect: slight upward translate + border glow in accent color
- Make the entire card clickable, not just the "Explore" link

### Iridescent Animated Background
Add a pure CSS animated gradient background to the hero section (the area with the main title and CTA buttons). Do NOT use any video or external library.

Specs:
```css
background: linear-gradient(
  135deg,
  #0D1B4B,
  #4F8EF7,
  #7B5EA7,
  #9B59B6,
  #E91E8C,
  #0D1B4B
);
background-size: 300% 300%;
animation: iridescent 8s ease-in-out infinite;

@keyframes iridescent {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

Add a dark overlay (`rgba(0,0,0,0.45)`) between the gradient and the text so text stays readable. The background should be `position: fixed` so it stays as user scrolls.

Create this as a reusable component `components/IridescentBackground.tsx` and import it into the home page hero section.

---

## Task 4 — Leaderboard Page Improvements

### Filter Bar
Replace the plain HTML dropdowns with styled pill/tab buttons:
- Branch filter: `[ All ] [ CSE ] [ CSE AI/ML ] [ CST ]` — clicking highlights the active one
- Sort: `[ CGPA ] [ Backs ]` toggle pills
- Order: `[ ↑ High → Low ] [ ↓ Low → High ]` toggle

### Top 3 Podium
The top 3 students should be visually distinct from the rest:
- Rank 1: Gold badge 🥇, row has a subtle gold left border and gold-tinted background
- Rank 2: Silver badge 🥈, silver left border
- Rank 3: Bronze badge 🥉, bronze left border
- Ranks 4+ get a plain number

### Table Row Interactions
- On hover: row background shifts slightly lighter + a colored left border appears
- Add a subtle transition (150ms ease) for the hover state
- Clicking a row expands an accordion below it showing subject-wise marks for each semester. Use framer-motion AnimatePresence for the expand/collapse animation.

### Add Search Bar to Leaderboard
Add a search input at the top of the leaderboard (above the filters) so users can quickly find a specific student by name without going to the Search page. Filter the visible rows in real-time as they type (client-side filter on already-loaded data, no new API call needed).

---

## Task 5 — Search Page Improvements
- On page load, the search input should be **auto-focused** so the user can start typing immediately
- Show a subtle placeholder: "Search by name or roll number..."
- While typing, show a loading spinner inside the input field (right side) during the debounce period
- When no results are found after a search, show this state:
```
😕 Couldn't find "[query]" in our records.

Know them? Help your batch out!
[ Wanna help me? Upload their result ↑ ]
```
The button should link to `/upload` and be styled differently from other buttons — warmer color (use the pink/magenta from the gradient palette `#E91E8C`), with a subtle pulse animation to draw attention.

---

## Task 6 — Upload Page Improvements

### Progress Steps
After the user clicks Submit, show an animated step-by-step progress indicator:
```
[✓] Uploading PDF  →  [⟳] Parsing Result  →  [ ] Saving to DB  →  [ ] Done
```
Each step animates in with a checkmark when complete. Use framer-motion for the transitions.

### Success State
When upload is fully complete, replace the form with:
- A success animation (green checkmark that scales in with a spring animation)
- "You're on the leaderboard! 🎉" message
- A button: "View Leaderboard" that links to `/leaderboard`

### Error States
Show clear, specific error messages for each failure case:
- Wrong invite code → "Incorrect invite code. Ask your batch rep for the right one."
- Roll number not found → "This roll number isn't in our batch records."
- Already uploaded → "Result already uploaded. Re-uploading will update your existing entry." (with a confirm button to proceed)
- File too large → "PDF too large. Max size is 5MB."

---

## Task 7 — General Polish

### Favicon
Add a favicon. Create a simple SVG favicon with the text "APS" in the accent blue color on a dark background. Place it at `public/favicon.svg` and reference it in `app/layout.tsx`.

### Page Transitions
Wrap every page in a framer-motion div for smooth fade+slide transitions between pages:
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -12 }}
  transition={{ duration: 0.25, ease: "easeOut" }}
>
  {children}
</motion.div>
```
Add this to the root `layout.tsx` so it applies to all pages automatically.

### Scroll Progress Bar
Add a thin horizontal bar at the very top of the page (above the navbar) that fills left-to-right as the user scrolls down. Color: accent blue `#4F8EF7`. Height: 2px. This is especially useful on the leaderboard page.

### Loading Skeletons
Replace all "Loading..." text with skeleton placeholder UI — grey animated shimmer blocks in the shape of the content that's loading. This looks far more professional than text placeholders.

For the leaderboard table, show 8 skeleton rows while data loads:
```
[shimmer block] [shimmer] [shimmer] [shimmer] [shimmer]
```
Use a CSS shimmer animation (background gradient that sweeps left to right).

---

## What NOT to Change
- Do not touch any API call logic or data fetching
- Do not change any route paths
- Do not modify the backend in any way
- Do not remove the funny/personal copy lines the developer added (e.g. "Scroll goes brrrrrrrrrr", "hehee :D") — these are intentional
- Do not change the overall dark color scheme — only improve it

---

## Implementation Order
Do these in order to avoid conflicts:

1. Font overhaul (Task 2) — do this first, it affects everything
2. Navbar fixes (Task 1)
3. Iridescent background component (Task 3)
4. Home page stats + cards (Task 3)
5. Leaderboard improvements (Task 4)
6. Search page (Task 5)
7. Upload page (Task 6)
8. General polish — favicon, transitions, scroll bar, skeletons (Task 7)

After each task, verify the page still builds without errors before moving to the next.