'use client'

import { useState } from 'react'
import type { ActionCard as ActionCardType, JournalEntryPayload, RecategorizePayload, FlagPayload, ClientEmailPayload, DocumentRequestPayload } from '@/lib/copilot/types'

const TYPE_ICON: Record<string, string> = {
  journal_entry:    '📝',
  recategorize:     '🔀',
  flag:             '🚩',
  client_email:     '✉️',
  document_request: '📋',
}

interface Props {
  card: ActionCardType
  onApprove: (payload: ActionCardType['payload'], type: ActionCardType['type']) => Promise<void>
  onDismiss: () => void
}

export default function ActionCard({ card, onApprove, onDismiss }: Props) {
  const [posting, setPosting] = useState(false)

  if (card.status === 'dismissed') {
    return (
      <div style={{ padding: '10px 14px', background: '#f9f9f8', borderRadius: 10, border: '1px solid #f0ece4', fontSize: 12, color: '#9ca3af' }}>
        Dismissed
      </div>
    )
  }

  if (card.status === 'approved') {
    return (
      <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
        ✓ {card.title} — Posted
      </div>
    )
  }

  const handleApprove = async () => {
    setPosting(true)
    await onApprove(card.payload, card.type)
    setPosting(false)
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{TYPE_ICON[card.type]}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{card.title}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{card.summary}</div>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <CardBody card={card} />
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ece4', display: 'flex', gap: 8 }}>
        <button
          onClick={handleApprove}
          disabled={posting}
          style={{ background: '#2d5a27', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: posting ? 'default' : 'pointer', opacity: posting ? 0.7 : 1 }}
        >
          {posting ? 'Posting…' : '✅ Approve & Post'}
        </button>
        <button
          onClick={onDismiss}
          style={{ background: 'none', color: '#9ca3af', border: '1px solid #e8e0d4', borderRadius: 7, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  )
}

function CardBody({ card }: { card: ActionCardType }) {
  switch (card.type) {
    case 'journal_entry': {
      const p = card.payload as JournalEntryPayload
      return (
        <div>
          <div style={{ fontSize: 12, color: '#6b6560', marginBottom: 8 }}>Date: {p.date} · Memo: {p.memo}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0ece4' }}>
                {['Account', 'Code', 'Debit', 'Credit'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Debit' || h === 'Credit' ? 'right' : 'left', padding: '4px 0', color: '#9ca3af', fontWeight: 600, paddingRight: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.lines.map((line, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9f8f6' }}>
                  <td style={{ padding: '5px 0', color: '#1a1714', paddingRight: 12 }}>{line.account}</td>
                  <td style={{ padding: '5px 0', color: '#6b6560', paddingRight: 12 }}>{line.code}</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', color: '#1a1714', paddingRight: 12 }}>{line.debit != null ? `$${line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', color: '#1a1714' }}>{line.credit != null ? `$${line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'recategorize': {
      const p = card.payload as RecategorizePayload
      return (
        <div style={{ fontSize: 12, color: '#1a1714' }}>
          <div style={{ marginBottom: 4 }}>→ <strong>{p.newCategory}</strong> ({p.newAccountCode})</div>
          <div style={{ color: '#6b6560' }}>{p.transactionIds.length} transaction{p.transactionIds.length !== 1 ? 's' : ''} · {p.reason}</div>
        </div>
      )
    }
    case 'flag': {
      const p = card.payload as FlagPayload
      return (
        <div style={{ fontSize: 12, color: '#1a1714' }}>
          <div>{p.transactionIds.length} transaction{p.transactionIds.length !== 1 ? 's' : ''} will be flagged for review.</div>
          <div style={{ color: '#6b6560', marginTop: 4 }}>Reason: {p.reason}</div>
        </div>
      )
    }
    case 'client_email': {
      const p = card.payload as ClientEmailPayload
      return (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>{p.subject}</div>
          <div style={{ color: '#6b6560', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{p.body}</div>
        </div>
      )
    }
    case 'document_request': {
      const p = card.payload as DocumentRequestPayload
      return (
        <div style={{ fontSize: 12 }}>
          <ul style={{ margin: 0, paddingLeft: 16, color: '#1a1714', lineHeight: 1.8 }}>
            {p.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
          {p.dueDate && <div style={{ color: '#6b6560', marginTop: 6 }}>Due: {p.dueDate}</div>}
        </div>
      )
    }
  }
}
