# 🎬 LeaderboardTable — Animation & Effects Design Plan

> **Stack context:** Next.js · Tailwind CSS v4 · `globals.css` custom tokens · no animation library (framer-motion not installed)
> All effects are achievable with **CSS keyframes + Tailwind utilities + lightweight React state**, staying consistent with the existing design system.

---

## 1. Table Row Entry — Staggered Slide-In

**When:** On first paint of the table (component mount).

**Effect:** Each `<tr>` fades up from `translateY(20px)` with a staggered delay. Rows closer to the top appear first, creating a waterfall cascade.

**Implementation:**
```css
/* globals.css — add to FADE IN ANIMATIONS section */
@keyframes rowReveal {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-row-reveal {
  animation: rowReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

```tsx
// LeaderboardTable.tsx — inside the map()
// Add style prop to each <tr>:
<tr
  style={{ animationDelay: `${index * 45}ms` }}
  className={`${rowClass} animate-row-reveal`}
>
```

**Feel:** Smooth, non-distracting waterfall. Max delay ~20 rows × 45ms = ~900ms cap it there.

---

## 2. Hover Row — Left Accent Glow Bar

**Current state:** The `div` inside the rank `<td>` fades in a gradient bar `opacity-0 → opacity-100` on group hover. Good, but can be enhanced.

**Proposed enhancement:** Add a subtle horizontal shimmer sweep across the entire row on hover using a `::before` pseudo-element, combined with a box-shadow glow on the row itself.

```css
/* globals.css */
@keyframes rowShimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}

