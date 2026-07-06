# CloseBooks Design System

Program documentation for the incremental design-system migration. **No runtime code lives here** — this folder is the contract for how tokens, colors, and components will be unified over time.

## Documents

| Document | Purpose |
|---|---|
| [Design Token Strategy](./design-token-strategy.md) | How tokens are structured, adopted, and enforced |
| [Color Architecture](./color-architecture.md) | Current dual-green state, usage map, migration considerations |
| [Migration Roadmap](./migration-roadmap.md) | Phased plan, PR log, baseline metrics |

## Governing rules

Every migration PR must follow these constraints:

1. **One PR = one logical concern** — never mix tokens + components + page migrations.
2. **Preserve behavior** — no functional regressions.
3. **Preserve accessibility** — focus rings, labels, ARIA, contrast, keyboard nav.
4. **Preserve responsiveness** — mobile breakpoints and touch targets unchanged unless explicitly improving them.
5. **Preserve animations** — unless replacing with a design-system primitive at pixel-equivalent timing.
6. **Every PR compiles** — `npm run build` is the correctness gate.
7. **No visual regressions** — migrated surfaces must match computed styles before merge.
8. **Strangler fig** — add new system alongside old; delete old path only when zero callers remain.

## Folder plan (future implementation)

When code migration begins, primitives will live outside the legacy `src/components/ui/` folder (which currently contains only landing-specific components):

```
src/design-system/
  tokens/          # JS re-exports of CSS variables
  primitives/      # Button, Input, Dialog, Badge, etc.
  patterns/        # PageHeader, EmptyState, DataTable
  adapters/        # Thin bridges to legacy components during migration
```

## Related artifacts

- Stage 3 audit (conversation / `design-system-audit` branch context)
- Migration strategy architecture (approved before PR 1)
- `src/app/globals.css` — current CSS token source of truth

## Status

| Phase | Status |
|---|---|
| Phase 0 — Documentation foundation | **In progress** (PR 1) |
| Phase 1 — Foundation tokens | Not started |
| Phase 2 — Primitive components | Not started |
| Phase 3 — Application migration | Not started |
| Phase 4 — Visual polish & enforcement | Not started |
