# Landing + Review Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Ship a dark, cinematic landing page rebuild at `src/app/page.tsx` plus a dark-themed transaction review surface, both using a shared CSS-variable token system. Non-targeted screens stay cream.

**Architecture:** Introduce cross-theme tokens in `globals.css` keyed by `[data-theme="dark"]`. Landing is always dark. Review page wraps its `<main>` content in `data-theme="dark"`. Twelve review-surface components refactor their hardcoded hex colors to the token variables. Framer Motion powers the hero transaction-feed animation and scroll-triggered stat counters.

**Tech Stack:** Next.js 14, Tailwind 3.4, inline React styles, Framer Motion, DM Serif Display + DM Sans + DM Mono (already loaded).

**Correctness gates:** `npm run build` and `npm run lint` after each phase. Manual browser checks on `/` and `/dashboard/review/[jobId]`.

**Spec:** `docs/superpowers/specs/2026-04-23-landing-and-review-redesign.md`

---

## Token map (referenced throughout)

| Current hex in components | Token |
|---|---|
| `#faf8f4`, `#fafaf8` | `var(--surface-base)` |
| `#ffffff`, `#fff` | `var(--surface-card)` |
| `#f5f0ea`, `#fdf2e9` | `var(--surface-elevated)` |
| `rgba(0,0,0,0.35)` (overlay) | `var(--surface-overlay)` |
| `#e0dbd4`, `#e8e0d4`, `#f0ece4`, `#f0ebe3` | `var(--border-subtle)` |
| `#c4bdb8` | `var(--border-strong)` |
| `#1a1714` | `var(--text-primary)` |
| `#6b6560` | `var(--text-secondary)` |
| `#a09a94` | `var(--text-tertiary)` |
| `#2d5a27`, `#166534` | `var(--accent)` |
| `#e8f0e6`, `#ecfdf5`, `#d4e8d0` | `var(--accent-soft)` |
| `#991b1b`, `#dc2626`, `#ef4444`, `#fef2f2` | `var(--danger)` / `--danger-soft` |
| `#b8734a`, `#d97706` | `var(--warning)` |
| `#3b5bdb`, `#1d4ed8`, `#eff6ff`, `#f0f4ff` | `var(--ring-focus)` / `--ring-soft` |

(`--danger-soft`, `--ring-soft` are introduced alongside the primary tokens so pill backgrounds remain controllable.)

---

## Phase A — Foundations

### Task 1: Install framer-motion

- [ ] Run `npm install framer-motion` and verify no peer-dep errors.
- [ ] Commit:
```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion for landing animations"
```

### Task 2: Add theme tokens to `globals.css`

**Files:** Modify `src/app/globals.css`

- [ ] Inside the existing `:root` block, add cross-theme tokens. After `:root { ... }` add the `[data-theme="dark"]` block.

```css
:root {
  /* existing cream palette remains unchanged above */
  --surface-base:     #faf8f4;
  --surface-card:     #ffffff;
  --surface-elevated: #f5f0ea;
  --surface-overlay:  rgba(26,23,20,0.45);
  --border-subtle:    rgba(26,23,20,0.08);
  --border-strong:    rgba(26,23,20,0.14);
  --text-primary:     #1a1714;
  --text-secondary:   #6b6560;
  --text-tertiary:    #a09a94;
  --accent:           #2d5a27;
  --accent-soft:      rgba(45,90,39,0.12);
  --accent-contrast:  #ffffff;
  --danger:           #991b1b;
  --danger-soft:      rgba(153,27,27,0.12);
  --warning:          #b8734a;
  --warning-soft:     rgba(184,115,74,0.12);
  --ring-focus:       #3b5bdb;
  --ring-soft:        rgba(59,91,219,0.14);
}

[data-theme="dark"] {
  --surface-base:     #0A0A0F;
  --surface-card:     #111118;
  --surface-elevated: #16161F;
  --surface-overlay:  rgba(0,0,0,0.65);
  --border-subtle:    rgba(255,255,255,0.07);
  --border-strong:    rgba(255,255,255,0.14);
  --text-primary:     #F0F0F5;
  --text-secondary:   #A8A8BC;
  --text-tertiary:    #6E6E85;
  --accent:           #00D97E;
  --accent-soft:      rgba(0,217,126,0.12);
  --accent-contrast:  #00110A;
  --danger:           #FF5D73;
  --danger-soft:      rgba(255,93,115,0.14);
  --warning:          #FFB454;
  --warning-soft:     rgba(255,180,84,0.12);
  --ring-focus:       #4C7EFF;
  --ring-soft:        rgba(76,126,255,0.18);
}

/* Any element with data-theme="dark" gets a dark local background fallback */
[data-theme="dark"] {
  background-color: var(--surface-base);
  color: var(--text-primary);
}
```