.table-row-glow {
  position: relative;
  overflow: hidden;
}
.table-row-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(91, 156, 246, 0.06) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  pointer-events: none;
  transition: none;
}
.table-row-glow:hover::before {
  animation: rowShimmer 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

Add `.table-row-glow` to the `rowClass` string in the component.

---

## 3. Expand / Collapse Row — Smooth Height Animation

**Current state:** The expanded `<tr>` is conditionally rendered with `{isExpanded && ...}` — a hard mount/unmount with no transition.

**Problem:** Abrupt pop-in is jarring, especially in a polished dark-UI context.

**Proposed fix — CSS Grid height trick (no JS library needed):**

Wrap the expanded content in a container that transitions `grid-template-rows` from `0fr` → `1fr`:

```css
/* globals.css */
.expand-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.expand-wrapper.open {
  grid-template-rows: 1fr;
}
.expand-wrapper > div {
  overflow: hidden;
}
```

```tsx
// LeaderboardTable.tsx — replace conditional {isExpanded && ...} block
// Always render the row, toggle the class:
<tr className={rank === 1 ? 'bg-accent-gold/5' : ...}>
  <td colSpan={6}>
    <div className={`expand-wrapper ${isExpanded ? 'open' : ''}`}>
      <div>
        {/* existing glass-podium content */}
        <div className="glass-podium border border-border-subtle/50 rounded-2xl p-8 shadow-2xl m-8 mt-2">
          {/* ... */}
        </div>
      </div>
    </div>
  </td>
</tr>
```

**Bonus:** The close button (`X Close Details`) will also animate out smoothly rather than vanishing.

---

## 4. Chevron Icon — Rotation Animation

**Current state:** `ChevronDown` swaps to `ChevronUp` on expand — two different icons, no transition.

**Proposed fix:** Use a single `ChevronDown` and rotate it 180° with CSS:

```tsx
// Replace the last <td> content:
<td className="px-6 py-6 text-center text-text-secondary">
  <ChevronDown
    className={`w-5 h-5 transition-all duration-300 ease-out
      ${isExpanded
        ? 'rotate-180 opacity-100 text-accent-primary'
        : 'rotate-0 opacity-0 group-hover:opacity-100'
      }`}
  />
</td>
```

**Feel:** The chevron smoothly rotates 180°, communicates accordion state, and tints blue when open.

---

## 5. Avatar Badge — Spring Scale on Hover

**Current state:** `.group-hover:scale-105` on both rank ≤ 3 and rank > 3 avatar divs. Works fine.

**Enhancement:** Add a subtle ring pulse for **rank 1** specifically — a breathing gold halo:

```css
/* globals.css */
@keyframes goldHaloPulse {
  0%, 100% {
    box-shadow:
      0 0 0 0px rgba(245, 200, 66, 0.4),
      0 0 20px rgba(245, 200, 66, 0.12);
  }
  50% {
    box-shadow:
      0 0 0 5px rgba(245, 200, 66, 0.0),
      0 0 30px rgba(245, 200, 66, 0.25);
  }
}
.avatar-gold-pulse {
  animation: goldHaloPulse 2.5s infinite ease-in-out;
}
```

Apply `.avatar-gold-pulse` conditionally on the rank 1 avatar div.

---

## 6. Skeleton Loading State — Shimmer Rows

**Current state:** When `isLoading` is true for an expanded student, a spinner + text label appears.

**Enhancement:** Show 3–4 skeleton subject rows with a shimmer effect (using existing `.skeleton-shimmer` from globals.css):

```tsx
// Replace the isLoading block:
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-bg-primary/50 border border-white/5 rounded-xl p-5 space-y-3">
        <div className="skeleton-shimmer h-4 w-1/3 rounded-full" />
        <div className="space-y-2">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="skeleton-shimmer h-3 rounded-full" style={{ width: `${70 + j * 5}%` }} />
          ))}
        </div>
      </div>
    ))}
  </div>
) : ...}
```

**Feel:** Matches the card grid layout — shimmer fills the same 3-col space as the real content, preventing layout shift.

---

## 7. Progress Bar — Animated Fill on Expand

**Current state:** Subject progress bars render instantly at their final width.

**Proposed enhancement:** Bars animate from `0%` to their target width when the expanded section opens.

```css
/* globals.css */
@keyframes barFill {
  from { width: 0%; }
  to   { width: var(--bar-target); }
}
.animate-bar-fill {
  animation: barFill 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

```tsx
// In the subject map, replace the inner div:
<div
  className="h-full bg-accent-primary animate-bar-fill"
  style={{
    '--bar-target': `${Math.min(100, percentage)}%`,
    animationDelay: `${subjectIndex * 40}ms`,
  } as React.CSSProperties}
/>
```

Add staggered delays per subject so bars fill one after another, creating a cascade within each semester card.

---

## 8. Semester Cards — Staggered Fade-In on Expand

**When:** Expanded section first opens and details load.

**Effect:** Each semester card (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) fades in with a staggered delay:

```tsx
// In the details.semesters.map():
<div
  key={sem.id}
  className="bg-bg-primary/50 border border-white/5 rounded-xl p-5 animate-fade-in-up"
  style={{ animationDelay: `${semIndex * 70}ms` }}
>
```

Uses the existing `.animate-fade-in-up` keyframe already in `globals.css`. Zero new CSS needed.

---

## 9. SGPA Value — Odometer Count-Up

**When:** On row expand, the student's SGPA value (shown in the header section) counts up from 0 to its real value.

**Implementation (React state, no library):**

```tsx
// Custom hook — useCountUp.ts
import { useEffect, useState } from 'react';

export function useCountUp(target: number, duration = 800, enabled = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(parseFloat((eased * target).toFixed(2)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);

  return value;
}
```

Apply to the SGPA span in the expanded header. Triggered on `isExpanded`.

---

## 10. Empty State — Pulse Icon Animation

**Current state:** Static text: "No records found matching filters."

**Enhancement:**

```tsx
// Replace the empty state div:
<div className="glass-panel rounded-xl p-12 text-center mt-8 animate-fade-in-up">
  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-bg-tertiary border border-border-subtle
    flex items-center justify-center animate-glow-pulse">
    <span className="text-text-secondary text-xl">∅</span>
  </div>
  <p className="text-text-secondary font-sans text-sm">No records found matching filters.</p>
</div>
```

Uses existing `.animate-glow-pulse` from globals.css.

---

## 11. Close Button — Micro Spring on Click

**Current state:** Clicking "Close Details" simply collapses the row.

**Enhancement:** Add a quick scale-down press feel using active state:

```tsx
<button
  onClick={() => toggleRow(entry.roll_number)}
  className="flex items-center gap-2 text-text-secondary hover:text-text-primary
    transition-all duration-200 underline decoration-dotted underline-offset-4
    active:scale-95 active:opacity-70"
>
```

Pure Tailwind, zero overhead.

---

## 12. Row Rank Badge — Trophy Crown Float (Rank 1 Only)

For rank 1, replace the plain initials badge with a subtly floating version:

```css
/* globals.css */
@keyframes gentleFloat {
  0%, 100% { transform: translateY(0px) scale(1); }
  50%       { transform: translateY(-3px) scale(1.04); }
}
.avatar-float {
  animation: gentleFloat 3s infinite ease-in-out;
}
```

Apply only when `rank === 1`. The avatar gently levitates, drawing the eye to the top ranker.

---

## Summary Table

| # | Effect | Target Element | Trigger | Technique |
|---|--------|---------------|---------|-----------|
| 1 | Staggered row slide-in | All `<tr>` | Mount | CSS keyframe + `animationDelay` |
| 2 | Shimmer sweep on hover | Full row | Hover | CSS pseudo + keyframe |
| 3 | Smooth expand/collapse | Expanded `<tr>` content | Click | CSS grid `0fr → 1fr` trick |
| 4 | Chevron rotate 180° | `ChevronDown` icon | Expand state | Tailwind `rotate-180` transition |
| 5 | Gold halo pulse | Rank 1 avatar | Ambient | CSS keyframe, always running |
| 6 | Shimmer skeleton cards | Loading state grid | isLoading | Existing `.skeleton-shimmer` |
| 7 | Progress bar fill | Subject bars | Expand + data load | CSS var + keyframe stagger |
| 8 | Semester card fade-in | Expanded cards grid | Data loaded | Existing `.animate-fade-in-up` |
| 9 | SGPA count-up | SGPA in expanded header | Expand | `requestAnimationFrame` hook |
| 10 | Empty state glow pulse | No-results panel | Always | Existing `.animate-glow-pulse` |
| 11 | Button press spring | Close Details button | Active | Tailwind `active:scale-95` |
| 12 | Avatar gentle float | Rank 1 avatar badge | Ambient | CSS keyframe |

---

## Global CSS Additions Summary

Paste these new blocks into `frontend/app/globals.css`:

1. `@keyframes rowReveal` + `.animate-row-reveal` → Section 1
2. `@keyframes rowShimmer` + `.table-row-glow` styles → Section 2
3. `.expand-wrapper` / `.expand-wrapper.open` → Section 3
4. `@keyframes goldHaloPulse` + `.avatar-gold-pulse` → Section 5
5. `@keyframes barFill` + `.animate-bar-fill` → Section 7
6. `@keyframes gentleFloat` + `.avatar-float` → Section 12

Sections 4, 8, 10, 11 use **existing utilities** from globals.css — no new CSS needed.

---

## Performance Notes

- All animations use `transform` and `opacity` only (GPU-composited, no layout reflow)
- `will-change: transform` is already set on key elements via PageTransition
- The progress bar uses CSS custom properties (`--bar-target`) to avoid per-element JS
- The count-up hook uses `requestAnimationFrame` (cancellable, no `setInterval` memory leaks)
- Stagger delays are proportional and capped to keep load-in under 1s for 20+ rows
