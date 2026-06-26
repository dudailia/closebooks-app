# Landing Foundation Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the public landing page one motion language, a global reduced-motion gate, and one strict type scale — without touching `/dashboard` or moving the AgentOrchestra orbit.

**Architecture:** Add a small motion-token module + a single `Reveal` scroll primitive + a `usePrefersReducedMotion` hook, wrap the public tree in `<MotionConfig reducedMotion="user">`, and add type-scale classes + a `prefers-reduced-motion` reset to `globals.css` — all scoped to a new `[data-surface="public"]` root so the dashboard and the `data-theme="dark"` review page are never affected. Then retrofit the 14 public components one per commit.

**Tech Stack:** Next.js App Router, React, TypeScript, framer-motion, inline-style components + `globals.css`, Vercel preview deploys.

## Global Constraints

- **No changes under `src/app/dashboard/**` or any dashboard component.** (spec §3.1)
- **AgentOrchestra orbit is frozen:** the `AGENTS` array (`name/role/color/x/y`) and the ActivityFeed JSX/placement must be byte-for-byte unchanged. (spec §3.2, §9)
- **All reduced-motion CSS + type classes scoped under `[data-surface="public"]`.** (spec §8)
- **Default-user ambient motion left as-is**; only made reduced-motion-aware. (spec §D6)
- **CtaBand shares `.t-h1`** with the orbit — no special-case typography; emphasis via composition. (spec §D5)
- **Type scale is the approved table verbatim** (see Task 0, Step 6). (spec §10)
- **No test runner / no `tsc` gate / local build hangs.** Per-task gate = static grep self-check → commit → push → Vercel preview → **user visual sign-off before the next task** + reduced-motion OS toggle check. (spec §12)
- **Canonical easing literal to eradicate from sections:** `[0.16, 1, 0.3, 1]` (and its spaced variants) — must live only in `src/lib/landing/motion.ts` after the pass. (spec §15)
- **One commit per increment; never start an increment before the previous is signed off.** (spec §11)

---

## File Structure

**New files:**
- `src/lib/landing/motion.ts` — motion tokens (`ease`, `duration`, `stagger`, `distance`) + `fadeUp()` variant factory. Single source of truth for easing/timing.
- `src/components/landing/motion/Reveal.tsx` — the one scroll-entrance primitive used by every section.
- `src/lib/landing/usePrefersReducedMotion.ts` — client hook gating JS-interval demos to a static final state.

**Modified files:**
- `src/app/page.tsx` — add `data-surface="public"`, wrap tree in `<MotionConfig reducedMotion="user">`.
- `src/components/landing/PublicShell.tsx` — add `data-surface="public"` to its wrapper.
- `src/app/globals.css` — add type-scale classes + scoped `prefers-reduced-motion` reset.
- The 14 public components (one per task, Tasks 1–14).

---

## Task 0: Infra & scoping (invisible to default users)

**Files:**
- Create: `src/lib/landing/motion.ts`
- Create: `src/components/landing/motion/Reveal.tsx`
- Create: `src/lib/landing/usePrefersReducedMotion.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/landing/PublicShell.tsx`
- Modify: `src/app/globals.css`

**Interfaces produced (every later task consumes these):**
- `ease.out: [number,number,number,number]`, `ease.inOut`, `duration.{fast,base,slow}`, `stagger.{tight,base,loose}`, `distance.{sm,md,lg}`, `fadeUp(delay?: number, dist?: number): Variants` — from `@/lib/landing/motion`.
- `Reveal` (named + default export) — props `{ delay?: number; distance?: number } & HTMLMotionProps<'div'>` — from `@/components/landing/motion/Reveal`.
- `usePrefersReducedMotion(): boolean` (named + default export) — from `@/lib/landing/usePrefersReducedMotion`.
- CSS classes under `[data-surface="public"]`: `.t-display .t-h1 .t-h2 .t-h3 .t-eyebrow .t-body-lg .t-body .t-body-sm .t-caption .t-data`.

- [ ] **Step 1: Create `src/lib/landing/motion.ts`**

```ts
import type { Transition, Variants } from 'framer-motion'

// Canonical easing — the only place these literals are allowed to live.
export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
}

export const duration = { fast: 0.3, base: 0.5, slow: 0.7 } as const
export const stagger = { tight: 0.06, base: 0.1, loose: 0.14 } as const
export const distance = { sm: 12, md: 20, lg: 40 } as const

export const transitionBase: Transition = { duration: duration.base, ease: ease.out }

export function fadeUp(delay = 0, dist: number = distance.md): Variants {
  return {
    hidden: { opacity: 0, y: dist },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, ease: ease.out, delay },
    },
  }
}
```

