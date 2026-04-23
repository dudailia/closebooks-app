# Review Experience Upgrade — Design Spec

**Date:** 2026-04-23
**Status:** Approved
**Goal:** Make the CloseBooks transaction-review workflow the fastest and most satisfying review experience ever built for accounting software. Linear-grade keyboard control, learning rules engine, Notion-grade bulk actions, splits, and universal undo.

---

## 1. Architecture — Shared Plumbing

Three cross-cutting systems shared by all five features.

### 1.1 `KeyboardShortcutProvider`

- Location: `src/lib/review/KeyboardShortcutProvider.tsx`
- Scope: wraps the `/dashboard/categorize/[id]` review page (not app-wide — keeps blast radius small).
- API: `useShortcut(key, handler, { label, group })` hook + `<ShortcutLegend />` overlay.
- Dedupe: components register shortcuts by ID; legend renders all active registrations.
- Focus rules: ignores keys while focus is in `input/select/textarea`, except `Escape` and `/` (which refocuses search).
- First-visit hint: bottom-right pill "Press `?` for shortcuts" that fades after 3s.

### 1.2 Undo stack

- Location: `src/lib/review/undoStack.ts`
- Data: array of `{ id, label, inverse: () => void, createdAt }` entries, max 50.
- Session-only (not persisted across reloads — matches Linear, avoids multi-user footguns).
- Hook: `useUndoStack()` returns `{ push, undo, redo, entries }`.
- Redo stack cleared on new push; `<HistoryDrawer>` (⌘⇧H) lists last 20 for discoverability.

### 1.3 `category_rules` — Smart Rules table

- Supabase payload-row table (reuses the pattern from `corrections`).
- Schema per row:
  ```
  { id, firm_id, vendor_pattern, account_code, category_name,
    created_by, created_at, times_applied, last_applied_at, active }
  ```
- Helper module `src/lib/review/rules.ts`:
  - `hydrateRules(supabase, firmId)`
  - `saveRule(pattern, accountCode, categoryName)`
  - `deleteRule(id)`
  - `toggleRule(id, active)`
  - `matchRules(description): { accountCode, category, ruleId } | null`
  - `findMatchingPending(rule, txs): Transaction[]` — preview for toast
- Vendor normalization in `src/lib/review/vendor.ts`:
  - Lowercase, strip trailing IDs/dates/numeric sequences, collapse whitespace.
  - `"NOTION.SO/SUBSCRIPTION 0421"` → `"notion.so"`.
  - `"AMZN MKTP US*Y123ABC"` → `"amzn mktp"`.
- Apply points: (1) on categorization job hydration — pre-apply matches with confidence 1.0, status `edited`; (2) on manual category change — prompt offers rule save with live count preview.

---

## 2. Feature 1 — Keyboard-First Workflow

### Shortcuts

| Key | Action |
|---|---|
| `J` / `K` | Next / prev row |
| `⇧J` / `⇧K` | Extend selection down/up |
| `X` or `Space` | Toggle checkbox on focused row |
| `A` | Approve focused (or selected if any) |
| `R` | Reject/flag focused (or selected) |
| `E` | Open inline category picker on focused row |
| `S` | Open split modal for focused row |
| `Enter` | Expand/collapse focused row |
| `⌘Enter` | Approve all high-confidence (≥85%) |
| `⌘D` | Mark focused (or selected) as duplicate |
| `/` | Focus search |
| `⌘K` | Command palette (every action, fuzzy search) |
| `⌘Z` | Undo last action |
| `⌘⇧Z` | Redo |
| `⌘⇧H` | History drawer |
| `?` | Pin shortcut legend open |

### Components

- `src/components/review/ShortcutLegend.tsx` — pin-open overlay with grouped shortcut list.
- `src/components/review/CommandPalette.tsx` — ⌘K fuzzy search across all actions.
- `src/components/review/InlineCategoryPicker.tsx` — type-ahead picker rendered inline on focused row (triggered by `E`). Type "soft" → filters to "Software Subscriptions". Enter picks.

---

## 3. Feature 2 — Smart Rules Engine

### Edit flow

1. CPA changes category via `handleCategoryChange` in `TransactionRow`.
2. Existing `saveCorrection()` stays (passive log).
3. `<SaveRuleToast>` appears with live preview:
   > "Always categorize **Notion** as Software Subscriptions? This will also fix **4 other pending transactions**. `[Save rule]` `[Dismiss]`"
4. On save:
   - Rule persisted.
   - Matching pending transactions updated (confidence 1.0, status `edited`, audit `rule_auto_applied`).
   - Undo toast: "Rule saved · Applied to 5 transactions. Undo (⌘Z)".

### Proactive suggestions

- After CPA approves 3+ transactions with the same normalized vendor + same category without using an existing rule, toast:
  > "You approved 3 Stripe charges as Transaction Fees — save this as a rule?"
- Hysteresis: only once per vendor per session to avoid nagging.

### Collision detection

- If `saveRule()` finds an active rule with same `vendor_pattern`, toast asks "Replace existing rule?" before overwriting.

### Hydration

- On load of a categorization job, `applyRulesToJob()` walks transactions and applies matches to `pending` ones before the CPA sees them. Status becomes `edited`, confidence 1.0.

### Settings page

- Path: `src/app/dashboard/settings/rules/page.tsx`
- List: all rules sorted by `times_applied` desc.
- Inline edit category, toggle active/inactive, delete.
- Header stats: "42 rules active · applied 1,247 times · est. 14 hrs saved" (hours = applied × 40s ÷ 3600).
- Empty state: copy about how rules are created from review.

### Supabase migration

- File: `supabase/migrations/2026-04-23-category-rules.sql`
- Creates `category_rules` table with firm_id RLS (mirroring `corrections`).

---

