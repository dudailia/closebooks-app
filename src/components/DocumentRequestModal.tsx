'use client'

import { useState } from 'react'
import { saveDocumentRequest } from '@/lib/vaultStorage'
import type { DocumentRequest } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function randomToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function defaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

const COMMON_ITEMS = [
  'Bank statement — current month',
  'Credit card statement — current month',
  'Payroll summary',
  'Receipt backup for flagged transactions',
  'Prior month bank statement',
  'Tax documents',
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  clientName: string
  jobId?: string
  onSave: (req: DocumentRequest) => void
  onClose: () => void
}

export default function DocumentRequestModal({ clientName, jobId, onSave, onClose }: Props) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(['Bank statement — current month', 'Receipt backup for flagged transactions'])
  )
  const [customInput, setCustomInput] = useState('')
  const [customItems, setCustomItems] = useState<string[]>([])
  const [dueDate, setDueDate]         = useState(defaultDueDate())
  const [notes, setNotes]             = useState('')
  const [copied, setCopied]           = useState(false)
  const [token]                       = useState(randomToken)

  const portalUrl = `https://closebooks-app.vercel.app/portal/demo?req=${token}`

  function toggleItem(item: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  function addCustomItem() {
    const trimmed = customInput.trim()
    if (!trimmed) return
    setCustomItems((prev) => [...prev, trimmed])
    setCheckedItems((prev) => new Set(Array.from(prev).concat(trimmed)))
    setCustomInput('')
  }

  function removeCustom(item: string) {
    setCustomItems((prev) => prev.filter((i) => i !== item))
    setCheckedItems((prev) => {
      const next = new Set(prev)
      next.delete(item)
      return next
    })
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      //
    }
  }

  function handleSave() {
    const allItems = [
      ...COMMON_ITEMS.filter((i) => checkedItems.has(i)),
      ...customItems.filter((i) => checkedItems.has(i)),
    ]
    if (allItems.length === 0) return

    const req: DocumentRequest = {
      id:             uid(),
      clientName,
      jobId,
      requestedAt:    new Date().toISOString(),
      requestedItems: allItems,
      status:         'pending',
      dueDate:        dueDate || undefined,
      portalToken:    token,
      fulfillmentIds: [],
      notes:          notes.trim() || undefined,
    }

    saveDocumentRequest(req)
    onSave(req)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(26,23,20,0.45)',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e8e0d4',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 20,
              color: '#1a1714',
              margin: 0,
            }}
          >
            Request Documents from {clientName}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09a94', fontSize: 20, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Common items checklist */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Document Checklist
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {COMMON_ITEMS.map((item) => (
              <label
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${checkedItems.has(item) ? '#2d5a27' : '#e8e0d4'}`,
                  backgroundColor: checkedItems.has(item) ? '#f0f7ef' : '#faf8f4',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={checkedItems.has(item)}
                  onChange={() => toggleItem(item)}
                  style={{ accentColor: '#2d5a27', width: 14, height: 14 }}
                />
                <span style={{ fontSize: 13, color: '#1a1714' }}>{item}</span>
              </label>
            ))}

            {/* Custom items */}
            {customItems.map((item) => (
              <label
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${checkedItems.has(item) ? '#2d5a27' : '#e8e0d4'}`,
                  backgroundColor: checkedItems.has(item) ? '#f0f7ef' : '#faf8f4',
                }}
              >
                <input
                  type="checkbox"
                  checked={checkedItems.has(item)}
                  onChange={() => toggleItem(item)}
                  style={{ accentColor: '#2d5a27', width: 14, height: 14 }}
                />
                <span style={{ fontSize: 13, color: '#1a1714', flex: 1 }}>{item}</span>
                <button
                  onClick={() => removeCustom(item)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09a94', fontSize: 14 }}
                >
                  ✕
                </button>
              </label>
            ))}
          </div>

          {/* Add custom item */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCustomItem() }}
              placeholder="Add a custom item…"
              style={{
                flex: 1,
                border: '1px solid #e8e0d4',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#1a1714',
                backgroundColor: '#faf8f4',
                outline: 'none',
              }}
            />
            <button
              onClick={addCustomItem}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #e8e0d4',
                backgroundColor: '#ffffff',
                fontSize: 13,
                color: '#b8734a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              color: '#1a1714',
              backgroundColor: '#faf8f4',
              outline: 'none',
            }}
          />
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Note for Client (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any instructions or context for your client…"
            rows={3}
            style={{
              width: '100%',
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              color: '#1a1714',
              backgroundColor: '#faf8f4',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Portal link preview */}
        <div
          style={{
            backgroundColor: '#faf8f4',
            border: '1px solid #e8e0d4',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <p style={{ fontSize: 11, color: '#6b6560', marginBottom: 6, fontWeight: 500 }}>
            Your client will receive this link:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code
              style={{
                flex: 1,
                fontSize: 11,
                color: '#1a1714',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {portalUrl}
            </code>
            <button
              onClick={copyLink}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid #e8e0d4',
                backgroundColor: copied ? '#2d5a27' : '#ffffff',
                color: copied ? '#ffffff' : '#b8734a',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 9,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
              fontSize: 14,
              color: '#6b6560',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={checkedItems.size === 0}
            style={{
              flex: 2,
              padding: '10px 0',
              borderRadius: 9,
              border: 'none',
              backgroundColor: checkedItems.size === 0 ? '#c5d4c3' : '#2d5a27',
              fontSize: 14,
              fontWeight: 600,
              color: '#ffffff',
              cursor: checkedItems.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Save Request
          </button>
        </div>
      </div>
    </div>
  )
}
