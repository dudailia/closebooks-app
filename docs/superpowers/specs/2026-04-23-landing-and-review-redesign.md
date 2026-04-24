# Landing Page + Transaction Review Dark Redesign

**Date:** 2026-04-23
**Status:** Approved
**Goal:** Rebuild the public landing page and re-theme the transaction review surface to Linear/Vercel-grade dark aesthetic with electric-green accent. The rest of the dashboard remains cream (migrated in subsequent rounds). This must look like $300k of work.

---

## 1. Design system — scoped dark theme

Extend `src/app/globals.css` with cross-theme CSS variables. Components read variables; the `data-theme="dark"` attribute on a wrapper element flips the token values.

### Tokens

```css
:root {
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
  --warning:          #b8734a;
  --ring-focus:       #3b5bdb;
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
  --warning:          #FFB454;
  --ring-focus:       #4C7EFF;
}
```

### Scoping rule

- `<body>` stays cream for the app.
- Landing page root element gets `data-theme="dark"` and its own `background-color: #0A0A0F`.
- Review page wraps its `<main>` content in `<div data-theme="dark">` so dark tokens only apply inside that subtree; sidebar, topbar, and other dashboard chrome stay cream.

### Dependencies

- Install `framer-motion` — required for the hero animation and counter animations.

---

## 2. Landing page — `src/app/page.tsx`

Complete in-place rebuild. No separate repo.

### Nav

- Fixed top bar. Transparent at scroll y=0; at y>16 becomes glassmorphic: `background: rgba(10,10,15,0.72)`, `backdrop-filter: blur(18px)`, `border-bottom: 1px solid rgba(255,255,255,0.08)`.
- Left: wordmark "CloseBooks" in DM Serif Display, 20px, white.
- Center: anchor links — Features, How It Works, Pricing.
- Right: "Sign in" ghost + "Start free" primary CTA (accent green).
- Mobile: menu button that opens a full-screen dark sheet with the same links.

### Hero (100vh minimum)

- Background: `#0A0A0F` with a subtle radial gradient behind the content (emerald glow top-right, `rgba(0,217,126,0.06)` fading to transparent over 500px radius).
- Grid layout on desktop: left 55% text, right 45% animated canvas.
- Text column:
  - Pre-heading: small pill with pulsing dot + "Real-time AI categorization". Pill bg `rgba(0,217,126,0.08)`, border `rgba(0,217,126,0.24)`.
  - H1: 80px DM Serif Display, tracking `-0.03em`, line-height 0.95. Two lines; second line uses accent color for last noun. e.g. "The AI co-pilot for month-end **close**."
  - Sub: 20px DM Sans, `--text-secondary`, max-width 520px.
  - Buttons: primary "Start closing smarter →" (accent bg, black text), ghost "Watch demo" (transparent, white border).
  - Below buttons: "No credit card · 14-day trial · Set up in 2 minutes" in `--text-tertiary`.
- Right column animated canvas (see §4).
- Mobile: canvas hidden on < md, replaced by a static screenshot freeze-frame. Text stacks centered.

### Social-proof strip

- Thin band directly below hero, separated by hairline border. Label: "Trusted by 200+ CPA firms". Below label: six text-logos spaced evenly (lowercase, muted). Keeps page honest without stock logos.

### Stats band

- Three columns. Each: DM Serif Display number 96px in pure white; subtext in DM Sans 14px `--text-secondary`.
- Numbers: `94%` AI accuracy · `3hrs` vs 3 days · `$2,400/mo` per-firm savings.
- Counters animate from 0 on scroll-into-view (see §4).

### Bento feature grid