## 4. Feature 3 — Sliding Bulk Action Bar

### Component

- `src/components/review/BulkActionBar.tsx`
- Rendered in a portal at bottom-center of the viewport.
- Slide-up animation on first selection; slide-down on deselect.
- Replaces the current inline "someSelected" pill in `TransactionTable`.

### Layout

```
[ 14 selected · $12,410.55 ]  Approve  Change Category  Flag  Duplicate  Note…  Split  Export  ✕
```

### Actions

- **Approve All** — same as current `bulkApprove`, pushes single undo entry.
- **Change Category** — opens `InlineCategoryPicker` scoped to bulk.
- **Flag for Review** — same as current `bulkFlag`.
- **Mark as Duplicate** — sets status `flagged` + notes `duplicate`.
- **Add Note** — inline input, writes same note to all selected.
- **Split…** — only enabled when exactly 1 transaction selected; opens `SplitModal`.
- **Export Selected** — CSV download of selected rows.

### Keyboard

- `⌥1`–`⌥9` trigger actions in bar order.
- `Esc` clears selection.

---

## 5. Feature 4 — Split Transaction

### Data model

Extend `Transaction` in `src/types/index.ts`:

```ts
export interface TransactionSplit {
  id: string
  amount: number
  account_code: string
  category: string
  notes?: string
}

export type Transaction = {
  // ...existing fields
  splits?: TransactionSplit[]
}
```

### Invariants

- If `splits` is non-empty, `sum(splits.amount) === transaction.amount` (enforced on save; UI disables Save button while out of balance).
- Parent status becomes `edited` once split.
- Parent's `final_category` / `final_account_code` become ignored for reporting — P&L and trial balance read from splits when present.
- Audit event `tx_split` records the split children.

### UI

- `src/components/review/SplitModal.tsx`
- 3-column editable grid: amount · category picker · notes.
- Add/remove rows (min 2, no explicit max — common case 2–4).
- Quick actions: **Split evenly**, **50/50**.
- Live balance pill: `$0.00 remaining ✓` (green) or `$12.50 over ✗` (red).
- Save disabled while out of balance.

### Split templates (insanely-cool touch)

- After a split is saved, offer: "Save this split pattern as a template? (e.g., 'Amazon: 60% office / 40% equipment')".
- Templates stored as `split_templates` payload-row table; applied from a dropdown in the modal.

### Reporting integration

- `lib/autopilot/pnlCalculator.ts` and `lib/autopilot/journalEntries.ts` must check for `splits` first; iterate splits instead of the parent.

---

## 6. Feature 5 — Undo / Redo

### Undo entries

Every mutation pushes a `{ label, inverse }` pair. Inverses are pure state functions — they restore the pre-action snapshot for the affected transaction IDs.

Actions covered:

| Action | Label | Inverse |
|---|---|---|
| Approve single | "Approved {desc}" | Restore prior status/final_* |
| Reject single | "Flagged {desc}" | Restore prior status |
| Edit category | "Changed category to {cat}" | Restore prior final_* |
| Bulk approve | "Approved {n} transactions" | Restore all prior statuses |
| Bulk flag | "Flagged {n} transactions" | Restore all prior statuses |
| High-conf bulk approve | "Approved {n} high-confidence" | Restore all prior statuses |
| Rule save + apply | "Saved rule · applied to {n}" | Delete rule + restore states |
| Split | "Split {desc} into {n} lines" | Remove splits, restore parent |
| Rules-engine auto-apply (on load) | "Rule auto-applied to {n}" | Restore all prior (first load only) |

### Toasts

- `<ActionToast>` component: slides up from bottom-left, displays message + "Undo (⌘Z)" button.
- Duration: 6s (longer than typical because accountants read carefully).
- Stack up to 3 toasts; oldest drops when 4th arrives.

### History drawer

- `⌘⇧H` opens `<HistoryDrawer>` on the right side.
- Lists last 20 actions with timestamp + "Revert to this point" button.
- Reverting: runs inverses for all newer actions in order; moves redo cursor.

---

## 7. File map

### New files

```
src/lib/review/
  KeyboardShortcutProvider.tsx
  undoStack.ts
  rules.ts
  vendor.ts
  splitTemplates.ts

src/components/review/
  ShortcutLegend.tsx
  CommandPalette.tsx
  InlineCategoryPicker.tsx
  BulkActionBar.tsx
  SaveRuleToast.tsx
  SplitModal.tsx
  ActionToast.tsx
  HistoryDrawer.tsx

src/app/dashboard/settings/rules/page.tsx
supabase/migrations/2026-04-23-category-rules.sql
```

### Modified files

```
src/types/index.ts                              — add TransactionSplit type
src/components/TransactionTable.tsx             — wire provider, undo, new bulk bar
src/components/TransactionRow.tsx               — rule-save prompt, split entrypoint
src/lib/autopilot/pnlCalculator.ts              — read from splits
src/lib/autopilot/journalEntries.ts             — read from splits
src/app/dashboard/categorize/[id]/page.tsx      — wrap in provider, hydrate rules
```

---

## 8. Non-goals (YAGNI)

- No multi-device undo sync.
- No regex in rules (substring only).
- No nested splits (splits of splits).
- No shortcut customization UI.
- No per-user shortcut prefs.
- No rule import/export.

---

## 9. Testing strategy

- Manual verification of every shortcut on `/dashboard/categorize/[id]`.
- `npm run build` passes after each feature (five checkpoints).
- Rules engine: create, apply, collision, undo — all verified in-browser.
- Split: balance math, reporting integration, undo.
- Undo stack: stress with 50+ actions, verify cap.

## 10. Rollout

- All five features ship together in one branch → merge to main → auto-deploy to Vercel.
- Final commit pushes to GitHub and triggers Vercel production deploy.