- [ ] `npm run build`
- [ ] Commit:
```bash
git add src/app/globals.css
git commit -m "feat: add cross-theme CSS variables with dark palette"
```

---

## Phase B — Landing page rebuild

Build section-by-section, committing after each so we can ship incrementally.

### Task 3: Landing shell + Nav component

**Files:**
- Create: `src/components/landing/Nav.tsx`
- Create: `src/components/landing/Footer.tsx`
- Rewrite: `src/app/page.tsx` (initial shell — wires Nav, Footer, placeholders for sections).

- [ ] Create `Nav.tsx` with scrolled-glass treatment and dark styling.
- [ ] Create `Footer.tsx` with 4-column link grid and wordmark.
- [ ] Replace `src/app/page.tsx` with a new component that renders `<div data-theme="dark">` containing `<Nav />` + `<main>` placeholders for each section + `<Footer />`.
- [ ] `npm run build`
- [ ] Commit.

### Task 4: Hero section (text column + canvas shell)

**Files:**
- Create: `src/components/landing/Hero.tsx`
- Create: `src/components/landing/HeroTransactionFeed.tsx` (with static freeze frame first; animation in Task 5)

- [ ] `Hero.tsx` renders the two-column layout: text on left (pre-pill, H1, subheader, CTA row, disclaimer), `<HeroTransactionFeed />` on right.
- [ ] First version of `HeroTransactionFeed.tsx` renders the 8-card freeze frame (assembled table state). No motion yet — just the static "after" image.
- [ ] Import into `page.tsx` between Nav and next placeholder.
- [ ] `npm run build`
- [ ] Commit.

### Task 5: Hero animation — Framer Motion choreography

**Files:** Modify `src/components/landing/HeroTransactionFeed.tsx`

- [ ] Add `'use client'` directive (already there from Task 4 — confirm).
- [ ] Use `useReducedMotion()` at top; if true, return the existing freeze-frame unchanged.
- [ ] Define the 8 transactions array. Example shape:
```ts
const TXS = [
  { vendor: 'Amazon',    amount: 142.50, category: 'Office Supplies',       date: 'Apr 14' },
  { vendor: 'Notion',    amount: 20.00,  category: 'Software',              date: 'Apr 15' },
  { vendor: 'Stripe',    amount: 2.90,   category: 'Transaction Fees',      date: 'Apr 16' },
  { vendor: 'Starbucks', amount: 6.75,   category: 'Meals',                 date: 'Apr 16' },
  { vendor: 'DoorDash',  amount: 38.12,  category: 'Meals',                 date: 'Apr 17' },
  { vendor: 'Uber',      amount: 22.80,  category: 'Travel',                date: 'Apr 18' },
  { vendor: 'AWS',       amount: 412.09, category: 'Cloud Infrastructure',  date: 'Apr 19' },
  { vendor: 'Google Ads',amount: 280.00, category: 'Marketing',             date: 'Apr 20' },
]
```
- [ ] Orchestration uses an index `focusIdx` advancing every 1100ms via `setInterval`. At each tick:
  - Current focused card pulses (ring scale 1→1.8 opacity 1→0 over 500ms), `?` → `✓`, category chip slides in.
  - Previous focused cards remain in the "assembled table" row at the bottom.
  - When `focusIdx === 8`, pause 1500ms, then fade the whole table out and restart from 0.
- [ ] Cards positioned with `motion.div` using `animate` props keyed off their state (`incoming | focusing | assembled | exiting`).
- [ ] `npm run build`
- [ ] Commit.

### Task 6: Social-proof strip + stat band

