# Landing Foundation Pass — Motion System, Reduced-Motion, Type Scale

**Date:** 2026-06-26
**Status:** Approved design — ready for implementation plan
**Scope owner:** ilia duda
**Surface:** Public marketing site only (`src/app/page.tsx` + `src/components/landing/*` + `PublicShell`). **No `/dashboard` changes.**

---

## 1. Goal

Elevate the CloseBooks public landing page toward the visual bar set by Linear, Vercel, Stripe, Raycast, and Resend — specifically their **animation coherence and typographic confidence**. The product is an accounting/compliance tool for CPA firms, so the bar is **"confident and premium," not "flashy at the expense of trust."**

This spec covers **only the foundation pass**. It does not redesign individual sections and does not edit the page's narrative/section structure. Those are explicitly deferred (see §9).

## 2. Diagnosis (why this work, not "more animation")

The page is already dense and capable: 12 in-`<main>` sections plus `Nav`/`Footer`, ~17 framer-motion components, premium fonts (Inter / Instrument Serif / JetBrains Mono), and a clean cross-theme token system. The gap to the reference set is **coherence and editorial discipline**, not quantity of motion. Concretely:

- Easing `[0.16, 1, 0.3, 1]` is copy-pasted inline across files; each section reinvents its own reveal/timing.
- `prefers-reduced-motion` is honored **nowhere** in the repo (only an unused legacy component references a hook). This violates a hard constraint.
- Section headers use slightly different sizes/weights per section — no single type scale.

## 3. Hard constraints (non-negotiable)

1. **Do not touch anything under `/dashboard`** — separate theme, separate session.
2. **Do not break the AgentOrchestra orbit** (`src/components/landing/AgentOrchestra.tsx`) — node `x/y` positions and the ActivityFeed placement are a frozen working baseline. Build on it; do not redo it.
3. **Must work cleanly across all breakpoints**, not just desktop.
4. **Must respect `prefers-reduced-motion`.**
5. **Trust over flash** — premium and calm, never jittery or gimmicky.

## 4. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | Structural scope this round | **Foundation only.** No section cuts, merges, or reordering. |
| D2 | Motion retrofit aggressiveness | **Normalize to one motion language.** Every section adopts the unified easing/duration/stagger tokens; bespoke reveals route through one primitive. |
| D3 | Type-scale strictness | **Strict single scale.** All sections refactored to one scale; visible conformance changes are accepted. |
| D4 | Section consolidation idea | **Deferred** to a separate written proposal after this pass; no content changes here (see §9). |
| D5 | CtaBand typography | **Share `.t-h1` with the orbit — no special-case type.** The CTA's weight comes from composition (whitespace, accent color, button prominence), not a bigger/heavier font. Driven partly by the fact that Instrument Serif ships at weight 400 only. |
| D6 | Default-user ambient motion | **Left as-is** this round (toning it down is per-section refinement, deferred). Ambient loops only become reduced-motion-aware. |

## 5. Design direction (point of view)

**"Calm precision — the product is the hero."** Motion should demonstrate the work (the Hero transaction feed and the orbit already do this) and otherwise be deliberate and settled: slow expo-out reveals, one signature moment per section, zero ambient jitter. Confident display-serif headlines, generous whitespace, instrument-grade restraint.

## 6. Motion system (the backbone)

New files, single source of truth, no per-section invention:

### 6.1 `src/lib/landing/motion.ts`
Exports motion tokens:
- `ease.out = [0.16, 1, 0.3, 1]` (existing signature expo-out, promoted to canonical); `ease.inOut` for ambient loops.
- `duration = { fast: 0.3, base: 0.5, slow: 0.7 }`
- `stagger = { tight: 0.06, base: 0.10, loose: 0.14 }`
- `distance = { sm: 12, md: 20, lg: 40 }`
- `fadeUp(delay, distance?)` — variant factory returning `{ hidden, show }` using the tokens.

### 6.2 `src/components/landing/motion/Reveal.tsx`
One scroll-entrance primitive. Props: `as` (element/component, default `div`), `delay`, `distance`, `className`, `style`, children.
- Uses `whileInView` with `viewport={{ once: true, amount: 0.25, margin: '-80px' }}`.
- Reads tokens from `motion.ts`.
- **Every section's hand-rolled fade-up entrance is replaced by `<Reveal>`.** This is the normalization in D2.

