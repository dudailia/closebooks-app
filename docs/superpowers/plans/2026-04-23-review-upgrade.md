# Review Experience Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 5 coordinated upgrades to CloseBooks transaction review: keyboard-first workflow, learning rules engine, sliding bulk action bar, split transactions, and universal undo.

**Architecture:** Three shared primitives first (KeyboardShortcutProvider, undo stack, ActionToast), then each of the 5 features layered on. Rules engine uses the same Supabase JSON-payload pattern as the existing `corrections` table.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres + RLS), React 18 inline-style UI (no Tailwind classes for most UI).

**Correctness gates:** No test suite in this repo — `npm run build` (TypeScript strict) and `npm run lint` after each phase. Manual browser verification at `/dashboard/categorize/[id]` at end of each phase.

**Spec:** `docs/superpowers/specs/2026-04-23-review-upgrade-design.md`

---

## Phase A — Shared foundations

### Task 1: KeyboardShortcutProvider + `useShortcut` hook

**Files:**
- Create: `src/lib/review/KeyboardShortcutProvider.tsx`

- [ ] **Step 1: Implement provider and hook**

```tsx
'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'

export interface ShortcutDef {
  id: string
  key: string              // Lowercased, e.g. 'j', 'enter', 'escape'
  meta?: boolean           // ⌘ / Ctrl
  shift?: boolean
  alt?: boolean
  label: string
  group: string            // e.g. 'Navigation', 'Actions'
  handler: (e: KeyboardEvent) => void
}

interface Ctx {
  register: (s: ShortcutDef) => void
  unregister: (id: string) => void
  list: ShortcutDef[]
}

const ShortcutCtx = createContext<Ctx | null>(null)

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ShortcutDef[]>([])
  const listRef = useRef<ShortcutDef[]>([])
  listRef.current = list

  const register = useCallback((s: ShortcutDef) => {
    setList(prev => {
      const filtered = prev.filter(p => p.id !== s.id)
      return [...filtered, s]
    })
  }, [])
  const unregister = useCallback((id: string) => {
    setList(prev => prev.filter(p => p.id !== id))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const tag = target?.tagName?.toLowerCase()
      const typing = tag === 'input' || tag === 'select' || tag === 'textarea' || target?.isContentEditable
      const meta = e.metaKey || e.ctrlKey
      for (const s of listRef.current) {
        const keyMatch = e.key.toLowerCase() === s.key
        const metaMatch = !!s.meta === !!meta
        const shiftMatch = !!s.shift === !!e.shiftKey
        const altMatch = !!s.alt === !!e.altKey
        if (!(keyMatch && metaMatch && shiftMatch && altMatch)) continue
        // Allow / and Escape even while typing; allow meta-combos (⌘K, ⌘Z)
        if (typing && !s.meta && s.key !== 'escape' && s.key !== '/') continue
        e.preventDefault()
        s.handler(e)
        return
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return <ShortcutCtx.Provider value={{ register, unregister, list }}>{children}</ShortcutCtx.Provider>
}

export function useShortcuts(): Ctx {
  const ctx = useContext(ShortcutCtx)
  if (!ctx) throw new Error('useShortcuts must be inside KeyboardShortcutProvider')
  return ctx
}

export function useShortcut(def: Omit<ShortcutDef, 'handler'> & { handler: (e: KeyboardEvent) => void }) {
  const { register, unregister } = useShortcuts()
  const handlerRef = useRef(def.handler)
  handlerRef.current = def.handler
  useEffect(() => {
    register({ ...def, handler: (e) => handlerRef.current(e) })
    return () => unregister(def.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.id, def.key, def.meta, def.shift, def.alt, def.label, def.group])
}
```

- [ ] **Step 2: Verify TypeScript build passes**

Run: `npm run build`
Expected: Build succeeds (provider not yet used anywhere, but compiles).

- [ ] **Step 3: Commit**

```bash
git add src/lib/review/KeyboardShortcutProvider.tsx
git commit -m "feat: add keyboard shortcut provider"
```

---

### Task 2: Undo stack (headless)

**Files:**
- Create: `src/lib/review/undoStack.ts`

- [ ] **Step 1: Implement undo stack + `useUndoStack` hook**

```ts
'use client'
import { useCallback, useRef, useState } from 'react'

export interface UndoEntry {
  id: string
  label: string
  inverse: () => void
  redo?: () => void
  createdAt: number
}

const MAX = 50

export function useUndoStack() {
  const [entries, setEntries] = useState<UndoEntry[]>([])
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([])
  const entriesRef = useRef(entries)
  const redoRef = useRef(redoStack)
  entriesRef.current = entries
  redoRef.current = redoStack

  const push = useCallback((entry: Omit<UndoEntry, 'id' | 'createdAt'>) => {
    const full: UndoEntry = { ...entry, id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() }
    setEntries(prev => [...prev, full].slice(-MAX))
    setRedoStack([])
    return full.id
  }, [])

  const undo = useCallback(() => {
    const e = entriesRef.current[entriesRef.current.length - 1]
    if (!e) return null
    e.inverse()
    setEntries(prev => prev.slice(0, -1))
    setRedoStack(prev => [...prev, e])
    return e
  }, [])

  const redo = useCallback(() => {
    const e = redoRef.current[redoRef.current.length - 1]
    if (!e || !e.redo) return null
    e.redo()
    setRedoStack(prev => prev.slice(0, -1))
    setEntries(prev => [...prev, e].slice(-MAX))
    return e
  }, [])

  const clear = useCallback(() => { setEntries([]); setRedoStack([]) }, [])

  return { entries, redoEntries: redoStack, push, undo, redo, clear }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/review/undoStack.ts
git commit -m "feat: add undo stack hook for review actions"
```

---

### Task 3: `ActionToast` component

**Files:**
- Create: `src/components/review/ActionToast.tsx`

- [ ] **Step 1: Implement stacking toast with undo button**

```tsx
'use client'
import { useEffect, useState, ReactNode } from 'react'

export interface ToastMsg {
  id: string
  message: ReactNode
  onUndo?: () => void
  durationMs?: number
  tone?: 'default' | 'success' | 'warning'
}

interface Props {
  toasts: ToastMsg[]
  onDismiss: (id: string) => void
}

export default function ActionToastStack({ toasts, onDismiss }: Props) {
  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, display: 'flex', flexDirection: 'column-reverse', gap: 8, zIndex: 1000, pointerEvents: 'none' }}>
      {toasts.slice(-3).map(t => <ActionToast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}

function ActionToast({ toast, onDismiss }: { toast: ToastMsg; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
    const t = setTimeout(() => onDismiss(toast.id), toast.durationMs ?? 6000)
    return () => clearTimeout(t)
  }, [toast.id, toast.durationMs, onDismiss])

  const toneBg = toast.tone === 'success' ? '#2d5a27' : toast.tone === 'warning' ? '#b8734a' : '#1a1714'
  return (
    <div style={{
      pointerEvents: 'auto',
      backgroundColor: toneBg, color: '#fff',
      padding: '10px 14px', borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      fontSize: 13, minWidth: 280, maxWidth: 420,
      display: 'flex', alignItems: 'center', gap: 12,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      opacity: mounted ? 1 : 0,
      transition: 'transform 0.18s ease, opacity 0.18s ease',
    }}>
      <div style={{ flex: 1 }}>{toast.message}</div>
      {toast.onUndo && (
        <button
          onClick={() => { toast.onUndo?.(); onDismiss(toast.id) }}
          style={{ border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'transparent', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Undo ⌘Z
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} aria-label="dismiss"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/review/ActionToast.tsx
git commit -m "feat: add stacking ActionToast with undo button"
```

---

## Phase B — Feature 1: Keyboard-first workflow

### Task 4: Wire provider into review page and migrate existing shortcuts

**Files:**
- Modify: `src/app/dashboard/categorize/[id]/page.tsx` — wrap content in `<KeyboardShortcutProvider>`
- Modify: `src/components/TransactionTable.tsx` — delete inline `document.addEventListener('keydown', ...)`, register via `useShortcut`

