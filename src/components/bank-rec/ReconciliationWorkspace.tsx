'use client'
import { useState } from 'react'
import BalanceBar from './BalanceBar'
import StatementPanel from './StatementPanel'
import BookPanel from './BookPanel'
import MatchedPairs from './MatchedPairs'
import type { BankStatementLine, BookTransaction, Reconciliation, ReconciliationItem, MatchedPair } from '@/lib/bank-rec/types'

interface Props {
  reconciliation: Reconciliation
  statementLines: BankStatementLine[]
  bookTransactions: BookTransaction[]
  onComplete: () => void
}

const ACCENT = '#b8734a'

function btnStyle(bg: string, enabled: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600,
    background: enabled ? bg : '#e0dbd4', color: enabled ? '#fff' : '#9b9590',
    cursor: enabled ? 'pointer' : 'not-allowed', transition: 'all 0.15s', whiteSpace: 'nowrap',
  }
}

export default function ReconciliationWorkspace({
  reconciliation,
  statementLines: initLines,
  bookTransactions,
  onComplete,
}: Props) {
  const [lines, setLines] = useState<BankStatementLine[]>(initLines)
  const [matches, setMatches] = useState<MatchedPair[]>([])
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([])
  const [items, setItems] = useState<ReconciliationItem[]>(reconciliation.items ?? [])
  const [autoRunning, setAutoRunning] = useState(false)
  const [aiRunning, setAiRunning] = useState(false)
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [newItem, setNewItem] = useState<{ type: ReconciliationItem['type']; description: string; amount: string } | null>(null)
  const [toast, setToast] = useState('')

  const statementId = reconciliation.statement_id ?? ''
  const matchedBankIds = new Set(matches.map(m => m.bankLineId))
  const matchedBookIds = new Set(matches.flatMap(m => m.bookTransactionIds))
  const unmatchedBankLines = lines.filter(l => !matchedBankIds.has(l.id) && l.status !== 'excluded')
  const unmatchedBookTxns = bookTransactions.filter(t => !matchedBookIds.has(t.id))

  // Adjusted balances
  const openItems = items.filter(i => i.status === 'open')
  const deposits = openItems.filter(i => i.type === 'deposit_in_transit').reduce((s, i) => s + i.amount, 0)
  const outstandingChecks = openItems.filter(i => i.type === 'outstanding_check').reduce((s, i) => s + i.amount, 0)
  const bankAdj = openItems.filter(i => i.type === 'bank_adjustment').reduce((s, i) => s + i.amount, 0)
  const bookAdj = openItems.filter(i => i.type === 'book_adjustment').reduce((s, i) => s + i.amount, 0)
  const adjBankBal = reconciliation.bank_balance + deposits - outstandingChecks + bankAdj
  const adjBookBal = reconciliation.book_balance + bookAdj

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function runAutoMatch() {
    if (!statementId) return
    setAutoRunning(true)
    try {
      const res = await fetch('/api/bank-rec/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId, bookTransactions, action: 'auto' }),
      })
      const data = await res.json()
      if (data.matches?.length) {
        setMatches(prev => {
          const existingBankIds = new Set(prev.map(m => m.bankLineId))
          const newMatches = (data.matches as MatchedPair[]).filter(m => !existingBankIds.has(m.bankLineId))
          return [...prev, ...newMatches]
        })
        setLines(prev => prev.map(l => {
          const m = (data.matches as MatchedPair[]).find(m => m.bankLineId === l.id)
          return m ? { ...l, status: 'matched' as const, match_confidence: m.confidence } : l
        }))
        showToast(`Auto-matched ${data.matches.length} transaction${data.matches.length === 1 ? '' : 's'}`)
      } else {
        showToast('No additional matches found')
      }
    } catch {
      showToast('Auto-match failed — try again')
    }
    setAutoRunning(false)
  }

  async function runAiMatch() {
    setAiRunning(true)
    try {
      const unmatchedLines = lines.filter(l => l.status === 'unmatched' && !matchedBankIds.has(l.id))
      const unmatchedBook = bookTransactions.filter(t => !matchedBookIds.has(t.id))
      if (!unmatchedLines.length) { showToast('No unmatched bank lines remaining'); setAiRunning(false); return }

      const res = await fetch('/api/bank-rec/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unmatchedBankLines: unmatchedLines, bookTransactions: unmatchedBook }),
      })
      const data = await res.json()
      if (data.matches?.length) {
        // Persist each AI match
        await Promise.all((data.matches as MatchedPair[]).map(m =>
          fetch('/api/bank-rec/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statementId, bookTransactions, action: 'manual', bankLineId: m.bankLineId, bookTransactionIds: m.bookTransactionIds, confidence: m.confidence }),
          })
        ))
        setMatches(prev => {
          const existingBankIds = new Set(prev.map(m => m.bankLineId))
          const newMatches = (data.matches as MatchedPair[]).filter(m => !existingBankIds.has(m.bankLineId))
          return [...prev, ...newMatches]
        })
        setLines(prev => prev.map(l => {
          const m = (data.matches as MatchedPair[]).find(m => m.bankLineId === l.id)
          return m ? { ...l, status: 'matched' as const, match_confidence: m.confidence } : l
        }))
        showToast(`AI matched ${data.matches.length} transaction${data.matches.length === 1 ? '' : 's'}`)
      } else {
        showToast('AI found no additional matches')
      }
    } catch {
      showToast('AI match failed — try again')
    }
    setAiRunning(false)
  }

  async function handleManualMatch() {
    if (!selectedBankId || selectedBookIds.length === 0) return
    await fetch('/api/bank-rec/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementId, bookTransactions, action: 'manual',
        bankLineId: selectedBankId, bookTransactionIds: selectedBookIds, confidence: 100,
      }),
    })
    setMatches(prev => [...prev, { bankLineId: selectedBankId, bookTransactionIds: selectedBookIds, confidence: 100, matchType: 'manual' }])
    setLines(prev => prev.map(l => l.id === selectedBankId ? { ...l, status: 'matched' as const, match_confidence: 100 } : l))
    setSelectedBankId(null)
    setSelectedBookIds([])
    showToast('Manually matched')
  }

  async function handleUnmatch(bankLineId: string) {
    setUnmatchingId(bankLineId)
    await fetch('/api/bank-rec/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statementId, bookTransactions, action: 'unmatch', bankLineId }),
    })
    setMatches(prev => prev.filter(m => m.bankLineId !== bankLineId))
    setLines(prev => prev.map(l => l.id === bankLineId ? { ...l, status: 'unmatched' as const, match_confidence: undefined } : l))
    setUnmatchingId(null)
  }

  async function handleComplete() {
    setCompleting(true)
    await fetch('/api/bank-rec/reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', reconciliationId: reconciliation.id }),
    })
    setCompleting(false)
    onComplete()
  }

  async function addItem() {
    if (!newItem?.description || !newItem.amount) return
    const res = await fetch('/api/bank-rec/reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_item',
        reconciliationId: reconciliation.id,
        type: newItem.type,
        description: newItem.description,
        amount: parseFloat(newItem.amount),
      }),
    })
    const data = await res.json()
    if (data.item) { setItems(prev => [...prev, data.item as ReconciliationItem]); setNewItem(null) }
  }

  async function removeItem(id: string) {
    await fetch('/api/bank-rec/reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_item', itemId: id }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const isCompleted = reconciliation.status === 'completed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', background: '#faf8f4', overflow: 'hidden' }}>
      <BalanceBar
        bankBalance={adjBankBal}
        bookBalance={adjBookBal}
        unmatchedBankCount={unmatchedBankLines.length}
        unmatchedBookCount={unmatchedBookTxns.length}
        onComplete={handleComplete}
        completing={completing}
        isCompleted={isCompleted}
      />

      {/* Action bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 20px',
        borderBottom: '1px solid #e0dbd4', background: '#fff',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <button onClick={runAutoMatch} disabled={autoRunning || isCompleted} style={btnStyle(ACCENT, !autoRunning && !isCompleted)}>
          {autoRunning ? '⏳ Matching…' : '⚡ Auto-Match'}
        </button>
        <button onClick={runAiMatch} disabled={aiRunning || isCompleted} style={btnStyle('#6366f1', !aiRunning && !isCompleted)}>
          {aiRunning ? '🤖 Thinking…' : '🤖 AI Match'}
        </button>

        {selectedBankId && selectedBookIds.length > 0 && (
          <button onClick={handleManualMatch} style={btnStyle('#059669', true)}>
            ✓ Match ({selectedBookIds.length} book entr{selectedBookIds.length === 1 ? 'y' : 'ies'})
          </button>
        )}
        {(selectedBankId || selectedBookIds.length > 0) && (
          <button
            onClick={() => { setSelectedBankId(null); setSelectedBookIds([]) }}
            style={{ ...btnStyle('#6b6560', true), background: 'transparent', color: '#6b6560', border: '1px solid #e0dbd4' }}
          >
            Clear
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setNewItem({ type: 'outstanding_check', description: '', amount: '' })}
          disabled={isCompleted}
          style={{ ...btnStyle('#6b6560', !isCompleted), background: 'transparent', color: isCompleted ? '#9b9590' : '#6b6560', border: `1px solid ${isCompleted ? '#e0dbd4' : '#c5bfb9'}` }}
        >
          + Add Item
        </button>
      </div>

      {/* Three-panel workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ borderRight: '1px solid #e0dbd4', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <StatementPanel lines={lines} selectedId={selectedBankId} onSelect={setSelectedBankId} />
        </div>
        <div style={{ borderRight: '1px solid #e0dbd4', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MatchedPairs
            matches={matches}
            bankLines={lines}
            bookTransactions={bookTransactions}
            onUnmatch={handleUnmatch}
            unmatchingId={unmatchingId}
          />
        </div>
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <BookPanel
            transactions={bookTransactions}
            matchedIds={matchedBookIds}
            selectedIds={selectedBookIds}
            onToggle={id => setSelectedBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          />
        </div>
      </div>

      {/* Reconciling items strip */}
      {items.length > 0 && (
        <div style={{ padding: '10px 20px', background: '#fff', borderTop: '1px solid #e0dbd4', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Reconciling Items
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f5f3ef', borderRadius: 8, fontSize: 11 }}>
                <span style={{ color: '#6b6560', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
                  {item.type.replace(/_/g, ' ')}
                </span>
                <span style={{ color: '#1a1714', fontWeight: 500 }}>{item.description}</span>
                <span style={{ fontWeight: 700, color: item.type === 'outstanding_check' ? '#dc2626' : '#059669' }}>
                  ${item.amount.toFixed(2)}
                </span>
                {!isCompleted && (
                  <button onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'none', color: '#9b9590', cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1 }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add item modal */}
      {newItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1714' }}>Add Reconciling Item</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', display: 'block', marginBottom: 4 }}>Type</label>
              <select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value as ReconciliationItem['type'] })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, color: '#1a1714', background: '#faf8f4' }}
              >
                <option value="outstanding_check">Outstanding Check</option>
                <option value="deposit_in_transit">Deposit in Transit</option>
                <option value="bank_adjustment">Bank Adjustment</option>
                <option value="book_adjustment">Book Adjustment</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', display: 'block', marginBottom: 4 }}>Description</label>
              <input
                value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="e.g. Check #1234 to ABC Vendor"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', display: 'block', marginBottom: 4 }}>Amount ($)</label>
              <input
                value={newItem.amount}
                onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setNewItem(null)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid #e0dbd4', background: 'transparent', fontSize: 13, cursor: 'pointer', color: '#6b6560' }}>
                Cancel
              </button>
              <button onClick={addItem} disabled={!newItem.description || !newItem.amount} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1714', color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 500, zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
