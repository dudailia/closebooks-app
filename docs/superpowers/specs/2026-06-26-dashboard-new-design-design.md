# Dashboard ↔ new design alignment

**Date:** 2026-06-26
**Status:** Approved (user deferred aesthetic to recommendation; "finish everything")

## Problem

The marketing/landing site runs the new design — dark (`#080808` / `#FAFAFA`), green
`#00C853` glow accents, Instrument Serif display type, grid backdrop (`[data-theme="dark"]`
/ `[data-surface="public"]`). The signed-in dashboard was deliberately left on the old
warm/light "paper" palette (`#faf8f4`, copper, ink) — the layout hardcodes `#faf8f4` and
globals.css notes the new styles are "scoped; never touches dashboard." On sign-in the
brand promise breaks ("I still see old design").

## Decision

**Dark chrome + modernized-light content**, on the existing themeable token layer.

- **Chrome (always dark, by design):** Sidebar + TopBar adopt the landing palette
  (`#080808` surfaces, `#1f1f1f`/`#161616` borders, `#888888` secondary text, `#FAFAFA`
  primary, `#00C853` accent + glow, Instrument Serif logo). This frames every page, so it
  delivers the biggest "new design" punch on sign-in for the least surface area/risk.
- **Content stays light** (`#faf8f4`) for readability of dense financial tables — matches
  category leaders (QuickBooks, Xero, Mercury, Ramp). Modernized via the new design
  *language*: brand green `#00C853`, Instrument Serif headings, refined cards/spacing.
- **Full-dark is a future flip:** because content reads themeable tokens, switching the
  whole app to dark (or adding a user dark-mode toggle) becomes near-free later.

### Rationale (drives users)
Cohesive landing→app first impression protects conversion/trust and signals "AI-native, not
legacy QuickBooks," while light data surfaces protect long-session readability. Full-dark
everywhere was rejected for readability risk + effort across ~60 routes; light-only was
rejected for not resolving the landing↔app contrast.

## Scope / rollout

1. **Phase 1 (this change):** dark chrome (Sidebar, TopBar) + content polish on the
   first-seen pages (Dashboard, Clients). Verified via dev server.
2. **Rollout:** extend the same conventions (brand green, serif headings, card style)
   across remaining dashboard pages. Pages style inline (no shared dashboard component
   library), so this is incremental per-page work.

## Non-goals

- No full-dark content surfaces in Phase 1.
- No unrelated refactor of the ~60 routes' logic.
- Avatar keeps copper (`#b8734a`) as a deliberate warm secondary accent.