**Files:**
- Create: `src/components/landing/StatBand.tsx`
- Create: `src/components/landing/StatCounter.tsx`

- [ ] `StatCounter.tsx`:
```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

export default function StatCounter({ to, suffix = '', prefix = '', durationMs = 1400 }:
  { to: number; suffix?: string; prefix?: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration: durationMs / 1000, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v) })
    return () => controls.stop()
  }, [inView, to, durationMs])
  const formatted = Number.isInteger(to) ? Math.round(value).toLocaleString() : value.toFixed(1)
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>
}
```
- [ ] `StatBand.tsx` renders the three-column band with trust-strip above it.
- [ ] Import into `page.tsx` after Hero.
- [ ] `npm run build` + commit.

### Task 7: Bento feature grid

**Files:** Create `src/components/landing/BentoGrid.tsx`.

- [ ] Grid uses CSS Grid `grid-template-columns: repeat(6, 1fr)` with cards spanning `span 4 / span 2 / span 2 / span 2 / span 2 / span 4`.
- [ ] Each card wraps content in `motion.div` with:
```tsx
whileHover={{ y: -3 }}
transition={{ type: 'spring', stiffness: 280, damping: 22 }}
```
- [ ] Cards: AI categorization (span 4, with a mini inline "category chip" CSS mockup), Smart rules (span 2), Bank rec (span 2), Auto-Close agent (span 2), Keyboard-first (span 2), Narrative insights (span 4).
- [ ] Accent glow on hover via a sibling absolutely-positioned div with opacity toggle.
- [ ] Import into `page.tsx`. `npm run build` + commit.

### Task 8: How-it-works section

**Files:** Create `src/components/landing/HowItWorks.tsx`.

- [ ] 3-column layout with stroked numerals, titles, copy, and a small CSS-drawn interface hint per step. Steps:
  1. Connect your client's bank
  2. AI categorizes every transaction
  3. Review, approve, export
- [ ] Import + commit.

### Task 9: Testimonials

**Files:** Create `src/components/landing/Testimonials.tsx`.

- [ ] 3-column testimonial grid. Data is hardcoded (3 testimonials). Each card shows quote, author, firm, and a gradient-disc avatar (CSS `background: conic-gradient(...)`).
- [ ] Hover animated conic-gradient border: use a pseudo-element with `background: conic-gradient(from var(--angle), ...)` and animate `--angle` via CSS custom-properties + Framer Motion.
- [ ] Import + commit.

### Task 10: Pricing teaser + CTA band + Final assembly

**Files:**
- Create: `src/components/landing/PricingTeaser.tsx`
- Create: `src/components/landing/CtaBand.tsx`

- [ ] Pricing teaser: single centered card (plan name, $49/mo per seat, 5 bullets, CTA).
- [ ] CTA band: full-width dark band with large serif heading "Close faster. Close better." and accent CTA. Emerald radial gradient background.
- [ ] Wire everything into `src/app/page.tsx`. Full layout: Nav · Hero · TrustStrip · StatBand · BentoGrid · HowItWorks · Testimonials · PricingTeaser · CtaBand · Footer.
- [ ] `npm run build` + `npm run lint`.
- [ ] Commit.

---

## Phase C — Review dark theme

### Task 11: Wrap review page in `data-theme="dark"`

**Files:** Modify `src/app/dashboard/review/[jobId]/page.tsx`

- [ ] Locate the main content wrapper around the `<main>` element.
- [ ] Add an inner wrapper: `<div data-theme="dark" style={{ backgroundColor: 'var(--surface-base)', minHeight: '100%' }}>` enclosing the `<main>` content only (NOT the `<KeyboardShortcutProvider>` sibling elements that include toasts etc. — we wrap `<main>` specifically so sidebar stays cream).
- [ ] `npm run build` + commit. The page will look broken at this point because components still use hardcoded cream hexes — that's Task 12+.

### Task 12: Refactor `TransactionTable.tsx` to tokens

**Files:** Modify `src/components/TransactionTable.tsx`

