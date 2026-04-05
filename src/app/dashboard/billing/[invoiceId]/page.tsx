'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getInvoice, updateInvoiceStatus, deleteInvoice } from '@/lib/billingStorage'
import type { Invoice } from '@/types/billing'

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
}
const STATUS_COLOR: Record<Invoice['status'], string> = {
  draft: '#6b6560',
  sent: '#b8734a',
  paid: '#2d5a27',
  overdue: '#dc2626',
}
const STATUS_BG: Record<Invoice['status'], string> = {
  draft: '#f5f2ed',
  sent: '#fdf2e9',
  paid: '#e8f0e6',
  overdue: '#fef2f2',
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.invoiceId as string

  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!invoiceId) return
    const inv = getInvoice(invoiceId)
    setInvoice(inv)
  }, [invoiceId])

  function handleMarkPaid() {
    if (!invoice) return
    updateInvoiceStatus(invoice.id, 'paid', new Date(paidDate).toISOString())
    setInvoice({ ...invoice, status: 'paid', paidAt: new Date(paidDate).toISOString() })
    setShowPaidModal(false)
  }

  function handleDelete() {
    if (!invoice) return
    deleteInvoice(invoice.id)
    router.push('/dashboard/billing')
  }

  // Loading
  if (invoice === undefined) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#e8e0d4', borderTopColor: '#2d5a27' }} />
        </main>
      </div>
    )
  }

  // Not found
  if (invoice === null) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
          >
            Invoice Not Found
          </h1>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            This invoice doesn't exist or may have been deleted.
          </p>
          <Link
            href="/dashboard/billing"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            Back to Billing
          </Link>
        </main>
      </div>
    )
  }

  const isOverdue =
    invoice.status !== 'paid' && invoice.status !== 'draft' && new Date(invoice.dueDate) < new Date()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm" style={{ color: '#6b6560' }}>
            <Link
              href="/dashboard/billing"
              className="transition-colors"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560' }}
            >
              Billing
            </Link>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#1a1714' }}>{invoice.number}</span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' && (
              <button
                onClick={() => setShowPaidModal(true)}
                className="text-sm px-3 py-2 rounded-xl border font-medium transition-colors"
                style={{ borderColor: '#2d5a27', color: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f0e6' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="text-sm px-3 py-2 rounded-xl border font-medium transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed'; e.currentTarget.style.color = '#1a1714' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b6560' }}
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5V2h8v3M3 9H1V5h12v4h-2M3 9v3h8V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download / Print
              </span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = '#fef2f2' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
              title="Delete invoice"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5 4V2.5h6V4M5.5 7v5M10.5 7v5M3.5 4l.5 9.5h8l.5-9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Print-ready invoice */}
        <div
          id="invoice-print"
          className="rounded-2xl border p-8 space-y-6 print:shadow-none print:border-none print:rounded-none print:p-0"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-2xl"
                style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
              >
                {invoice.firmName || 'Your Firm'}
              </h1>
            </div>
            <div className="text-right">
              <h2
                className="text-3xl font-light tracking-widest uppercase"
                style={{ color: '#2d5a27', fontFamily: 'var(--font-dm-serif)' }}
              >
                Invoice
              </h2>
              <p className="text-sm font-mono mt-1" style={{ color: '#6b6560' }}>
                {invoice.number}
              </p>
              <span
                className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: STATUS_BG[invoice.status],
                  color: STATUS_COLOR[invoice.status],
                }}
              >
                {STATUS_LABEL[invoice.status]}
              </span>
            </div>
          </div>

          {/* Bill to + dates */}
          <div
            className="flex items-start justify-between py-5 border-t border-b"
            style={{ borderColor: '#e8e0d4' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6560' }}>
                Bill To
              </p>
              <p className="text-base font-semibold" style={{ color: '#1a1714' }}>
                {invoice.clientName}
              </p>
            </div>
            <div className="flex gap-10 text-right">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6560' }}>
                  Invoice Date
                </p>
                <p className="text-sm font-mono" style={{ color: '#1a1714' }}>{fmt(invoice.issuedDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6560' }}>
                  Due Date
                </p>
                <p
                  className="text-sm font-mono"
                  style={{ color: isOverdue ? '#dc2626' : '#1a1714' }}
                >
                  {fmt(invoice.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full">
            <thead>
              <tr
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#6b6560' }}
              >
                <th className="text-left py-2 pr-4">Description</th>
                <th className="text-right py-2 w-16">Qty</th>
                <th className="text-right py-2 w-28">Unit Price</th>
                <th className="text-right py-2 w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li, idx) => (
                <tr
                  key={li.id}
                  style={{ borderTop: `1px solid ${idx === 0 ? '#e8e0d4' : '#f5f2ed'}` }}
                >
                  <td className="py-3 pr-4 text-sm" style={{ color: '#1a1714' }}>
                    {li.description}
                  </td>
                  <td className="py-3 text-right text-sm font-mono" style={{ color: '#6b6560' }}>
                    {li.quantity}
                  </td>
                  <td className="py-3 text-right text-sm font-mono" style={{ color: '#6b6560' }}>
                    {fmtMoney(li.unitPrice)}
                  </td>
                  <td className="py-3 text-right text-sm font-mono font-semibold" style={{ color: '#1a1714' }}>
                    {fmtMoney(li.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Subtotal / tax / total */}
          <div
            className="flex flex-col items-end gap-2 pt-4 border-t"
            style={{ borderColor: '#e8e0d4' }}
          >
            <div className="flex items-center gap-12 text-sm" style={{ color: '#6b6560' }}>
              <span>Subtotal</span>
              <span className="font-mono w-32 text-right">{fmtMoney(invoice.subtotal)}</span>
            </div>
            {invoice.taxAmount != null && invoice.taxAmount > 0 && (
              <div className="flex items-center gap-12 text-sm" style={{ color: '#6b6560' }}>
                <span>Tax ({((invoice.taxRate ?? 0) * 100).toFixed(2)}%)</span>
                <span className="font-mono w-32 text-right">{fmtMoney(invoice.taxAmount)}</span>
              </div>
            )}
            <div
              className="flex items-center gap-12 text-base font-bold pt-2 border-t"
              style={{ color: '#1a1714', borderColor: '#e8e0d4' }}
            >
              <span>Total</span>
              <span className="font-mono w-32 text-right">{fmtMoney(invoice.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div
              className="pt-4 border-t"
              style={{ borderColor: '#e8e0d4' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6560' }}>
                Notes
              </p>
              <p className="text-sm" style={{ color: '#1a1714' }}>{invoice.notes}</p>
            </div>
          )}

          {/* Status footer */}
          <div
            className="pt-4 border-t flex items-center justify-between"
            style={{ borderColor: '#e8e0d4' }}
          >
            <div className="text-xs" style={{ color: '#a09a94' }}>
              {invoice.sentAt && <span>Sent {fmt(invoice.sentAt)} · </span>}
              {invoice.paidAt && <span style={{ color: '#2d5a27' }}>Paid {fmt(invoice.paidAt)}</span>}
              {!invoice.sentAt && !invoice.paidAt && <span>Created as draft</span>}
            </div>
            <div
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ backgroundColor: '#e8f0e6' }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="1" width="13" height="17" rx="2" stroke="#2d5a27" strokeWidth="1.5" fill="none" />
                <path d="M6 6h5M6 10h5M6 14h3" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </main>


      {/* Mark as Paid modal */}
      {showPaidModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
            >
              Mark Invoice as Paid
            </h2>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                Payment Date
              </label>
              <input
                type="date"
                className="w-full text-sm rounded-xl border px-3 py-2"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPaidModal(false)}
                className="text-sm px-4 py-2 rounded-xl border"
                style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                className="text-sm px-4 py-2 rounded-xl font-medium text-white"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
            >
              Delete Invoice?
            </h2>
            <p className="text-sm" style={{ color: '#6b6560' }}>
              This will permanently delete <strong>{invoice.number}</strong>. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm px-4 py-2 rounded-xl border"
                style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-sm px-4 py-2 rounded-xl font-medium text-white"
                style={{ backgroundColor: '#dc2626' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  )
}
