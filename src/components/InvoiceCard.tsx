'use client'

import { useState } from 'react'
import type { Invoice } from '@/types/billing'

interface Props {
  invoice: Invoice
  onMarkPaid?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: () => void
}

const STATUS_BORDER: Record<Invoice['status'], string> = {
  paid: '#2d5a27',
  sent: '#b8734a',
  overdue: '#dc2626',
  draft: '#c4bdb8',
}

const STATUS_LABEL: Record<Invoice['status'], string> = {
  paid: 'Paid',
  sent: 'Sent',
  overdue: 'Overdue',
  draft: 'Draft',
}

const STATUS_BG: Record<Invoice['status'], string> = {
  paid: '#e8f0e6',
  sent: '#fdf2e9',
  overdue: '#fef2f2',
  draft: '#f5f2ed',
}

const STATUS_TEXT: Record<Invoice['status'], string> = {
  paid: '#2d5a27',
  sent: '#b8734a',
  overdue: '#dc2626',
  draft: '#6b6560',
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function InvoiceCard({ invoice, onMarkPaid, onDelete, onClick }: Props) {
  const [hovered, setHovered] = useState(false)

  const isOverdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'draft' &&
    new Date(invoice.dueDate) < new Date()

  return (
    <div
      className="relative rounded-2xl border overflow-hidden cursor-pointer transition-shadow"
      style={{
        borderColor: '#e8e0d4',
        backgroundColor: '#ffffff',
        boxShadow: hovered ? '0 4px 16px rgba(26,23,20,0.08)' : '0 1px 4px rgba(26,23,20,0.04)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Left status border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: STATUS_BORDER[invoice.status] }}
      />

      <div className="pl-5 pr-4 py-4 flex items-center gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono" style={{ color: '#6b6560' }}>
              {invoice.number}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: STATUS_BG[invoice.status],
                color: STATUS_TEXT[invoice.status],
              }}
            >
              {STATUS_LABEL[invoice.status]}
            </span>
          </div>

          <p className="text-sm font-semibold truncate" style={{ color: '#1a1714' }}>
            {invoice.clientName}
          </p>

          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
            Issued {fmt(invoice.issuedDate)}
          </p>
        </div>

        {/* Amount + due date */}
        <div className="text-right shrink-0">
          <p
            className="text-lg font-mono font-bold"
            style={{ color: '#1a1714', letterSpacing: '-0.02em' }}
          >
            {fmtMoney(invoice.total)}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: isOverdue ? '#dc2626' : '#6b6560' }}
          >
            Due {fmt(invoice.dueDate)}
          </p>
        </div>

        {/* Hover actions */}
        {hovered && (
          <div
            className="flex items-center gap-1 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            {invoice.status !== 'paid' && onMarkPaid && (
              <button
                onClick={() => onMarkPaid(invoice.id)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors border"
                style={{ color: '#2d5a27', borderColor: '#2d5a27', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f0e6' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                title="Mark as Paid"
              >
                Mark Paid
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(invoice.id)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#6b6560' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = '#fef2f2' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 8h7l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