### 6.3 Global framer gate
Wrap the public tree (in `page.tsx` and `PublicShell`) in `<MotionConfig reducedMotion="user">`. Framer then automatically reduces transform/scale/position animations and retains opacity for reduced-motion users.

### 6.4 Retrofit rule per section
Replace inline `transition={{ ...ease... }}` and hand-rolled `initial/animate/variants` with the tokens and/or `<Reveal>`. Ambient signature loops (Hero mockup float, badge pulse, orbit rotation) keep running for default users (D6) but become reduced-motion-aware (§7).

## 7. Reduced-motion — three layers

One layer is insufficient because motion comes from framer, CSS keyframes, and JS intervals. **All reduced-motion CSS and gating is scoped to the public surface** (see §8) so the dashboard and the review page (both of which also use `data-theme="dark"`) are unaffected.

1. **Framer layer:** `<MotionConfig reducedMotion="user">` — transform/position/scale animations skipped, opacity fades retained.
2. **CSS layer:** a `@media (prefers-reduced-motion: reduce)` block scoped to `[data-surface="public"]` in `globals.css` that neutralizes the global keyframe animations (`float`, `float-gentle`, `pulse-soft`, `pulse-dot`, `shimmer`, `green-shimmer`, `glow-pulse`, `fadeUp`, `fadeSlideIn`, `expandRow`, `pageFadeUp`, `spin` where decorative) and collapses transition durations on public surfaces.
3. **JS-interval layer:** new `src/lib/landing/usePrefersReducedMotion.ts` (`matchMedia('(prefers-reduced-motion: reduce)')` with change listener). Gates timer-driven demos to a **static final state** and prevents intervals from starting:
   - Hero `TypewriterText` → render full text immediately.
   - Hero `TransactionFeedDemo` → render all rows present + success bar shown; no loop.
   - AgentOrchestra active-node cycling → render one node in the active state; no rotation/cycle.
   - AutomationTheater sequencer → render its resolved/final frame; no auto-advance.

## 8. Public-surface scoping

Add `data-surface="public"` to:
- the landing root `<div>` in `src/app/page.tsx`, and
- the `PublicShell` wrapper (`src/components/landing/PublicShell.tsx`).

All reduced-motion CSS overrides and the type-scale classes are scoped under `[data-surface="public"]`. This is the mechanism that guarantees the dashboard (including the `data-theme="dark"` review page) is never affected by this work.

## 9. Orbit handling (AgentOrchestra, increment 6)

- **Frozen:** the `AGENTS` array (`name/role/color/x/y`) and the ActivityFeed JSX/placement are byte-for-byte unchanged.
- **Applied:** entrance routed through `<Reveal>`/tokens (no visible change); joins the reduced-motion gate so infinite rotation + node pulse + active-cycling freeze to a clean static frame for reduced-motion users.
- **Guard:** before committing increment 6, diff-confirm the `AGENTS` x/y values and the feed block are unchanged. Only `Reveal`/token wiring and the reduced-motion gate are added.

## 10. Type scale (strict, approved verbatim)

Implemented as CSS custom properties + utility classes in `globals.css`, **scoped under `[data-surface="public"]`**. Sections replace inline `fontSize/lineHeight/letterSpacing/fontWeight` with these classes; color stays per-section via existing text tokens.

| Class | Font | Size (clamp) | Line-height | Tracking | Weight | Used for |
|-------|------|-------------|-------------|----------|--------|----------|
| `.t-display` | Instrument Serif | `clamp(48px, 7vw, 72px)` | 1.04 | −0.04em | 400 | Hero H1 **only** |
| `.t-h1` | Instrument Serif | `clamp(36px, 5vw, 58px)` | 1.05 | −0.035em | 400 | Major section headers (orbit, CTA) |
| `.t-h2` | Instrument Serif | `clamp(28px, 3.6vw, 42px)` | 1.1 | −0.03em | 400 | Standard section headers |
| `.t-h3` | Inter | `clamp(19px, 2vw, 22px)` | 1.3 | −0.02em | 600 | Card / sub-headers |
| `.t-eyebrow` | Inter | `12px` | 1 | 0.18em, uppercase | 700 | Section kicker labels (accent) |
| `.t-body-lg` | Inter | `18px` | 1.7 | −0.01em | 400 | Hero sub, section intros |
| `.t-body` | Inter | `16px` | 1.6 | 0 | 400 | Standard paragraphs |
| `.t-body-sm` | Inter | `14px` | 1.5 | 0 | 400 | Secondary copy |
| `.t-caption` | Inter | `13px` | 1.45 | 0 | 500 | Meta / trust lines |
| `.t-data` | JetBrains Mono | inherits | — | −0.02em | 500, tabular-nums | Stats, amounts, metrics |

