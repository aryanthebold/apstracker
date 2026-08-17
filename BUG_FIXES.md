# APS Tracker — Bug Fixes & Optimizations

## Context
This is a Next.js frontend connected to a FastAPI backend at `https://apstracker-backend.onrender.com`. Fix only what is described below. Do NOT refactor unrelated code, do NOT change page structure, do NOT touch backend.

---

## Fix 1 — Leaderboard Top 3 Podium varies by Branch Filter

### Problem
The Top 3 podium on the leaderboard always shows the same 3 students regardless of which branch filter is selected.

### Fix
The podium (rank 1, 2, 3 cards) must reactively update based on the currently active branch filter:
- When "All Branches" is selected → show the top 3 overall
- When "CSE" is selected → show the top 3 within CSE only
- When "CSE AI/ML" is selected → show the top 3 within CSE AI/ML only
- When "CST" is selected → show the top 3 within CST only

The podium should derive its data from the same filtered dataset that the table below it uses. They must always be in sync — whatever the top 3 rows of the filtered table are, those same 3 students appear in the podium. Do not make a separate API call for the podium — just slice the first 3 from the already-filtered results.

---

## Fix 2 — Font Change for Numbers/Marks in Scorecard

### Problem
Numbers, marks, SGPA values and grades shown in the student Scorecard (visible in both Search page and Leaderboard expanded row) use the same font as body text. They should use the monospace font for better readability and a more data-dashboard feel.

### Fix
In the Scorecard component, apply `font-family: 'JetBrains Mono', monospace` to:
- All SGPA values
- All Internal marks numbers
- All External marks numbers
- All Total marks numbers
- All Grade letters (A, B+, C etc.)
- All rank numbers
- All CGPA values

Do not change the font of subject names, student names, or labels — only the numeric and grade values.

---

## Fix 3 — Fix Marks Display in Search Scorecard (Internal showing twice)

### Problem
In the Search page student Scorecard, the marks column shows Internal marks twice instead of showing Internal + External separately. For example it shows "22 / 22" instead of "22 + 31 = 53".

### Fix
Find the marks display logic in the Scorecard component. The subject marks should be displayed as:

```
Internal + External = Total
```

For example:
```
22 + 31 = 53
```

- Show Internal marks first
- A `+` separator
- Then External marks
- Then `=`
- Then the sum as Total

If a subject has no external marks (like CA type subjects e.g. Sports and Yoga), show just the internal/CA marks with a label "CA" next to it.

Make sure you are pulling both `internal_marks` and `external_marks` from the data object — check the field names in the API response and map them correctly.

---

## Fix 4 — Remove Back Filter from Leaderboard

### Problem
There is a "Has Backs" toggle/filter on the Leaderboard page that should be removed.

### Fix
- Remove the Back filter UI element entirely from the leaderboard filter bar
- Remove any associated state variable and filter logic for backs from the leaderboard component
- Do not remove the backs COUNT display on each student row — that stays. Only remove the filter option.
- After removal, make sure the remaining filters (Branch, Sort By, Order) still work correctly.

---

## Fix 5 — Admin Panel: Backs Tab Fixes

### Problem
The Backs tab in the Admin Panel has three issues:
1. Students with 0 backs are showing up in the Backs list
2. Students are not ordered by number of backs (should be highest first)
3. Students who previously had backs but have now cleared them (back paper column changed from a subject code to "--") still appear without any distinction

### Fix

**5a — Filter out zero-back students**
Only show students where `total_backs > 0` OR where they previously had backs and cleared them. Students who never had any backs at all should not appear in this tab.

**5b — Sort by backs count descending**
Order the list by `total_backs` descending — student with the most backs appears at the top.

**5c — "Cleared" tag for students who cleared their backs**
A student has "cleared" their backs if:
- Their `total_backs` is now 0 BUT they appear in the backs history, OR
- All their subjects that previously had a back paper value now show "--" in the Back Paper column

For these students:
- Keep them in the Backs tab (for admin awareness)
- Show a green "Cleared" badge/tag next to their name
- Style the tag as a small green pill: background `rgba(61, 220, 132, 0.15)`, text `#3DDC84`, border `1px solid #3DDC84`
- This "Cleared" tag must ONLY appear in the Admin Panel — it should not be visible anywhere on the public-facing pages (leaderboard, search, subject toppers)

---

## Fix 6 — Add Blur Behind Student Scorecard in Search Page

### Problem
The student Scorecard that appears in the Search page has no backdrop blur, making it look flat and disconnected from the page.

### Fix
- Add `backdrop-filter: blur(16px)` to the Scorecard container
- Add `-webkit-backdrop-filter: blur(16px)` for Safari support
- Add a semi-transparent background: `background: rgba(17, 19, 24, 0.75)`
- Add a subtle border: `border: 1px solid rgba(255, 255, 255, 0.08)`
- Add `border-radius: 16px`

### Performance requirement
The blur must be lag-free. To achieve this:
- Add `will-change: transform` to the Scorecard container
- Add `transform: translateZ(0)` to force GPU compositing
- Do NOT apply blur to any element that animates position or size — only apply it to the static card container
- Do NOT nest blurred elements inside other blurred elements

---

## Fix 7 — Admin Panel Profile Card Scroll Position