- `grid-template-columns: 3fr 2fr 2fr; grid-template-rows: auto auto;` — 6 cards in Stripe-style non-uniform layout.
- Cards (in order): **AI categorization** (2-col-span, large), **Smart rules** (1-col), **Bank reconciliation** (1-col), **Auto-Close agent** (1-col), **Keyboard-first review** (1-col), **Narrative insights** (2-col-span, large).
- Each card: `--surface-card` bg, 1px `--border-subtle`, 24px padding, 18px border-radius. Icon (24px stroked SVG, accent color), h3 (20px), copy (14px `--text-secondary`, 3-line max).
- Hover: `translateY(-3px)`, outer ring `0 0 0 1px rgba(0,217,126,0.32), 0 20px 50px rgba(0,217,126,0.08)`. Spring transition 180ms.
- The two large cards each contain a mini inline "demo" graphic (CSS rectangles arranged to hint at the product).

### How it works

- Three steps in 3-column grid. Each step has big stroked numeral (1/2/3) in `--accent`, title, one-paragraph explainer, and a thumb (reusable `StepThumb` component with CSS-drawn interface hint).
- Steps: "Connect your client's bank" → "AI categorizes every transaction" → "Review, approve, export".

### Testimonials

- 3-column card grid on desktop, single column on mobile. Each card:
  - Quote (20px serif, italic, white).
  - 1px divider.
  - Row: 32px avatar (CSS gradient disc with initials), name + title in 13px, firm in 12px `--text-tertiary`.
  - Card border animated on hover via `conic-gradient` trick (rotating gradient line around the card).

### Pricing teaser

- Single centered card — plan name, price ($49/mo per firm seat), 5 bullet features, primary CTA "Start your 14-day trial". Link to `/pricing` for the full table.

### CTA strip

- Full-width band. Big serif "Close faster. Close better." Accent-green CTA. Deep emerald gradient background.

### Footer

- 4-column grid of links + wordmark + subscribe input. Tiny copyright line below.

### Typography

- Inherits existing DM Serif Display, DM Sans, DM Mono fonts (already loaded in app layout).
- Size scale (landing-only): 80 / 56 / 40 / 28 / 20 / 18 / 15 / 13 / 11 px.
- Letter-spacing `-0.03em` on display (40+), `-0.015em` on body large.

---

## 3. Transaction review dark treatment

### Scoping

- Wrap the review page's main content (not the sidebar/topbar) in `<div data-theme="dark" style={{ backgroundColor: 'var(--surface-base)' }}>`.
- No other pages get the dark theme this round.

### Components refactored to use CSS variables

Replace hardcoded hex values in these with `var(--…)` tokens:

- `src/components/TransactionTable.tsx`
- `src/components/TransactionRow.tsx`
- `src/components/review/InlineCategoryPicker.tsx`
- `src/components/review/CommandPalette.tsx`
- `src/components/review/ShortcutLegend.tsx`
- `src/components/review/SaveRuleToast.tsx`
- `src/components/review/BulkActionBar.tsx`
- `src/components/review/SplitModal.tsx`
- `src/components/review/ActionToast.tsx`
- `src/components/review/HistoryDrawer.tsx`
- `src/components/ai/NarrativeInsight.tsx`
- `src/components/ai/AutoCloseModal.tsx` (already dark — minor pass to align tokens)

### Specific dark rendering

- Row hover `rgba(255,255,255,0.03)`, focused-row 1px outline `--ring-focus`.
- Confidence pills:
  - ≥85 → `--accent` with `--accent-soft` glow.
  - 70–84 → `--warning`.
  - <70 → `--danger`.
- Amount column: credits in `--accent`, debits in `--danger`.
- `kbd` pills: `rgba(255,255,255,0.05)` bg, 1px `rgba(255,255,255,0.10)` border, 11px DM Mono.
- Focus ring on buttons: 2px `--ring-focus` with 2px offset.
- Narrative tone pills invert correctly: selected uses `--accent-soft` bg + accent text; unselected is muted.

### What does NOT change

- Layout, information density, component behavior, keyboard shortcuts, audit flow, all functional logic from prior rounds — unchanged.
- Mobile card view on review page also gets dark treatment via the same token flip.

---

## 4. Animation system

### Hero animated transaction feed (the centerpiece)

**Component:** `src/components/landing/HeroTransactionFeed.tsx`

A deterministic, looping 15-second animation built with Framer Motion.