Decisions baked in: headings stay on Instrument Serif in three sizes (not one); `.t-display` is reserved to the Hero so nothing competes with it; the orbit's current header (`clamp(40, 5.8vw, 70)`) steps down to `.t-h1` — an intentional visible reduction.

## 11. Rollout — infra once, then one section per commit

Each increment is its own commit → Vercel preview → user sign-off → next. No increment starts before the previous is visually confirmed.

**Increment 0 — Infra & scoping (invisible to default users).** Add `data-surface="public"` to landing root + `PublicShell`; add `src/lib/landing/motion.ts`, `Reveal.tsx`, `usePrefersReducedMotion.ts`; wrap public tree in `<MotionConfig reducedMotion="user">`; add type-scale classes + scoped `@media (prefers-reduced-motion: reduce)` block to `globals.css`. Nothing consumes the type classes yet, so default rendering is unchanged; only reduced-motion users see new neutralization. Verify: identical render for default users.

Then, per the approved order:

```
 1. Nav            ← proof increment
 2. Hero
 3. StatBand
 4. TrustSection
 5. AutomationTheater
 6. AgentOrchestra   (orbit — positions/feed frozen; guarded diff)
 7. WhyCloseBooks
 8. BentoGrid
 9. HowItWorks
10. Testimonials
11. PilotOffer
12. PricingSection
13. CtaBand          (composition-driven emphasis within .t-h1)
14. Footer
```

**Per-section recipe:** (a) route entrances through `<Reveal>`/tokens; (b) swap inline typography → scale classes; (c) gate any interval/ambient under reduced-motion. CtaBand (13) additionally strengthens conversion weight through whitespace/accent/button composition, staying within `.t-h1`.

## 12. Verification reality

Local `next build` / `next dev` hangs in this workspace (iCloud/long-running), and `next.config.mjs` has `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` set, so `tsc` does not gate. **The correctness gate per increment is the Vercel preview deploy + user visual check** — the same workflow used throughout this session. Each increment is small and revertible; a regression is fixed or rolled back as a single commit without disturbing the others.

Manual reduced-motion verification per relevant increment: toggle OS "Reduce motion" and confirm the section settles to a static state with no loops/transforms (opacity fades acceptable).

## 13. Out of scope / non-goals

- No `/dashboard` changes of any kind.
- No Hero rebuild (refine within the foundation pass only).
- No orbit redesign or repositioning.
- No section cuts, merges, or reordering (deferred — see §14).
- No WebGL/canvas spectacle, scroll-jacking/pinned storytelling, custom cursors, or color rebrand.
- No toning-down of default-user ambient motion (deferred per-section refinement).

## 14. Follow-up (separate proposals, not this spec)

1. **Section-consolidation proposal.** After this pass, deliver a specific written proposal identifying which of `AutomationTheater → AgentOrchestra → WhyCloseBooks → BentoGrid → HowItWorks` to cut or merge and why, for review and approval before any content change.
2. **Per-section visual refinement** (including any deliberate toning-down of ambient motion for default users).

## 15. Success criteria

- A single motion token module + `Reveal` primitive exist and are used by all 14 public components; no inline easing literals remain in landing sections.
- `prefers-reduced-motion: reduce` produces a calm, static-final-state page across all 14 components, verified manually; dashboard/review unaffected.
- One strict type scale is defined and applied across all 14 components; no ad-hoc heading sizes remain in landing sections.
- The orbit's node positions and feed placement are provably unchanged (guarded diff).
- Every increment shipped via its own commit + preview + sign-off; nothing under `/dashboard` modified.