### Problem
When clicking on a student in the Admin Panel to view their Profile Card, the modal/card opens in the middle of the webpage. The user has to scroll down significantly just to see the card and the close button.

### Fix
The Profile Card should open anchored to the viewport, not the page:
- Change the Profile Card container to `position: fixed` (not absolute)
- Center it in the viewport: `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`
- Add `z-index: 1000` so it appears above all content
- Max height should be `90vh` with `overflow-y: auto` so if the card content is tall, it scrolls internally without the user needing to scroll the page
- Add a dark backdrop overlay behind the card: a full-screen `position: fixed` div with `background: rgba(0,0,0,0.6)` and `z-index: 999`
- Clicking the backdrop should close the card (same as clicking the close button)
- When the card is open, add `overflow: hidden` to the `body` to prevent the background page from scrolling

---

## Fix 8 — Make the Whole Website Lag Free (Performance Optimization)

### Goal
Improve rendering performance across all pages without removing any visual feature (animations, blur effects, gradients, sparklines all stay).

### Optimizations to apply

**8a — Iridescent Background**
- Ensure the animated gradient background uses `will-change: background-position`
- Make sure it is on its own composited layer with `transform: translateZ(0)`
- It should be rendered as a separate `<div>` behind all content, not applied to a container that also holds content

**8b — Framer Motion**
- Add `layout={false}` to any motion components that don't need layout animation
- Use `useReducedMotion()` hook from framer-motion — if the user has reduced motion enabled in their OS, skip all animations gracefully
- Replace any `animate` on mount with `initial={false}` where the initial render doesn't need animation

**8c — Leaderboard Table**
- Implement virtualization for the leaderboard table if there are more than 50 rows — only render rows that are currently visible in the viewport
- Use `react-window` library for this:
```bash
npm install react-window
```
- Each row height is fixed (use 64px as the row height estimate)
- This prevents rendering 200 DOM nodes at once which causes scroll jank

**8d — Images & Fonts**
- Add `display=swap` to the Google Fonts import (already should be there — verify)
- Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` in `layout.tsx` `<head>` before the font link

**8e — API Calls**
- Add `stale-while-revalidate` caching to all GET fetch calls so repeated page visits don't re-fetch:
```javascript
fetch(url, { next: { revalidate: 30 } }) // cache for 30 seconds
```
- For the leaderboard, stats, and subject toppers — these don't need to be fresh every millisecond. 30 second cache is fine.

**8f — Blur Effects**
- Audit every element using `backdrop-filter: blur()` — make sure none of them are inside a CSS transform that changes on scroll or animation, as this causes repaint on every frame
- Each blurred element must have `will-change: transform` and `transform: translateZ(0)` applied

**8g — Remove layout thrashing**
- Do not read `offsetHeight`, `scrollTop`, `getBoundingClientRect()` inside animation loops or scroll handlers without debouncing
- Wrap any scroll event listeners with a 16ms `requestAnimationFrame` throttle

---

## Fix 9 — Make Scorecard Font More Visible

### Problem
The text inside the student Scorecard (subject names, grades, marks) is too light or low contrast, making it hard to read especially on mobile.

### Fix
Apply these specific color changes inside the Scorecard component only:

- Subject names: change to `#F0F2F5` (bright white) with `font-weight: 500`
- Subject type label (Theory/Practical/CA): change to `#8B95A1` (muted) with `font-size: 11px` — keep it subtle
- Internal/External/Total marks numbers: change to `#FFFFFF` with `font-weight: 500`
- Grade letters: give each grade a color:
  - O (Outstanding): `#FFD700` gold
  - A+: `#3DDC84` green
  - A: `#3DDC84` green
  - B+: `#4F8EF7` blue
  - B: `#4F8EF7` blue
  - C: `#F5A623` amber
  - D: `#FF8C42` orange
  - E (fail/grace): `#FF5C5C` red
  - F: `#FF5C5C` red
- SGPA label: `#8B95A1` muted
- SGPA value: `#FFFFFF` white, `font-size: 18px`, `font-weight: 600`
- Section headers (e.g. "Semester 1", "Semester 2"): `#4F8EF7` accent blue, `font-weight: 600`
- Table header row (Code, Name, Type, Internal, External, Grade): `#8B95A1` muted, `font-size: 12px`, uppercase, letter-spacing 0.05em

---

## Implementation Order

Apply fixes in this order to avoid conflicts:

1. Fix 4 — Remove backs filter (smallest, safest change)
2. Fix 2 — Font change for numbers (global Scorecard change)
3. Fix 9 — Scorecard font visibility (extends Fix 2)
4. Fix 3 — Marks display Internal+External (logic fix)
5. Fix 6 — Blur behind Scorecard (visual addition)
6. Fix 1 — Leaderboard podium by branch (logic fix)
7. Fix 5 — Admin backs tab (admin only)
8. Fix 7 — Admin profile card scroll (admin only)
9. Fix 8 — Performance optimization (do this LAST after all other fixes are in)

---

## Rules
- Do NOT change any API endpoints or backend code
- Do NOT remove any animations, gradients, or visual effects
- Do NOT change page routing or URL structure
- Do NOT modify the funny/personal copy lines in the site
- Test each fix individually before moving to the next
- After Fix 8 (performance), do a full page-by-page check to make sure nothing broke visually