- [ ] **Step 2: Create `src/components/landing/motion/Reveal.tsx`**

```tsx
'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { fadeUp, distance as distanceTokens } from '@/lib/landing/motion'

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number
  distance?: number
}

export function Reveal({
  delay = 0,
  distance = distanceTokens.md,
  children,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25, margin: '-80px' }}
      variants={fadeUp(delay, distance)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
```

Note: under `<MotionConfig reducedMotion="user">`, framer drops the `y` transform for reduced-motion users and keeps the opacity fade automatically — no extra branch needed in `Reveal`.

- [ ] **Step 3: Create `src/lib/landing/usePrefersReducedMotion.ts`**

```ts
'use client'
import { useEffect, useState } from 'react'

// SSR-safe: returns false on the server / first paint, then syncs to the OS setting.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export default usePrefersReducedMotion
```

- [ ] **Step 4: Wire `src/app/page.tsx` — add `data-surface` + `MotionConfig`**

Add the import and wrap the returned tree. The file is a server component that renders client children; `MotionConfig` is a client component and is valid to render here, and its context reaches the client section components.

```tsx
import { MotionConfig } from 'framer-motion'
// ...existing imports unchanged...

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        data-theme="dark"
        data-surface="public"
        style={{
          minHeight: '100vh',
          backgroundColor: '#080808',
          color: '#FAFAFA',
          overflowX: 'clip',
        }}
      >
        <Nav />
        <main>
          {/* ...all existing sections unchanged... */}
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
```

- [ ] **Step 5: Add `data-surface="public"` to `PublicShell`**

Read `src/components/landing/PublicShell.tsx` first. Add `data-surface="public"` to its outermost wrapper element (this covers the other public pages — about, pricing, security, etc. — that render through `PublicShell` rather than `page.tsx`). Do not change its theme/styles otherwise.

- [ ] **Step 6: Append the type-scale classes to `src/app/globals.css`**

Append at the end of the file:

```css
/* ---------------------------------------------------------------------------
   Public landing — strict type scale (scoped; never touches dashboard)
--------------------------------------------------------------------------- */
[data-surface="public"] .t-display { font-family: var(--font-display); font-size: clamp(48px, 7vw, 72px); line-height: 1.04; letter-spacing: -0.04em; font-weight: 400; }
[data-surface="public"] .t-h1      { font-family: var(--font-display); font-size: clamp(36px, 5vw, 58px); line-height: 1.05; letter-spacing: -0.035em; font-weight: 400; }
[data-surface="public"] .t-h2      { font-family: var(--font-display); font-size: clamp(28px, 3.6vw, 42px); line-height: 1.1; letter-spacing: -0.03em; font-weight: 400; }
[data-surface="public"] .t-h3      { font-family: var(--font-sans); font-size: clamp(19px, 2vw, 22px); line-height: 1.3; letter-spacing: -0.02em; font-weight: 600; }
[data-surface="public"] .t-eyebrow { font-family: var(--font-sans); font-size: 12px; line-height: 1; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; }
[data-surface="public"] .t-body-lg { font-family: var(--font-sans); font-size: 18px; line-height: 1.7; letter-spacing: -0.01em; font-weight: 400; }
[data-surface="public"] .t-body    { font-family: var(--font-sans); font-size: 16px; line-height: 1.6; font-weight: 400; }
[data-surface="public"] .t-body-sm { font-family: var(--font-sans); font-size: 14px; line-height: 1.5; font-weight: 400; }
[data-surface="public"] .t-caption { font-family: var(--font-sans); font-size: 13px; line-height: 1.45; font-weight: 500; }
[data-surface="public"] .t-data    { font-family: var(--font-mono); letter-spacing: -0.02em; font-weight: 500; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 7: Append the scoped reduced-motion reset to `src/app/globals.css`**

Append after the type-scale block. The scoped universal reset is chosen over enumerating each keyframe (spec §7.2) — it is equivalent, robust to future keyframes, and cannot leak past `[data-surface="public"]`:

```css
/* Reduced-motion — public surfaces only (dashboard + review page untouched) */
@media (prefers-reduced-motion: reduce) {
  [data-surface="public"],
  [data-surface="public"] *,
  [data-surface="public"] *::before,
  [data-surface="public"] *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 8: Static self-check**

Run:
```bash
grep -rn "data-surface=\"public\"" src/app/page.tsx src/components/landing/PublicShell.tsx
grep -n "MotionConfig" src/app/page.tsx
grep -n "\.t-display\|prefers-reduced-motion" src/app/globals.css
ls src/lib/landing/motion.ts src/components/landing/motion/Reveal.tsx src/lib/landing/usePrefersReducedMotion.ts
```
Expected: `data-surface` present in both files; `MotionConfig` imported + used; both globals.css blocks present; all three new files exist.

- [ ] **Step 9: Commit + push**

```bash
git add src/lib/landing/motion.ts src/components/landing/motion/Reveal.tsx src/lib/landing/usePrefersReducedMotion.ts src/app/page.tsx src/components/landing/PublicShell.tsx src/app/globals.css
git commit -m "feat(landing): motion tokens, Reveal primitive, reduced-motion gate + type scale (infra only)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 10: Preview gate**

Wait for Vercel preview. **User verifies:** the landing page renders **identically** to before for default users (nothing consumes the type classes yet); then toggles OS "Reduce motion" and confirms ambient loops/transitions are neutralized on the landing page only. **Do not start Task 1 until signed off.**

---

## Per-Section Transform — the standard recipe (Tasks 1–14)

Every section task applies this exact procedure to its file(s). Tasks below list only the **file path, section-specific specifics, and commit message**; the steps are identical:

- [ ] **A. Read the section file** in full before editing.
- [ ] **B. Add imports** as needed:
  - `import { Reveal } from '@/components/landing/motion/Reveal'`
  - `import { ease, duration, stagger } from '@/lib/landing/motion'` (only if inline easing/timing remains after switching entrances to `Reveal`)
  - `import { usePrefersReducedMotion } from '@/lib/landing/usePrefersReducedMotion'` (only if the section runs JS timers — see per-section specifics)
- [ ] **C. Entrances → `Reveal`.** Replace each top-level entrance `motion.<el>` (the ones doing a one-shot `initial`/`whileInView`/`animate` fade-up using `[0.16,1,0.3,1]`) with `<Reveal delay={…}>`. For staggered groups, give children `delay={i * stagger.base}`. Delete the inline easing literal in the process.
- [ ] **D. Remaining inline easing/timing → tokens.** Any `transition={{ ease: [0.16,1,0.3,1], duration: … }}` that must stay on a non-`Reveal` element becomes `transition={{ ease: ease.out, duration: duration.base }}`. Ambient infinite loops (floats/pulses) keep their values but swap the easing literal for `ease.inOut`/`ease.out`.
- [ ] **E. Typography → scale classes.** Replace inline `fontSize/lineHeight/letterSpacing/fontFamily/fontWeight` on text nodes with the nearest class, keeping `color` inline/token. Mapping rule:
  - kicker/label above a heading → `t-eyebrow`
  - the section's main heading → `t-h2` (**exception:** AgentOrchestra & CtaBand → `t-h1`; Hero `<h1>` → `t-display`)
  - card/sub-headings → `t-h3`
  - lead/intro paragraph → `t-body-lg`; standard paragraph → `t-body`; secondary → `t-body-sm`; meta/legal/trust line → `t-caption`
  - numeric stats/amounts/metrics → `t-data`
- [ ] **F. Reduced-motion for JS timers** (only sections flagged below): `const reduced = usePrefersReducedMotion()`; when `reduced`, render the **final static state** and skip `setInterval`/`setTimeout`/typewriter loops.
- [ ] **G. Static self-check.** Run:
  ```bash
  grep -n "0.16, 1, 0.3, 1\|0.16,1,0.3,1" src/components/landing/<File>.tsx   # expect: no matches
  grep -n "fontSize:" src/components/landing/<File>.tsx                       # expect: only inside the product-mockup internals, not section headings/copy
  ```
- [ ] **H. Commit + push** with the per-section message, then **wait for Vercel preview + user sign-off before the next task.** Reduced-motion check via OS toggle where the section has motion.

---

## Task 1: Nav (proof increment)

**Files:** Modify `src/components/landing/Nav.tsx`
**Specifics:** Apply recipe A–E + G–H. Nav has no scroll-reveal entrance demos and no JS timers (links/menu only) — focus on (D) easing-literal → `ease.*` on any hover/menu transitions and (E) nav-link/CTA typography → `t-body-sm`/`t-caption` as appropriate. No `usePrefersReducedMotion` needed unless a timer is found on read.
**Commit:** `style(landing): route Nav through motion tokens + type scale`

## Task 2: Hero

**Files:** Modify `src/components/landing/Hero.tsx`
**Specifics:** Apply recipe. Heading `<h1>` → `t-display`; badge label → `t-caption`/`t-eyebrow`; sub-headline → `t-body-lg`; trust line → `t-caption`; mockup data → `t-data`. **(F) required — two timers:** `TypewriterText` (when `reduced`, render full `text` immediately, skip the interval) and `TransactionFeedDemo` (when `reduced`, render all rows in final state + success bar shown, skip the cycle timers). Convert the `fadeUp` variants object already in the file to import from `@/lib/landing/motion` (delete the local duplicate). Keep `MagneticButton` and the mockup float as-is (ambient, now globally reduced-motion-aware).
**Commit:** `style(landing): Hero on motion tokens + type scale, reduced-motion for typewriter/feed`

## Task 3: StatBand

**Files:** Modify `src/components/landing/StatBand.tsx` (and `StatCounter.tsx` if the count-up lives there)
**Specifics:** Apply recipe. Stat numbers → `t-data`; labels → `t-caption`/`t-body-sm`; any heading → `t-h2`. **(F) required if a count-up animation exists:** when `reduced`, render the final value immediately, skip the tween/interval.
**Commit:** `style(landing): StatBand on motion tokens + type scale, reduced-motion for counters`

## Task 4: TrustSection

**Files:** Modify `src/components/landing/TrustSection.tsx`
**Specifics:** Apply recipe A–E + G–H. Heading → `t-h2`; eyebrow → `t-eyebrow`; supporting copy → `t-body`/`t-body-sm`; logo/label captions → `t-caption`. No timers expected (confirm on read).
**Commit:** `style(landing): TrustSection on motion tokens + type scale`

## Task 5: AutomationTheater

**Files:** Modify `src/components/landing/AutomationTheater.tsx`
**Specifics:** Apply recipe. Heading → `t-h2`; step labels → `t-h3`/`t-body`; captions → `t-caption`. **(F) required if it auto-advances a sequence:** when `reduced`, render the resolved/final frame and do not start the auto-advance interval.
**Commit:** `style(landing): AutomationTheater on motion tokens + type scale, reduced-motion for sequencer`

## Task 6: AgentOrchestra (orbit — GUARDED)

**Files:** Modify `src/components/landing/AgentOrchestra.tsx`
**Specifics:** Apply recipe **with constraints.** Heading → `t-h1` (steps down from current `clamp(40,5.8vw,70)`); eyebrow → `t-eyebrow`; metric values → `t-data`; node/feed labels → `t-body-sm`/`t-caption`. Route the section entrance (`whileInView` blocks on the two column wrappers) through `Reveal`/tokens. **(F) required:** when `reduced`, freeze the active-node cycling (`setInterval` in the component) to a single active node and stop the infinite rotation/pulse (the global CSS reset covers CSS, but the JS `active` state interval must be gated).
**FROZEN — do not edit:** the `AGENTS` array (`x/y/name/role/color`) and the entire ActivityFeed block + its placement.
**Extra guard step before commit:**
```bash
git diff src/components/landing/AgentOrchestra.tsx | grep -nE "x: [0-9]|y: [0-9]|ActivityFeed|marginTop: 14"
```
Expected: **no lines** touching `x:`/`y:` numbers, the `ActivityFeed` usage, or the feed wrapper. If any appear, revert and redo.
**Commit:** `style(landing): AgentOrchestra type scale + reduced-motion (positions/feed frozen)`

## Task 7: WhyCloseBooks

**Files:** Modify `src/components/landing/WhyCloseBooks.tsx`
**Specifics:** Apply recipe A–E + G–H. Heading → `t-h2`; eyebrow → `t-eyebrow`; card titles → `t-h3`; body → `t-body`. Gate timers only if found.
**Commit:** `style(landing): WhyCloseBooks on motion tokens + type scale`

## Task 8: BentoGrid

**Files:** Modify `src/components/landing/BentoGrid.tsx`
**Specifics:** Apply recipe. Section heading → `t-h2`; tile titles → `t-h3`; tile copy → `t-body`/`t-body-sm`; any tile demo numerics → `t-data`. Stagger tile reveals with `delay={i * stagger.base}`. Gate any per-tile timer/loop with `usePrefersReducedMotion` if present.
**Commit:** `style(landing): BentoGrid on motion tokens + type scale`

## Task 9: HowItWorks

**Files:** Modify `src/components/landing/HowItWorks.tsx`
**Specifics:** Apply recipe. Heading → `t-h2`; step numbers/titles → `t-h3`; step copy → `t-body`; captions → `t-caption`. **(F) if it animates a stepper/progress on a timer:** gate to final step when `reduced`.
**Commit:** `style(landing): HowItWorks on motion tokens + type scale`

## Task 10: Testimonials

**Files:** Modify `src/components/landing/Testimonials.tsx`
**Specifics:** Apply recipe A–E + G–H. Heading → `t-h2`; quotes → `t-body-lg`; attribution → `t-caption`/`t-body-sm`. **(F) if it auto-rotates a carousel:** when `reduced`, show a static set and stop the rotation interval.
**Commit:** `style(landing): Testimonials on motion tokens + type scale`

## Task 11: PilotOffer

**Files:** Modify `src/components/landing/PilotOffer.tsx`
**Specifics:** Apply recipe A–E + G–H. Heading → `t-h2`; eyebrow → `t-eyebrow`; offer copy → `t-body`; fine print → `t-caption`. Gate timers only if found.
**Commit:** `style(landing): PilotOffer on motion tokens + type scale`

## Task 12: PricingSection

**Files:** Modify `src/components/landing/PricingSection.tsx` (and `PricingTiers.tsx` only if it is what `PricingSection` renders on the landing route)
**Specifics:** Apply recipe. Heading → `t-h2`; plan names → `t-h3`; prices → `t-data`; feature rows → `t-body-sm`; disclaimers → `t-caption`. Confirm whether `PricingSection` renders `PricingTiers`; if yes, transform that child too within this commit. Gate timers only if found.
**Commit:** `style(landing): PricingSection on motion tokens + type scale`

## Task 13: CtaBand (composition-driven emphasis)

**Files:** Modify `src/components/landing/CtaBand.tsx`
**Specifics:** Apply recipe. Heading → **`t-h1`** (shared with orbit; **no special-case type**). Build the closing-CTA weight through composition only: increase vertical whitespace/padding, lean on accent color, and make the primary button prominent (size/contrast/glow consistent with the Hero CTA). Subhead → `t-body-lg`; reassurance line → `t-caption`. Gate timers only if found.
**Commit:** `style(landing): CtaBand on motion tokens + type scale, composition-led emphasis`

## Task 14: Footer

**Files:** Modify `src/components/landing/Footer.tsx`
**Specifics:** Apply recipe A–E + G–H. Column headings → `t-h3`/`t-eyebrow`; links → `t-body-sm`; legal/copyright → `t-caption`. Gate timers only if found.
**Commit:** `style(landing): Footer on motion tokens + type scale`

---

## Self-Review

**Spec coverage:**
- §6 motion system → Task 0 Steps 1–4 (motion.ts, Reveal, MotionConfig). ✓
- §7 reduced-motion three layers → framer (Step 4), CSS (Step 7), JS intervals (recipe F + Tasks 2/3/5/6/10). ✓
- §8 public-surface scoping → Steps 4–7. ✓
- §9 orbit guard → Task 6 (frozen array/feed + guard grep). ✓
- §10 type scale → Step 6 (verbatim table) + recipe E across Tasks 1–14. ✓
- §11 rollout order + one commit per increment → Tasks 0–14 in order, each with its own commit + preview gate. ✓
- §D5 CtaBand composition not size → Task 13. ✓
- §D6 ambient left as-is → recipe D keeps loop values, only easing literal + reduced-motion gate change. ✓
- §12 verification reality → Global Constraints + each task's grep + preview gate. ✓

**Placeholder scan:** No "TBD/TODO". Section tasks are recipe-parameterized (files + specifics + commit), not vague — the transform procedure is fully specified once and applied with concrete per-file targets. Exact inline-style replacements are produced by reading each file at execution (recipe Step A), because the inline styles differ per file and must not be guessed.

**Type consistency:** `ease.out`, `duration.*`, `stagger.*`, `distance.*`, `fadeUp(delay, dist)`, `Reveal`, `usePrefersReducedMotion()` are defined in Task 0 and referenced with identical names/signatures throughout. ✓

**Known unknowns (resolved at execution by reading the file, not guessed):** which of Tasks 4/7/8/9/11/12/14 actually run JS timers (recipe F is conditional on finding one); whether `PricingSection` renders `PricingTiers` and whether `StatCounter` holds the count-up. These are flagged in the relevant tasks with explicit "only if found / confirm on read" conditions, not left as silent gaps.