- [ ] Replace every inline hex color with the matching CSS variable per the token map above.
- [ ] Key substitutions include:
  - `backgroundColor: '#f5f0ea'` (header row bg) → `'var(--surface-elevated)'`
  - `backgroundColor: '#fafaf8'` (expanded-row bg) → `'var(--surface-elevated)'`
  - `color: '#6b6560'` → `'var(--text-secondary)'`
  - `color: '#1a1714'` → `'var(--text-primary)'`
  - `border: '1px solid #e0dbd4'` → `'1px solid var(--border-subtle)'`
  - `backgroundColor: '#2d5a27'` → `'var(--accent)'`, `color: '#fff'` on buttons → `'var(--accent-contrast)'`
  - Row `bg: '#fdf2e9'` selected → keep a warm selected-row tint by using `'var(--accent-soft)'`
  - Confidence pill color tiers stay numeric thresholds but colors switch to `'var(--accent)'` / `'var(--warning)'` / `'var(--danger)'`
- [ ] `npm run build` + commit.

### Task 13: Refactor `TransactionRow.tsx` to tokens

**Files:** Modify `src/components/TransactionRow.tsx`

- [ ] Same substitutions as Task 12. Additional specifics:
  - Credit amount color `'#166534'` → `'var(--accent)'`
  - Debit amount color `'#991b1b'` → `'var(--danger)'`
  - Status pills: approved uses `var(--accent-soft)` bg + `var(--accent)` text; flagged uses `var(--danger-soft)` + `var(--danger)`; edited uses `var(--ring-soft)` + `var(--ring-focus)`; pending uses `var(--warning-soft)` + `var(--warning)`.
  - Focused outline `'2px solid #3b5bdb'` → `'2px solid var(--ring-focus)'`
  - Recurring icon color `#b8734a` → `var(--warning)`.
- [ ] `npm run build` + commit.

### Task 14: Refactor remaining review components

**Files:**
- `src/components/review/InlineCategoryPicker.tsx`
- `src/components/review/CommandPalette.tsx`
- `src/components/review/ShortcutLegend.tsx`
- `src/components/review/SaveRuleToast.tsx`
- `src/components/review/BulkActionBar.tsx` (already mostly dark — verify accent color switches)
- `src/components/review/SplitModal.tsx`
- `src/components/review/ActionToast.tsx`
- `src/components/review/HistoryDrawer.tsx`

- [ ] Apply the same hex→token substitutions to each.
- [ ] For `BulkActionBar`: primary accent button bg changes from `#2d5a27` to `var(--accent)` (so it's electric green on dark).
- [ ] For `ShortcutLegend` / `CommandPalette` / kbd-style elements: kbd pills become `backgroundColor: 'rgba(255,255,255,0.05)'` only under dark theme. Since inline styles don't conditionally switch, use CSS variables: kbd bg = `'var(--surface-elevated)'`, color = `'var(--text-primary)'`, border = `'1px solid var(--border-subtle)'`. These values map correctly in both themes automatically.
- [ ] `npm run build` + commit.

### Task 15: Refactor AI surface components

**Files:**
- `src/components/ai/NarrativeInsight.tsx`
- `src/components/ai/AutoCloseModal.tsx`

- [ ] `NarrativeInsight`: card bg, borders, tone-pill colors → tokens.
- [ ] `AutoCloseModal`: already dark-skinned. Verify accent color (`#2d5a27` → `var(--accent)`) and terminal color tokens stay consistent. Change the "Apply to job" button to `var(--accent)` so it reads electric green.
- [ ] `npm run build` + commit.

---

## Phase D — Ship

### Task 16: Final build + lint + push

- [ ] `npm run build` — all pages compile.
- [ ] `npm run lint` — no new errors vs. baseline.
- [ ] Manual smoke: load `/` and watch hero animation; load a review page and exercise keyboard.
- [ ] `git push origin main` — Vercel auto-deploys.

---

## Self-review notes

- Spec coverage verified: all 4 spec sections mapped to tasks.
- Placeholder scan: the token map table is explicit; no TBDs remain.
- Type consistency: all shared component interfaces (`StatCounter`, hero feed cards) are declared inline in their creation tasks.
- Known accepted compromise: Task 5 hero animation uses hard-coded timing constants (1100ms cadence, 500ms pulse) — these are tuning values, not placeholders.