- [ ] **Step 1: Read the current categorize page**

Run: `sed -n '1,60p' src/app/dashboard/categorize/[id]/page.tsx` to confirm component shape.

- [ ] **Step 2: Wrap review page**

In `src/app/dashboard/categorize/[id]/page.tsx`, import `KeyboardShortcutProvider` and wrap the top-level JSX return:

```tsx
import { KeyboardShortcutProvider } from '@/lib/review/KeyboardShortcutProvider'

// wrap existing top-level element:
return (
  <KeyboardShortcutProvider>
    {/* existing content */}
  </KeyboardShortcutProvider>
)
```

- [ ] **Step 3: Replace the inline `useEffect` keyboard handler in `TransactionTable.tsx`**

Delete the existing `useEffect` block (lines ~263–278) that registers j/k/a/f/Enter via `document.addEventListener`. Replace with `useShortcut` calls:

```tsx
import { useShortcut } from '@/lib/review/KeyboardShortcutProvider'

// inside TransactionTable component, after refs:
useShortcut({ id: 'tt-next', key: 'j', label: 'Next transaction', group: 'Navigation',
  handler: () => {
    const vis = visibleRef.current, fi = focusedIdxRef.current
    if (!vis.length) return
    const n = fi < vis.length - 1 ? fi + 1 : 0
    setFocusedId(vis[n]?.id ?? null)
    setTimeout(() => document.querySelector(`[data-row-id="${vis[n]?.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0)
  }})