**Elements:**
- 8 sample transactions (hardcoded: Amazon, Notion, Stripe, Starbucks, DoorDash, Uber, AWS, Google Ads) with dollar amounts and dates.
- Each card: 320×72px, rounded 12px, `--surface-card` bg with 1px `--border-subtle`, vendor + amount + date.
- Right-side label strip: `?` (pending) pulsing → `✓` (accent green checkmark) on categorize.

**Choreography (per card, offset 400ms apart):**
1. Card enters from right edge at y = random(-8, 8) px, opacity 0 → 1 over 500ms.
2. Drifts leftward slowly for 1.2s.
3. Pulses: green ring ripple expands from `?` marker (scale 1→1.8, opacity 1→0, 600ms).
4. `?` replaces with `✓` in accent green. Card adds a tiny category chip ("Software", "Meals", etc.).
5. Card "falls" into an assembling table at the bottom of the canvas — Y translates 120px down with spring physics.
6. Stays in the table. When 8 cards accumulated, table gently lifts slightly and the loop restarts (cards fade out, new batch enters).

**Reduced-motion fallback:** Show the freeze-frame (all 8 cards in the assembled table state). Plays no animations.

### Stat counter

**Component:** `src/components/landing/StatCounter.tsx`

- Uses `useInView` from `framer-motion` to trigger on 30% visibility.
- `useMotionValue(0)` animated to target via `animate()` over 1.4s, easing `easeOutExpo`.
- Subscribes to the motion value, renders the integer. Suffix ("%", "hrs", "/mo") is a separate span.

### Bento card hover

- `motion.div` wraps each card. `whileHover={{ y: -3 }}`, transition spring `{ stiffness: 280, damping: 22 }`.
- Ring glow handled by a sibling pseudo-element that fades in on hover (`transition: opacity 200ms`).

### Reduced-motion

- Every animated component checks `useReducedMotion()` and returns the static variant.

---

## 5. File map

### New files

```
src/components/landing/
  Nav.tsx
  Hero.tsx
  HeroTransactionFeed.tsx
  StatBand.tsx
  StatCounter.tsx
  BentoGrid.tsx
  HowItWorks.tsx
  Testimonials.tsx
  PricingTeaser.tsx
  CtaBand.tsx
  Footer.tsx
```

### Modified files

```
src/app/globals.css                     — add cross-theme tokens + dark-theme attribute
src/app/page.tsx                        — full rebuild, assembles landing sections
src/app/dashboard/review/[jobId]/page.tsx — wrap main content in data-theme="dark"
src/components/TransactionTable.tsx     — switch inline hexes → CSS variables
src/components/TransactionRow.tsx
src/components/review/InlineCategoryPicker.tsx
src/components/review/CommandPalette.tsx
src/components/review/ShortcutLegend.tsx
src/components/review/SaveRuleToast.tsx
src/components/review/BulkActionBar.tsx
src/components/review/SplitModal.tsx
src/components/review/ActionToast.tsx
src/components/review/HistoryDrawer.tsx
src/components/ai/NarrativeInsight.tsx
src/components/ai/AutoCloseModal.tsx
package.json / package-lock.json        — add framer-motion
```

---

## 6. Non-goals (YAGNI)

- No blanket app-wide dark mode.
- No dashboard index redesign.
- No bank-rec redesign.
- No user theme toggle (dark is auto-applied on the two scoped surfaces).
- No new fonts — existing DM family is sufficient.
- No video embeds on the landing.

## 7. Testing strategy

- `npm run build` + `npm run lint` gates after each phase.
- Manual browser check on landing at localhost:3000 — verify animations play, text renders correctly, no layout jumps.
- Manual check on `/dashboard/review/[jobId]` — verify sidebar stays cream, main pane is dark, all interactions (keyboard, pickers, modals) still work.
- Lighthouse pass on landing: aim for LCP < 2.5s on desktop (hero animations lazy-load with Framer Motion).

## 8. Rollout

- Single branch → merge to main → Vercel auto-deploy.