useShortcut({ id: 'tt-prev', key: 'k', label: 'Previous transaction', group: 'Navigation',
  handler: () => {
    const vis = visibleRef.current, fi = focusedIdxRef.current
    if (!vis.length) return
    const p = fi > 0 ? fi - 1 : vis.length - 1
    setFocusedId(vis[p]?.id ?? null)
    setTimeout(() => document.querySelector(`[data-row-id="${vis[p]?.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0)
  }})
useShortcut({ id: 'tt-expand', key: 'enter', label: 'Expand / collapse focused', group: 'Navigation',
  handler: () => { if (focusedIdxRef.current >= 0) setEnterTrigger(n => n + 1) } })
useShortcut({ id: 'tt-approve', key: 'a', label: 'Approve selected', group: 'Actions',
  handler: () => { if (selectedRef.current.size > 0) bulkApproveRef.current(); else focusedApprove() } })
useShortcut({ id: 'tt-flag', key: 'r', label: 'Reject / flag selected', group: 'Actions',
  handler: () => { if (selectedRef.current.size > 0) bulkFlagRef.current(); else focusedFlag() } })
```

Add helper functions `focusedApprove` / `focusedFlag` inside the component that act on the currently focused row via `handleChange`.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds. Manually verify in browser that j/k/enter/a still work.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/categorize/[id]/page.tsx src/components/TransactionTable.tsx
git commit -m "refactor: migrate review shortcuts to KeyboardShortcutProvider"
```

---

### Task 5: Add expanded keyboard shortcuts

**Files:**
- Modify: `src/components/TransactionTable.tsx`

- [ ] **Step 1: Add `⇧J` / `⇧K` extend-selection, `X`/`Space` toggle, `⌘Enter` high-conf approve, `⌘D` duplicate, `/` search focus, `?` legend pin**

Add these `useShortcut` calls inside `TransactionTable` (after the existing ones):

```tsx
// Extend selection
useShortcut({ id: 'tt-sel-down', key: 'j', shift: true, label: 'Extend selection down', group: 'Selection',
  handler: () => {
    const vis = visibleRef.current, fi = focusedIdxRef.current
    if (fi < 0 || fi >= vis.length - 1) return
    const cur = vis[fi], nxt = vis[fi + 1]
    setSelected(prev => { const s = new Set(prev); s.add(cur.id); s.add(nxt.id); return s })
    setFocusedId(nxt.id)
  }})
useShortcut({ id: 'tt-sel-up', key: 'k', shift: true, label: 'Extend selection up', group: 'Selection',
  handler: () => {
    const vis = visibleRef.current, fi = focusedIdxRef.current
    if (fi <= 0) return
    const cur = vis[fi], prev = vis[fi - 1]
    setSelected(p => { const s = new Set(p); s.add(cur.id); s.add(prev.id); return s })
    setFocusedId(prev.id)
  }})

// Toggle checkbox
useShortcut({ id: 'tt-toggle-x', key: 'x', label: 'Toggle select on focused row', group: 'Selection',
  handler: () => { const vis = visibleRef.current, fi = focusedIdxRef.current; if (fi >= 0) toggleSelect(vis[fi].id) }})
useShortcut({ id: 'tt-toggle-space', key: ' ', label: 'Toggle select (Space)', group: 'Selection',
  handler: () => { const vis = visibleRef.current, fi = focusedIdxRef.current; if (fi >= 0) toggleSelect(vis[fi].id) }})

// ⌘Enter — high-confidence bulk approve
useShortcut({ id: 'tt-cmd-enter', key: 'enter', meta: true, label: 'Approve all high-confidence', group: 'Actions',
  handler: () => { if (highConfPending > 0) setShowConfirm(true) }})

// ⌘D — duplicate
useShortcut({ id: 'tt-cmd-d', key: 'd', meta: true, label: 'Mark as duplicate', group: 'Actions',
  handler: () => { markDuplicate() }})

// / — focus search
useShortcut({ id: 'tt-search', key: '/', label: 'Focus search', group: 'Navigation',
  handler: () => { searchInputRef.current?.focus() }})
```

Add `searchInputRef` (`useRef<HTMLInputElement>(null)`) and attach it to the existing search `<input>`.

Add `markDuplicate` function that sets status `flagged` + `notes='duplicate'` on focused (or selected) transactions.

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/TransactionTable.tsx
git commit -m "feat: add expanded keyboard shortcuts to transaction table"
```

---

### Task 6: `InlineCategoryPicker` + `E` shortcut

**Files:**
- Create: `src/components/review/InlineCategoryPicker.tsx`
- Modify: `src/components/TransactionTable.tsx` — register `E` shortcut + render picker

- [ ] **Step 1: Create the picker**

```tsx
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChartOfAccounts } from '@/types'

interface Props {
  anchor: { top: number; left: number } | null
  chartOfAccounts: ChartOfAccounts[]
  onSelect: (accountCode: string, categoryName: string) => void
  onClose: () => void
}

export default function InlineCategoryPicker({ anchor, chartOfAccounts, onSelect, onClose }: Props) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (anchor) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 0) } }, [anchor])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const base = chartOfAccounts
    if (!needle) return base.slice(0, 8)
    return base.filter(a => a.name.toLowerCase().includes(needle) || a.code.toLowerCase().includes(needle)).slice(0, 8)
  }, [q, chartOfAccounts])

  if (!anchor) return null

  return (
    <div
      style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 999,
        backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, width: 320 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setIdx(0) }}
        placeholder="Type to find a category…"
        onKeyDown={e => {
          if (e.key === 'Escape') { e.preventDefault(); onClose() }
          if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
          if (e.key === 'Enter') { e.preventDefault(); const a = filtered[idx]; if (a) onSelect(a.code, a.name) }
        }}
        style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid #e0dbd4', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }} />
      <div style={{ marginTop: 4 }}>
        {filtered.length === 0 && <div style={{ padding: 8, fontSize: 12, color: '#a09a94' }}>No matches.</div>}
        {filtered.map((a, i) => (
          <button key={a.code} onMouseDown={e => { e.preventDefault(); onSelect(a.code, a.name) }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 6,
              border: 'none', background: i === idx ? '#f5f0ea' : 'transparent', color: '#1a1714', fontSize: 13, cursor: 'pointer' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6560', marginRight: 6 }}>{a.code}</span>
            {a.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire `E` shortcut + render picker in `TransactionTable`**

```tsx
import InlineCategoryPicker from '@/components/review/InlineCategoryPicker'

// state in TransactionTable:
const [pickerAnchor, setPickerAnchor] = useState<{ top: number; left: number; txId: string } | null>(null)

useShortcut({ id: 'tt-edit-cat', key: 'e', label: 'Edit category on focused row', group: 'Actions',
  handler: () => {
    const vis = visibleRef.current, fi = focusedIdxRef.current
    if (fi < 0) return
    const el = document.querySelector(`[data-row-id="${vis[fi].id}"]`)
    const r = el?.getBoundingClientRect()
    if (!r) return
    setPickerAnchor({ top: r.bottom + 4, left: r.left + 40, txId: vis[fi].id })
  }})

// render near the end of the component:
{pickerAnchor && (
  <InlineCategoryPicker
    anchor={pickerAnchor}
    chartOfAccounts={chartOfAccounts}
    onClose={() => setPickerAnchor(null)}
    onSelect={(code, name) => {
      const tx = transactions.find(t => t.id === pickerAnchor.txId)
      if (!tx) return
      onAudit?.({ action: 'tx_category_changed', txId: tx.id, txDescription: tx.description, details: { from: tx.final_category ?? tx.suggested_category ?? '—', to: name } })
      handleChange({ ...tx, status: 'edited', final_account_code: code, final_category: name })
      setPickerAnchor(null)
    }}
  />
)}
```

Also add a click-away effect that clears `pickerAnchor` on document click outside.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/review/InlineCategoryPicker.tsx src/components/TransactionTable.tsx
git commit -m "feat: add inline category picker triggered by E"
```

---

### Task 7: Command palette (⌘K)

**Files:**
- Create: `src/components/review/CommandPalette.tsx`
- Modify: `src/components/TransactionTable.tsx` — register ⌘K, mount palette

- [ ] **Step 1: Create command palette**

```tsx
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useShortcuts } from '@/lib/review/KeyboardShortcutProvider'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
  const { list } = useShortcuts()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 0) } }, [open])

  const actions = useMemo(() => {
    const all = list.filter(s => s.id !== 'tt-cmd-k')
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter(s => s.label.toLowerCase().includes(needle) || s.group.toLowerCase().includes(needle))
  }, [list, q])

  if (!open) return null

  function run(i: number) {
    const a = actions[i]
    if (!a) return
    onClose()
    setTimeout(() => a.handler(new KeyboardEvent('keydown', { key: a.key })), 0)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, backgroundColor: 'rgba(10,10,10,0.35)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 520, maxWidth: '90vw', backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setIdx(0) }}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, actions.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
            if (e.key === 'Enter') { e.preventDefault(); run(idx) }
          }}
          placeholder="Type an action…"
          style={{ width: '100%', padding: '14px 16px', fontSize: 14, border: 'none', outline: 'none', borderBottom: '1px solid #e0dbd4', boxSizing: 'border-box' }} />
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {actions.length === 0 && <div style={{ padding: 16, fontSize: 12, color: '#a09a94' }}>No actions match.</div>}
          {actions.map((a, i) => (
            <button key={a.id} onMouseDown={e => { e.preventDefault(); run(i) }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '9px 14px', border: 'none', background: i === idx ? '#f5f0ea' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <span>
                <span style={{ fontSize: 11, color: '#a09a94', marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.group}</span>
                <span style={{ fontSize: 13, color: '#1a1714' }}>{a.label}</span>
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6560', border: '1px solid #e0dbd4', borderRadius: 4, padding: '1px 6px' }}>
                {[a.meta && '⌘', a.shift && '⇧', a.alt && '⌥', a.key.toUpperCase()].filter(Boolean).join(' ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register ⌘K and mount palette**

In `TransactionTable.tsx`:

```tsx
import CommandPalette from '@/components/review/CommandPalette'

const [paletteOpen, setPaletteOpen] = useState(false)
useShortcut({ id: 'tt-cmd-k', key: 'k', meta: true, label: 'Open command palette', group: 'Help',
  handler: () => setPaletteOpen(true) })

// render:
<CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/review/CommandPalette.tsx src/components/TransactionTable.tsx
git commit -m "feat: add ⌘K command palette"
```

---

### Task 8: `ShortcutLegend` overlay + ephemeral first-visit hint

**Files:**
- Create: `src/components/review/ShortcutLegend.tsx`
- Modify: `src/components/TransactionTable.tsx` — replace old `ShortcutsPopover`

- [ ] **Step 1: Implement ShortcutLegend**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useShortcuts, useShortcut } from '@/lib/review/KeyboardShortcutProvider'

const STORAGE_KEY = 'cb_shortcuts_hint_seen'

export default function ShortcutLegend() {
  const { list } = useShortcuts()
  const [pinned, setPinned] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      setShowHint(true)
      window.localStorage.setItem(STORAGE_KEY, '1')
      const t = setTimeout(() => setShowHint(false), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  useShortcut({ id: 'tt-legend', key: '?', shift: true, label: 'Show shortcut legend', group: 'Help',
    handler: () => setPinned(p => !p) })

  const groups = Array.from(new Set(list.map(s => s.group)))

  return (
    <>
      {showHint && !pinned && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 900,
          backgroundColor: '#1a1714', color: '#fff', padding: '8px 12px', borderRadius: 8,
          fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'cb-fade 3s ease-in-out forwards' }}>
          Press <kbd style={{ fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: 3 }}>?</kbd> for keyboard shortcuts
        </div>
      )}
      <style jsx>{`
        @keyframes cb-fade {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
      {pinned && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          width: 360, maxHeight: '70vh', overflowY: 'auto',
          backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 12,
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)', padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1714' }}>Keyboard shortcuts</h3>
            <button onClick={() => setPinned(false)} style={{ border: 'none', background: 'none', color: '#6b6560', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>×</button>
          </div>
          {groups.map(g => (
            <div key={g} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{g}</p>
              {list.filter(s => s.group === g).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#1a1714' }}>{s.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#1a1714', border: '1px solid #e0dbd4', borderRadius: 4, padding: '1px 5px' }}>
                    {[s.meta && '⌘', s.shift && '⇧', s.alt && '⌥'].filter(Boolean).join(' ')} {s.key === ' ' ? 'Space' : s.key.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Replace the old `ShortcutsPopover` in `TransactionTable.tsx`**

Delete the `ShortcutsPopover` component definition and its usage (around line 381). Render `<ShortcutLegend />` at the bottom of the table instead. Remove the `?` button from the control bar.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/review/ShortcutLegend.tsx src/components/TransactionTable.tsx
git commit -m "feat: add shortcut legend with ephemeral first-visit hint"
```

---

### Phase B checkpoint

- [ ] **Step 1: Run full build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 2: Manual browser verification**

Visit `/dashboard/categorize/[id]`. Verify: J/K move focus, A approves, R flags, E opens picker, `/` focuses search, ⌘K opens palette, `?` toggles legend, Shift+J extends selection.

---

## Phase C — Feature 2: Smart Rules Engine

### Task 9: Supabase migration — `category_rules` table

**Files:**
- Create: `supabase/migrations/2026-04-23-category-rules.sql`

- [ ] **Step 1: Mirror the `corrections` table pattern**

```sql
-- category_rules: learned CPA rules that auto-apply during categorization
create table if not exists public.category_rules (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists category_rules_firm_id_idx on public.category_rules (firm_id);

alter table public.category_rules enable row level security;

drop policy if exists category_rules_firm_access on public.category_rules;
create policy category_rules_firm_access on public.category_rules
  for all using (
    firm_id in (select firm_id from public.firm_members where user_id = auth.uid())
  ) with check (
    firm_id in (select firm_id from public.firm_members where user_id = auth.uid())
  );
```

- [ ] **Step 2: Verify schema — run migration locally if possible, otherwise skip and run on Vercel**

Run: `ls supabase/migrations/ | tail -3`
Expected: the new file appears.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/2026-04-23-category-rules.sql
git commit -m "feat: add category_rules table migration"
```

---

### Task 10: `vendor.ts` normalization

**Files:**
- Create: `src/lib/review/vendor.ts`

- [ ] **Step 1: Implement**

```ts
export function normalizeVendor(description: string): string {
  if (!description) return ''
  let s = description.toLowerCase().trim()
  // Strip common payment-processor prefixes
  s = s.replace(/^(sq \*|tst\*|paypal \*|pp\*|stripe \*|amzn mktp[^\s]*|sp\s+)/i, (m) => m.replace(/[*]/g, '').trim() + ' ')
  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ')
  // Strip trailing numeric sequences (dates, IDs)
  s = s.replace(/\s+[\d#\-]{4,}$/g, '')
  // Strip trailing city/state codes in caps
  s = s.replace(/\s+[A-Z]{2}\s*$/g, '')
  // Take the first ~30 chars of the cleaned string
  return s.slice(0, 40).trim()
}

export function vendorPatternMatches(description: string, pattern: string): boolean {
  const d = normalizeVendor(description)
  const p = pattern.toLowerCase().trim()
  if (!d || !p) return false
  return d.includes(p) || p.includes(d.slice(0, Math.max(6, p.length)))
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/review/vendor.ts
git commit -m "feat: add vendor normalization helpers"
```

---

### Task 11: `rules.ts` — rule storage + matching

**Files:**
- Create: `src/lib/review/rules.ts`

- [ ] **Step 1: Implement (mirrors `corrections.ts`)**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction } from '@/types'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'
import { normalizeVendor, vendorPatternMatches } from './vendor'

export interface CategoryRule {
  id: string
  vendorPattern: string        // normalized lowercase substring
  accountCode: string
  categoryName: string
  createdBy: string
  createdAt: string
  timesApplied: number
  lastAppliedAt?: string
  active: boolean
}

let _rules: CategoryRule[] = []

export async function hydrateRules(supabase: SupabaseClient, firmId: string): Promise<void> {
  const rows = await loadPayloadRows<CategoryRule>(supabase, 'category_rules', firmId)
  _rules = rows
}

async function persistRule(rule: CategoryRule) {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await upsertPayloadRow(ctx.supabase, 'category_rules', ctx.firmId, rule.id, rule as unknown as Record<string, unknown>)
}

async function deleteRuleRemote(id: string) {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('category_rules').delete().eq('id', id).eq('firm_id', ctx.firmId)
}

export function listRules(): CategoryRule[] {
  return _rules.slice().sort((a, b) => b.timesApplied - a.timesApplied)
}

export function findRuleForDescription(description: string): CategoryRule | null {
  for (const r of _rules) {
    if (!r.active) continue
    if (vendorPatternMatches(description, r.vendorPattern)) return r
  }
  return null
}

export async function saveRule(input: { description: string; accountCode: string; categoryName: string; createdBy: string }): Promise<CategoryRule> {
  const pattern = normalizeVendor(input.description)
  const existingIdx = _rules.findIndex(r => r.vendorPattern === pattern)
  const rule: CategoryRule = {
    id: existingIdx >= 0 ? _rules[existingIdx].id : `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vendorPattern: pattern,
    accountCode: input.accountCode,
    categoryName: input.categoryName,
    createdBy: input.createdBy,
    createdAt: existingIdx >= 0 ? _rules[existingIdx].createdAt : new Date().toISOString(),
    timesApplied: existingIdx >= 0 ? _rules[existingIdx].timesApplied : 0,
    active: true,
  }
  if (existingIdx >= 0) _rules[existingIdx] = rule
  else _rules.unshift(rule)
  await persistRule(rule)
  return rule
}

export async function deleteRule(id: string): Promise<void> {
  _rules = _rules.filter(r => r.id !== id)
  await deleteRuleRemote(id)
}

export async function setRuleActive(id: string, active: boolean): Promise<void> {
  const r = _rules.find(x => x.id === id)
  if (!r) return
  r.active = active
  await persistRule(r)
}

export interface ApplyResult { applied: number; touchedIds: string[] }

export function findMatchingPending(rule: CategoryRule, txs: Transaction[]): Transaction[] {
  return txs.filter(t => t.status === 'pending' && vendorPatternMatches(t.description, rule.vendorPattern))
}

export async function bumpRuleUsage(ruleId: string, count: number): Promise<void> {
  const r = _rules.find(x => x.id === ruleId)
  if (!r) return
  r.timesApplied += count
  r.lastAppliedAt = new Date().toISOString()
  await persistRule(r)
}

export function applyRulesToJob(txs: Transaction[]): { txs: Transaction[]; applied: Array<{ ruleId: string; txId: string }> } {
  const applied: Array<{ ruleId: string; txId: string }> = []
  const next = txs.map(t => {
    if (t.status !== 'pending') return t
    const rule = findRuleForDescription(t.description)
    if (!rule) return t
    applied.push({ ruleId: rule.id, txId: t.id })
    return {
      ...t,
      status: 'edited' as const,
      final_account_code: rule.accountCode,
      final_category: rule.categoryName,
      confidence: Math.max(t.confidence, 0.99),
      notes: t.notes ?? `Auto-applied rule: ${rule.vendorPattern}`,
    }
  })
  return { txs: next, applied }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/review/rules.ts
git commit -m "feat: add category rules helper"
```

---

### Task 12: `SaveRuleToast` component

**Files:**
- Create: `src/components/review/SaveRuleToast.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useEffect, useState } from 'react'

interface Props {
  vendor: string
  categoryName: string
  matchingCount: number
  onSave: () => void
  onDismiss: () => void
}

export default function SaveRuleToast({ vendor, categoryName, matchingCount, onSave, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setMounted(true)) }, [])

  return (
    <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: `translate(-50%, ${mounted ? '0' : '12px'})`, opacity: mounted ? 1 : 0, transition: 'all 0.2s',
      zIndex: 1001, backgroundColor: '#fff', border: '1px solid #2d5a27', borderRadius: 12,
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, maxWidth: 560 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#2d5a27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#1a1714' }}>
          Always categorize <strong>{vendor}</strong> as <strong>{categoryName}</strong>?
        </p>
        {matchingCount > 0 && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b6560' }}>
            Will also fix <strong style={{ color: '#2d5a27' }}>{matchingCount}</strong> other pending transaction{matchingCount !== 1 ? 's' : ''}.
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSave} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save rule</button>
        <button onClick={onDismiss} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#6b6560', fontSize: 13, cursor: 'pointer' }}>Dismiss</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/review/SaveRuleToast.tsx
git commit -m "feat: add SaveRuleToast component"
```

---

### Task 13: Wire rule-save prompt + hydration

**Files:**
- Modify: `src/components/TransactionTable.tsx` — manage a `ruleCandidate` state, render toast, apply rule
- Modify: `src/components/TransactionRow.tsx` — notify parent on category change (so parent can prompt)
- Modify: `src/app/dashboard/categorize/[id]/page.tsx` — call `hydrateRules` on mount and run `applyRulesToJob` before passing txs

- [ ] **Step 1: Hydrate rules at page load + auto-apply**

In the categorize page:

```tsx
import { hydrateRules, applyRulesToJob } from '@/lib/review/rules'
import { createBrowserSupabase } from '@/lib/supabaseBrowser'  // or existing supabase helper

// inside the effect that loads the job:
const supabase = createBrowserSupabase()
const firmId = /* existing firmId from context */
await hydrateRules(supabase, firmId)
const { txs: seeded, applied } = applyRulesToJob(job.transactions)
job.transactions = seeded
if (applied.length > 0) {
  // push a single undo entry (requires Phase F wiring; placeholder for now)
}
```

If the existing hydrate flow uses `getSupabaseAndFirm()`, call it there instead.

- [ ] **Step 2: Change `TransactionRow.handleCategoryChange` to bubble up**

Add a new optional prop `onCategoryRuleCandidate?: (tx: Transaction, accountCode: string, categoryName: string) => void` and call it from `handleCategoryChange` when the category changed.

- [ ] **Step 3: Wire parent**

In `TransactionTable.tsx`:

```tsx
import SaveRuleToast from '@/components/review/SaveRuleToast'
import { saveRule, findMatchingPending, bumpRuleUsage } from '@/lib/review/rules'
import { normalizeVendor } from '@/lib/review/vendor'

const [ruleCandidate, setRuleCandidate] = useState<{ vendor: string; accountCode: string; categoryName: string; matchingCount: number } | null>(null)

function handleCategoryRuleCandidate(tx: Transaction, accountCode: string, categoryName: string) {
  const pattern = normalizeVendor(tx.description)
  if (!pattern) return
  const matching = transactions.filter(t => t.id !== tx.id && t.status === 'pending' && normalizeVendor(t.description) === pattern)
  setRuleCandidate({ vendor: pattern, accountCode, categoryName, matchingCount: matching.length })
}

async function handleSaveRule() {
  if (!ruleCandidate) return
  const cand = ruleCandidate
  const rule = await saveRule({ description: cand.vendor, accountCode: cand.accountCode, categoryName: cand.categoryName, createdBy: 'me' })
  // apply to matching pending
  const touched: Transaction[] = []
  setTransactions(prev => {
    const next = prev.map(t => {
      if (t.status !== 'pending') return t
      if (normalizeVendor(t.description) !== rule.vendorPattern) return t
      touched.push(t)
      return { ...t, status: 'edited' as const, final_account_code: cand.accountCode, final_category: cand.categoryName, confidence: 0.99, notes: t.notes ?? `Auto-applied rule: ${cand.vendor}` }
    })
    onTransactionsChange?.(next)
    return next
  })
  if (touched.length > 0) await bumpRuleUsage(rule.id, touched.length)
  setRuleCandidate(null)
  // toast follows in Phase F
}

// render:
{ruleCandidate && (
  <SaveRuleToast
    vendor={ruleCandidate.vendor}
    categoryName={ruleCandidate.categoryName}
    matchingCount={ruleCandidate.matchingCount}
    onSave={handleSaveRule}
    onDismiss={() => setRuleCandidate(null)}
  />
)}

// pass handler to each row:
<TransactionRow ... onCategoryRuleCandidate={handleCategoryRuleCandidate} />
```

- [ ] **Step 4: Build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionTable.tsx src/components/TransactionRow.tsx src/app/dashboard/categorize/[id]/page.tsx
git commit -m "feat: prompt to save categorization rule and auto-apply to matches"
```

---

### Task 14: Proactive rule suggestions

**Files:**
- Modify: `src/components/TransactionTable.tsx`

- [ ] **Step 1: Track per-session approval clusters**

```tsx
import { findRuleForDescription } from '@/lib/review/rules'

const approvalTracker = useRef<Map<string, { count: number; tx: Transaction; category: string; accountCode: string; suggested: boolean }>>(new Map())

function trackApproval(tx: Transaction) {
  const pattern = normalizeVendor(tx.description)
  const category = tx.final_category ?? tx.suggested_category ?? ''
  const accountCode = tx.final_account_code ?? tx.suggested_account_code ?? ''
  if (!pattern || !category || !accountCode) return
  if (findRuleForDescription(tx.description)) return
  const key = `${pattern}::${accountCode}`
  const existing = approvalTracker.current.get(key)
  if (existing) {
    existing.count += 1
    if (existing.count >= 3 && !existing.suggested) {
      existing.suggested = true
      // count how many pending match this pattern
      const pending = transactions.filter(t => t.status === 'pending' && normalizeVendor(t.description) === pattern)
      setRuleCandidate({ vendor: pattern, accountCode, categoryName: category, matchingCount: pending.length })
    }
  } else {
    approvalTracker.current.set(key, { count: 1, tx, category, accountCode, suggested: false })
  }
}
```

Call `trackApproval(tx)` from every place a transaction becomes `approved` or `edited`: inside `handleChange`, `bulkApprove`, `doApproveHighConfidence`.

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/TransactionTable.tsx
git commit -m "feat: proactive rule suggestions after 3 similar approvals"
```

---

### Task 15: Settings page — `/dashboard/settings/rules`

**Files:**
- Create: `src/app/dashboard/settings/rules/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { hydrateRules, listRules, deleteRule, setRuleActive, type CategoryRule } from '@/lib/review/rules'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

export default function RulesSettingsPage() {
  const [rules, setRules] = useState<CategoryRule[]>([])
  const [loading, setLoading] = useState(true)

  async function reload() {
    const ctx = await getSupabaseAndFirm()
    if (!ctx) return
    await hydrateRules(ctx.supabase, ctx.firmId)
    setRules(listRules())
  }

  useEffect(() => { reload().finally(() => setLoading(false)) }, [])

  const totalApplied = rules.reduce((s, r) => s + r.timesApplied, 0)
  const hoursSaved = (totalApplied * 40 / 3600).toFixed(1)

  return (
    <main style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: '#1a1714', margin: '0 0 6px' }}>Category Rules</h1>
      <p style={{ color: '#6b6560', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        Rules learned from your corrections. When a matching transaction appears, CloseBooks categorizes it automatically.
      </p>
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, padding: '14px 18px', backgroundColor: '#faf8f4', borderRadius: 12, border: '1px solid #e0dbd4' }}>
        <Stat label="Rules active" value={rules.filter(r => r.active).length} />
        <Stat label="Applications" value={totalApplied} />
        <Stat label="Est. hours saved" value={hoursSaved} />
      </div>

      {loading ? <p>Loading…</p> : rules.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#a09a94', fontSize: 14, border: '1px dashed #e0dbd4', borderRadius: 12 }}>
          No rules yet. Change a transaction’s category during review and CloseBooks will offer to save a rule.
        </div>
      ) : (
        <div style={{ border: '1px solid #e0dbd4', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f0ea' }}>
                <th style={TH}>Vendor pattern</th>
                <th style={TH}>Category</th>
                <th style={{ ...TH, textAlign: 'right' }}>Applied</th>
                <th style={{ ...TH, textAlign: 'center' }}>Active</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #f0ece4' }}>
                  <td style={TD}><code style={{ fontFamily: 'monospace', fontSize: 12, color: '#1a1714' }}>{r.vendorPattern}</code></td>
                  <td style={TD}><span style={{ fontSize: 13, color: '#1a1714' }}>{r.categoryName}</span><div style={{ fontSize: 10, fontFamily: 'monospace', color: '#a09a94' }}>{r.accountCode}</div></td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{r.timesApplied}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <input type="checkbox" checked={r.active} onChange={async () => { await setRuleActive(r.id, !r.active); reload() }} style={{ accentColor: '#2d5a27' }} />
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <button onClick={async () => { if (confirm('Delete this rule?')) { await deleteRule(r.id); reload() } }}
                      style={{ border: '1px solid #e0dbd4', borderRadius: 6, backgroundColor: '#fff', color: '#991b1b', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

const TH: React.CSSProperties = { padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b6560', textAlign: 'left' }
const TD: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' }

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 22, fontFamily: 'DM Serif Display, serif', color: '#1a1714' }}>{value}</p>
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/settings/rules/page.tsx
git commit -m "feat: add rules settings page"
```

---

### Phase C checkpoint

- [ ] **Step 1: Run build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 2: Apply migration in Supabase dashboard or via `supabase db push`**

The migration SQL file runs in the next `supabase db push` or on next Vercel deploy that wires migrations.

- [ ] **Step 3: Manual browser verification**

Visit review page, change a category, verify save-rule toast appears with accurate match count. Visit `/dashboard/settings/rules` and verify the rule is listed.

---

## Phase D — Feature 3: Sliding Bulk Action Bar

### Task 16: `BulkActionBar` component

**Files:**
- Create: `src/components/review/BulkActionBar.tsx`

- [ ] **Step 1: Implement portal-rendered slide-up bar**

```tsx
'use client'
import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface BulkAction {
  id: string
  label: string
  tone?: 'default' | 'success' | 'danger'
  icon?: ReactNode
  disabled?: boolean
  onClick: () => void
}

interface Props {
  count: number
  totalAmount?: number
  actions: BulkAction[]
  onClear: () => void
}

export default function BulkActionBar({ count, totalAmount, actions, onClear }: Props) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setPortalEl(document.body) }, [])
  useEffect(() => {
    if (count > 0) { requestAnimationFrame(() => setVisible(true)) }
    else { setVisible(false) }
  }, [count])

  if (!portalEl || count === 0) return null

  return createPortal(
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: `translate(-50%, ${visible ? '0' : '100%'})`, transition: 'transform 0.2s cubic-bezier(.2,.8,.2,1)',
      zIndex: 800, backgroundColor: '#1a1714', color: '#fff', borderRadius: 14, padding: '10px 14px', boxShadow: '0 20px 48px rgba(0,0,0,0.28)',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 'calc(100vw - 48px)', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{count} selected</span>
        {typeof totalAmount === 'number' && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
      {actions.map(a => {
        const bg = a.tone === 'success' ? '#2d5a27' : a.tone === 'danger' ? '#991b1b' : 'rgba(255,255,255,0.08)'
        const hoverBg = a.tone === 'success' ? '#1e3d1a' : a.tone === 'danger' ? '#7f1d1d' : 'rgba(255,255,255,0.18)'
        return (
          <button key={a.id} onClick={a.onClick} disabled={a.disabled}
            onMouseEnter={e => { if (!a.disabled) e.currentTarget.style.backgroundColor = hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = bg }}
            style={{ backgroundColor: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 500, cursor: a.disabled ? 'not-allowed' : 'pointer', opacity: a.disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {a.icon}{a.label}
          </button>
        )
      })}
      <button onClick={onClear} aria-label="clear selection"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 1, cursor: 'pointer', paddingLeft: 6 }}>×</button>
    </div>,
    portalEl
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/review/BulkActionBar.tsx
git commit -m "feat: add sliding bulk action bar component"
```

---

### Task 17: Replace inline bulk bar + wire new actions

**Files:**
- Modify: `src/components/TransactionTable.tsx`

- [ ] **Step 1: Remove the inline `someSelected` block and render `<BulkActionBar>`**

Delete the inline `{someSelected && ...}` bar (around line 357–365). Add state and handlers:

```tsx
import BulkActionBar from '@/components/review/BulkActionBar'

const selectedTotal = useMemo(() => transactions.filter(t => selected.has(t.id)).reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0), [transactions, selected])
const selectedAbs = Math.abs(selectedTotal)

function bulkChangeCategory() {
  // opens InlineCategoryPicker anchored to the action bar
  const el = document.querySelector('[data-bulk-bar]')
  const r = el?.getBoundingClientRect()
  if (!r) return
  setPickerAnchor({ top: r.top - 260, left: r.left, txId: '__bulk__' })
}
function bulkDuplicate() {
  setTransactions(prev => {
    const next = prev.map(t => selected.has(t.id) ? { ...t, status: 'flagged' as const, notes: `${t.notes ?? ''}${t.notes ? ' · ' : ''}duplicate` } : t)
    onTransactionsChange?.(next); return next
  })
  setSelected(new Set())
}
function bulkAddNote() {
  const note = window.prompt('Note to add to all selected transactions:')
  if (!note) return
  setTransactions(prev => {
    const next = prev.map(t => selected.has(t.id) ? { ...t, notes: t.notes ? `${t.notes} · ${note}` : note } : t)
    onTransactionsChange?.(next); return next
  })
}
function bulkExport() {
  const rows = transactions.filter(t => selected.has(t.id))
  const csv = 'Date,Description,Category,Amount,Status\n' + rows.map(t =>
    [t.date, JSON.stringify(t.description), t.final_category ?? t.suggested_category ?? '', (t.type === 'credit' ? '+' : '-') + t.amount, t.status].join(',')
  ).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// near the bottom of the render, replace old inline bar:
<BulkActionBar
  count={selected.size}
  totalAmount={selectedAbs}
  onClear={() => setSelected(new Set())}
  actions={[
    { id: 'approve', label: 'Approve', tone: 'success', onClick: bulkApprove },
    { id: 'cat',     label: 'Change Category', onClick: bulkChangeCategory },
    { id: 'flag',    label: 'Flag', tone: 'danger', onClick: bulkFlag },
    { id: 'dup',     label: 'Duplicate', onClick: bulkDuplicate },
    { id: 'note',    label: 'Add note', onClick: bulkAddNote },
    { id: 'split',   label: 'Split…', disabled: selected.size !== 1, onClick: () => openSplitForSelected() },
    { id: 'export',  label: 'Export CSV', onClick: bulkExport },
  ]}
/>
```

`openSplitForSelected()` is a stub for now that logs; wired in Phase E.

- [ ] **Step 2: Extend `InlineCategoryPicker` onSelect for `__bulk__`**

When `pickerAnchor.txId === '__bulk__'`, apply the chosen category to all selected transactions, then clear selection.

```tsx
onSelect={(code, name) => {
  if (pickerAnchor.txId === '__bulk__') {
    setTransactions(prev => {
      const next = prev.map(t => selected.has(t.id) ? { ...t, status: 'edited' as const, final_account_code: code, final_category: name } : t)
      onTransactionsChange?.(next); return next
    })
    setSelected(new Set())
  } else {
    const tx = transactions.find(t => t.id === pickerAnchor.txId)
    if (tx) handleChange({ ...tx, status: 'edited', final_account_code: code, final_category: name })
  }
  setPickerAnchor(null)
}}
```

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/TransactionTable.tsx
git commit -m "feat: sliding bulk action bar with new bulk operations"
```

---

### Phase D checkpoint

- [ ] **Step 1: Build + lint**

Run: `npm run build && npm run lint`

- [ ] **Step 2: Manual verification**

Select 3 transactions: verify the bar slides up, shows count + total. Test Approve, Change Category, Flag, Duplicate, Add Note, Export. Verify Split is disabled until exactly 1 is selected.

---

## Phase E — Feature 4: Split Transactions

### Task 18: Extend `Transaction` type + reporting integration

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/autopilot/pnlCalculator.ts`
- Modify: `src/lib/autopilot/journalEntries.ts`

- [ ] **Step 1: Add `TransactionSplit`**

In `src/types/index.ts`:

```ts
export interface TransactionSplit {
  id: string
  amount: number
  account_code: string
  category: string
  notes?: string
}
```

Extend `Transaction`:

```ts
export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  original_description: string
  suggested_category: string
  suggested_account_code: string
  confidence: number
  status: 'pending' | 'approved' | 'edited' | 'flagged'
  final_category?: string
  final_account_code?: string
  notes?: string
  splits?: TransactionSplit[]
}
```

- [ ] **Step 2: Update `pnlCalculator.ts`**

Read the file first, then modify the part that iterates transactions. Replace:

```ts
// BEFORE (illustrative — adjust to actual code):
for (const t of transactions) {
  const code = t.final_account_code ?? t.suggested_account_code
  const amount = t.amount
  addToAccount(code, amount, t.type)
}

// AFTER:
for (const t of transactions) {
  if (t.splits && t.splits.length > 0) {
    for (const s of t.splits) addToAccount(s.account_code, s.amount, t.type)
  } else {
    const code = t.final_account_code ?? t.suggested_account_code
    addToAccount(code, t.amount, t.type)
  }
}
```

- [ ] **Step 3: Update `journalEntries.ts` similarly** — generate JE lines from splits when present.

- [ ] **Step 4: Build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/autopilot/pnlCalculator.ts src/lib/autopilot/journalEntries.ts
git commit -m "feat: add TransactionSplit type and wire into reporting"
```

---

### Task 19: `SplitModal` component

**Files:**
- Create: `src/components/review/SplitModal.tsx`

- [ ] **Step 1: Implement modal with balance enforcement**

```tsx
'use client'
import { useEffect, useState, useMemo } from 'react'
import type { Transaction, TransactionSplit, ChartOfAccounts } from '@/types'

interface Props {
  transaction: Transaction | null
  chartOfAccounts: ChartOfAccounts[]
  onSave: (splits: TransactionSplit[]) => void
  onClose: () => void
}

function mkSplit(amount: number): TransactionSplit {
  return { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, amount, account_code: '', category: '' }
}

export default function SplitModal({ transaction, chartOfAccounts, onSave, onClose }: Props) {
  const [splits, setSplits] = useState<TransactionSplit[]>([])

  useEffect(() => {
    if (!transaction) return
    if (transaction.splits && transaction.splits.length > 0) {
      setSplits(transaction.splits)
    } else {
      const half = +(transaction.amount / 2).toFixed(2)
      setSplits([ { ...mkSplit(half), account_code: transaction.final_account_code ?? transaction.suggested_account_code ?? '', category: transaction.final_category ?? transaction.suggested_category ?? '' }, mkSplit(transaction.amount - half) ])
    }
  }, [transaction])

  const total = useMemo(() => splits.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0), [splits])
  const delta = transaction ? +(transaction.amount - total).toFixed(2) : 0
  const balanced = transaction ? Math.abs(delta) < 0.005 : false
  const allCategorized = splits.every(s => s.account_code)

  if (!transaction) return null

  function update(i: number, patch: Partial<TransactionSplit>) {
    setSplits(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }
  function addRow() {
    setSplits(prev => [...prev, mkSplit(0)])
  }
  function removeRow(i: number) {
    if (splits.length <= 2) return
    setSplits(prev => prev.filter((_, idx) => idx !== i))
  }
  function splitEven() {
    const per = +(transaction!.amount / splits.length).toFixed(2)
    const next = splits.map((s, i) => ({ ...s, amount: i === splits.length - 1 ? transaction!.amount - per * (splits.length - 1) : per }))
    setSplits(next)
  }
  function split50() {
    if (splits.length !== 2) return
    const half = +(transaction!.amount / 2).toFixed(2)
    setSplits([ { ...splits[0], amount: half }, { ...splits[1], amount: transaction!.amount - half } ])
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e0dbd4', width: 640, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0dbd4' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontFamily: 'DM Serif Display, serif', color: '#1a1714' }}>Split transaction</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b6560' }}>
            {transaction.description} · <strong>${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <div style={{ padding: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 11, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 6px' }}>Amount</th>
                <th style={{ textAlign: 'left', fontSize: 11, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 6px' }}>Category</th>
                <th style={{ textAlign: 'left', fontSize: 11, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 6px' }}>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {splits.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ padding: '4px 0' }}>
                    <input type="number" step="0.01" value={s.amount} onChange={e => update(i, { amount: parseFloat(e.target.value) || 0 })}
                      style={{ width: 110, border: '1px solid #e0dbd4', borderRadius: 6, padding: '6px 8px', fontFamily: 'monospace', fontSize: 13 }} />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <select value={s.account_code} onChange={e => {
                        const a = chartOfAccounts.find(x => x.code === e.target.value)
                        update(i, { account_code: e.target.value, category: a?.name ?? e.target.value })
                      }}
                      style={{ width: 220, border: '1px solid #e0dbd4', borderRadius: 6, padding: '6px 8px', fontSize: 13 }}>
                      <option value="">— choose —</option>
                      {(['asset','liability','equity','revenue','expense'] as const).map(type => {
                        const g = chartOfAccounts.filter(a => a.type === type)
                        if (g.length === 0) return null
                        return <optgroup key={type} label={type[0].toUpperCase() + type.slice(1)}>
                          {g.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}
                        </optgroup>
                      })}
                    </select>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input type="text" value={s.notes ?? ''} onChange={e => update(i, { notes: e.target.value })}
                      style={{ width: '100%', border: '1px solid #e0dbd4', borderRadius: 6, padding: '6px 8px', fontSize: 13 }} placeholder="Optional" />
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>
                    <button onClick={() => removeRow(i)} disabled={splits.length <= 2}
                      style={{ border: 'none', background: 'none', color: splits.length <= 2 ? '#c4bdb8' : '#991b1b', fontSize: 18, cursor: splits.length <= 2 ? 'not-allowed' : 'pointer' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={addRow} style={{ border: '1px dashed #c4bdb8', backgroundColor: 'transparent', color: '#6b6560', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>+ Add row</button>
            <button onClick={splitEven} style={{ border: '1px solid #e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Split evenly</button>
            {splits.length === 2 && <button onClick={split50} style={{ border: '1px solid #e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>50 / 50</button>}
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e0dbd4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: balanced ? '#059669' : '#991b1b' }}>
            {balanced ? '$0.00 remaining ✓' : `${delta > 0 ? 'Short' : 'Over'} by $${Math.abs(delta).toFixed(2)}`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#6b6560', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button disabled={!balanced || !allCategorized} onClick={() => onSave(splits)}
              style={{ border: 'none', backgroundColor: balanced && allCategorized ? '#2d5a27' : '#a09a94', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: balanced && allCategorized ? 'pointer' : 'not-allowed' }}>
              Save split
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/review/SplitModal.tsx
git commit -m "feat: add SplitModal with balance enforcement"
```

---

### Task 20: Wire split modal from row, bulk bar, and `S` shortcut

**Files:**
- Modify: `src/components/TransactionTable.tsx`
- Modify: `src/components/TransactionRow.tsx` — add a small "Split" button in expanded detail

- [ ] **Step 1: Add state + handlers in `TransactionTable`**

```tsx
import SplitModal from '@/components/review/SplitModal'

const [splitTxId, setSplitTxId] = useState<string | null>(null)
const splitTx = useMemo(() => transactions.find(t => t.id === splitTxId) ?? null, [transactions, splitTxId])

function openSplit(id: string) { setSplitTxId(id) }
function openSplitForSelected() {
  if (selected.size !== 1) return
  const [only] = Array.from(selected)
  setSplitTxId(only)
}

function handleSplitSave(splits: TransactionSplit[]) {
  if (!splitTxId) return
  setTransactions(prev => {
    const next = prev.map(t => t.id === splitTxId ? { ...t, status: 'edited' as const, splits } : t)
    onTransactionsChange?.(next)
    return next
  })
  onAudit?.({ action: 'tx_split' as any, txId: splitTxId, txDescription: splitTx?.description ?? '', details: { parts: String(splits.length) } })
  setSplitTxId(null)
}

// Register S shortcut:
useShortcut({ id: 'tt-split', key: 's', label: 'Split focused transaction', group: 'Actions',
  handler: () => { const vis = visibleRef.current, fi = focusedIdxRef.current; if (fi >= 0) openSplit(vis[fi].id) }})

// render near other modals:
<SplitModal
  transaction={splitTx}
  chartOfAccounts={chartOfAccounts}
  onSave={handleSplitSave}
  onClose={() => setSplitTxId(null)}
/>
```

- [ ] **Step 2: Pass `onSplit` to `TransactionRow`; render small "Split" button in expanded detail action bar**

Add `onSplit?: (id: string) => void` to `TransactionRow` Props. Render a button next to Approve/Flag in the expanded area:

```tsx
<button onClick={() => onSplit?.(transaction.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#1a1714', fontSize: 13, cursor: 'pointer' }}>Split</button>
```

- [ ] **Step 3: Show a visual indicator on split rows**

In `TransactionRow`, under the description, if `transaction.splits && transaction.splits.length > 0`, render a small badge `"Split into {n}"`.

- [ ] **Step 4: Build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionTable.tsx src/components/TransactionRow.tsx
git commit -m "feat: wire split modal from row, bulk bar, and S shortcut"
```

---

### Phase E checkpoint

- [ ] **Step 1: Build + lint**

Run: `npm run build && npm run lint`

- [ ] **Step 2: Manual verification**

- Select 1 tx → Split enabled on bulk bar.
- `S` on focused row opens modal with 50/50 default.
- Out-of-balance message is red; Save disabled.
- Saved split shows badge on row.

---

## Phase F — Feature 5: Undo System

### Task 21: Plumb undo stack into `TransactionTable`

**Files:**
- Modify: `src/components/TransactionTable.tsx`

- [ ] **Step 1: Import and instantiate**

```tsx
import { useUndoStack } from '@/lib/review/undoStack'
import ActionToastStack, { type ToastMsg } from '@/components/review/ActionToast'

const undoStack = useUndoStack()
const [toasts, setToasts] = useState<ToastMsg[]>([])

function pushToast(t: Omit<ToastMsg, 'id'>) {
  setToasts(prev => [...prev, { ...t, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }])
}
function dismissToast(id: string) {
  setToasts(prev => prev.filter(t => t.id !== id))
}
```

- [ ] **Step 2: Wrap every mutation with `undoStack.push` + toast**

For `handleChange` (single-row edits): snapshot the prior transaction, push inverse.

```tsx
const handleChange = useCallback((updated: Transaction) => {
  setTransactions(prev => {
    const prior = prev.find(t => t.id === updated.id)
    const next = prev.map(t => t.id === updated.id ? updated : t)
    onTransactionsChange?.(next)
    if (prior) {
      undoStack.push({
        label: `Changed ${prior.description.slice(0, 30)}`,
        inverse: () => {
          setTransactions(p => {
            const n = p.map(t => t.id === prior.id ? prior : t)
            onTransactionsChange?.(n); return n
          })
        },
        redo: () => {
          setTransactions(p => {
            const n = p.map(t => t.id === updated.id ? updated : t)
            onTransactionsChange?.(n); return n
          })
        },
      })
    }
    trackApproval(updated)
    return next
  })
}, [onTransactionsChange, undoStack])
```

For `bulkApprove`: snapshot the prior subset.

```tsx
const bulkApprove = useCallback(() => {
  const selectedIds = Array.from(selected)
  const priors = transactions.filter(t => selectedIds.includes(t.id))
  setTransactions(prev => {
    const next = prev.map(t => {
      if (!selectedIds.includes(t.id)) return t
      onAudit?.({ action: 'tx_approved', txId: t.id, txDescription: t.description, details: { category: t.final_category ?? t.suggested_category ?? '', bulk: 'true' } })
      return { ...t, status: 'approved' as const, final_category: t.final_category ?? t.suggested_category, final_account_code: t.final_account_code ?? t.suggested_account_code }
    })
    onTransactionsChange?.(next); return next
  })
  undoStack.push({
    label: `Approved ${priors.length} transactions`,
    inverse: () => { setTransactions(p => { const n = p.map(t => priors.find(pt => pt.id === t.id) ?? t); onTransactionsChange?.(n); return n }) },
  })
  pushToast({ message: `Approved ${priors.length} transaction${priors.length !== 1 ? 's' : ''}`, onUndo: () => undoStack.undo(), tone: 'success' })
  priors.forEach(p => trackApproval(p))
  setSelected(new Set())
}, [selected, transactions, onTransactionsChange, onAudit, undoStack])
```

Repeat the pattern for: `bulkFlag`, `doApproveHighConfidence`, `handleSaveRule` (inverse deletes the rule AND restores priors), `handleSplitSave` (inverse restores parent with no splits), `markDuplicate`, `bulkDuplicate`, `bulkAddNote`, `applyRulesToJob` auto-apply from hydrate (single undo entry on first page load if `applied.length > 0`).

- [ ] **Step 3: Register ⌘Z and ⌘⇧Z**

```tsx
useShortcut({ id: 'tt-undo', key: 'z', meta: true, label: 'Undo last action', group: 'Undo',
  handler: () => { const e = undoStack.undo(); if (e) pushToast({ message: `Undid: ${e.label}` }) }})
useShortcut({ id: 'tt-redo', key: 'z', meta: true, shift: true, label: 'Redo', group: 'Undo',
  handler: () => { const e = undoStack.redo(); if (e) pushToast({ message: `Redid: ${e.label}` }) }})
```

- [ ] **Step 4: Mount toast stack**

```tsx
<ActionToastStack toasts={toasts} onDismiss={dismissToast} />
```

- [ ] **Step 5: Build**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/TransactionTable.tsx
git commit -m "feat: undo/redo for all review actions with toast notifications"
```

---

### Task 22: History drawer

**Files:**
- Create: `src/components/review/HistoryDrawer.tsx`
- Modify: `src/components/TransactionTable.tsx` — register ⌘⇧H, mount drawer

- [ ] **Step 1: Drawer**

```tsx
'use client'
import type { UndoEntry } from '@/lib/review/undoStack'

interface Props {
  open: boolean
  entries: UndoEntry[]
  onClose: () => void
  onUndoUpTo: (entryId: string) => void
}

export default function HistoryDrawer({ open, entries, onClose, onUndoUpTo }: Props) {
  if (!open) return null
  const list = entries.slice().reverse().slice(0, 20)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)' }} onClick={onClose}>
      <aside onClick={e => e.stopPropagation()}
        style={{ width: 360, backgroundColor: '#fff', height: '100%', padding: 18, overflowY: 'auto', borderLeft: '1px solid #e0dbd4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'DM Serif Display, serif', color: '#1a1714' }}>History</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#6b6560', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {list.length === 0 && <p style={{ fontSize: 13, color: '#a09a94' }}>No actions yet.</p>}
        {list.map(e => (
          <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#1a1714' }}>{e.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#a09a94' }}>{new Date(e.createdAt).toLocaleTimeString()}</p>
            </div>
            <button onClick={() => onUndoUpTo(e.id)} style={{ border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#6b6560', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Revert to here</button>
          </div>
        ))}
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Wire in `TransactionTable`**

```tsx
import HistoryDrawer from '@/components/review/HistoryDrawer'

const [drawerOpen, setDrawerOpen] = useState(false)
useShortcut({ id: 'tt-history', key: 'h', meta: true, shift: true, label: 'Open history drawer', group: 'Help',
  handler: () => setDrawerOpen(true) })

function undoUpTo(entryId: string) {
  while (undoStack.entries.length > 0) {
    const top = undoStack.entries[undoStack.entries.length - 1]
    undoStack.undo()
    if (top.id === entryId) break
  }
  setDrawerOpen(false)
}

// render:
<HistoryDrawer open={drawerOpen} entries={undoStack.entries} onClose={() => setDrawerOpen(false)} onUndoUpTo={undoUpTo} />
```

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/review/HistoryDrawer.tsx src/components/TransactionTable.tsx
git commit -m "feat: add history drawer with revert-to-here"
```

---

### Phase F checkpoint

- [ ] **Step 1: Build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed.

- [ ] **Step 2: Manual verification**

Approve a tx → toast appears → ⌘Z reverses it. Bulk approve 5 → ⌘Z restores all 5. Split a tx → ⌘Z removes splits. Open drawer with ⌘⇧H; revert to an older entry.

---

## Phase G — Ship

### Task 23: Final verification

- [ ] **Step 1: Full build + lint**

Run: `npm run build && npm run lint`
Expected: Both succeed with zero errors.

- [ ] **Step 2: Run dev server for a smoke test**

Run: `npm run dev`
Then visit `http://localhost:3000/dashboard/categorize/[id]` and run through:
- Keyboard: j/k/a/r/e/s/x/space/⌘Enter/⌘D/⌘K/⌘Z/⌘⇧H/?
- Save a rule, verify settings page.
- Bulk bar appears with multi-select.
- Split modal balances math correctly.
- ⌘Z reverses everything.

### Task 24: Push to GitHub + Vercel

- [ ] **Step 1: Final commit if anything is outstanding**

```bash
git status
# if clean, skip
```

- [ ] **Step 2: Push to origin/main**

```bash
git push origin main
```

Expected: Vercel auto-deploys the push to production (this project is wired that way per recent commits).

- [ ] **Step 3: Verify Vercel deployment URL**

Watch `vercel` CLI or dashboard for deploy completion. Confirm production URL loads the review page.
