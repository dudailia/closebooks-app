'use client'

import { useState, useEffect } from 'react'
import type { Invoice, InvoiceLineItem, RateCard } from '@/types/billing'
import type { CategorizationJob } from '@/types'
import { generateInvoiceFromJob, getPricingInsight } from '@/lib/invoiceGenerator'
import { getNextInvoiceNumber } from '@/lib/billingStorage'

interface Props {
  job: CategorizationJob
  rateCard: RateCard
  firmName: string
  onSave: (invoice: Invoice) => void
  onClose: () => void
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function InvoiceGenerateModal({ job, rateCard, firmName, onSave, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [invoice, setInvoice] = useState<Invoice>(() => {
    const base = generateInvoiceFromJob(job, rateCard, firmName)
    base.number = getNextInvoiceNumber()
    return base
  })
  const [newLineDesc, setNewLineDesc] = useState('')
  const [newLineQty, setNewLineQty] = useState(1)
  const [newLinePrice, setNewLinePrice] = useState(0)

  const insight = getPricingInsight(rateCard, job.total_transactions)

  function recalc(items: InvoiceLineItem[]): Invoice {
    const subtotal = items.reduce((s, li) => s + li.total, 0)
    const taxAmount = invoice.taxRate ? subtotal * invoice.taxRate : undefined
    const total = subtotal + (taxAmount ?? 0)
    return { ...invoice, lineItems: items, subtotal, taxAmount, total }
  }

  function updateLineItem(id: string, field: keyof InvoiceLineItem, raw: string | number) {
    const items = invoice.lineItems.map((li) => {
      if (li.id !== id) return li
      const updated = { ...li, [field]: raw }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice
      }
      return updated
    })
    setInvoice(recalc(items))
  }

  function removeLineItem(id: string) {
    const items = invoice.lineItems.filter((li) => li.id !== id)
    setInvoice(recalc(items))
  }

  function addCustomLine() {
    if (!newLineDesc.trim()) return
    const li: InvoiceLineItem = {
      id: `li-custom-${Date.now()}`,
      description: newLineDesc.trim(),
      quantity: newLineQty,
      unitPrice: newLinePrice,
      total: newLineQty * newLinePrice,
      type: 'custom',
    }
    const items = [...invoice.lineItems, li]
    setInvoice(recalc(items))
    setNewLineDesc('')
    setNewLineQty(1)
    setNewLinePrice(0)
  }

  function handleSave(status: Invoice['status']) {
    const final: Invoice = {
      ...invoice,
      status,
      ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}),
    }
    onSave(final)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#e8e0d4' }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
            >
              Generate Invoice
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              {job.client_name} · {job.total_transactions} transactions
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="flex items-center gap-1.5"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: s === step ? '#2d5a27' : s < step ? '#e8f0e6' : '#f5f2ed',
                    color: s === step ? '#ffffff' : s < step ? '#2d5a27' : '#6b6560',
                  }}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className="w-6 h-px"
                    style={{ backgroundColor: s < step ? '#2d5a27' : '#e8e0d4' }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step 1: Line Items */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: '#1a1714' }}>Review Line Items</h3>

            <div className="space-y-2">
              {invoice.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
                >
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full text-sm bg-transparent border-none outline-none"
                      style={{ color: '#1a1714' }}
                      value={li.description}
                      onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: '#6b6560' }}>Qty</span>
                      <input
                        type="number"
                        min={1}
                        className="w-14 text-sm font-mono text-right rounded border px-1.5 py-1"
                        style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                        value={li.quantity}
                        onChange={(e) => updateLineItem(li.id, 'quantity', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: '#6b6560' }}>$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-20 text-sm font-mono text-right rounded border px-1.5 py-1"
                        style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                        value={li.unitPrice}
                        onChange={(e) => updateLineItem(li.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <span className="text-sm font-mono font-semibold w-20 text-right" style={{ color: '#1a1714' }}>
                      {fmtMoney(li.total)}
                    </span>
                    <button
                      onClick={() => removeLineItem(li.id)}
                      className="p-1 rounded"
                      style={{ color: '#6b6560' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add custom line */}
            <div
              className="flex items-center gap-2 p-3 rounded-xl border border-dashed"
              style={{ borderColor: '#c4bdb8' }}
            >
              <input
                placeholder="Custom line item description..."
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: '#1a1714' }}
                value={newLineDesc}
                onChange={(e) => setNewLineDesc(e.target.value)}
              />
              <input
                type="number"
                placeholder="Qty"
                min={1}
                className="w-14 text-sm font-mono text-right rounded border px-1.5 py-1"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                value={newLineQty}
                onChange={(e) => setNewLineQty(parseFloat(e.target.value) || 1)}
              />
              <input
                type="number"
                placeholder="Price"
                min={0}
                step={0.01}
                className="w-20 text-sm font-mono text-right rounded border px-1.5 py-1"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                value={newLinePrice}
                onChange={(e) => setNewLinePrice(parseFloat(e.target.value) || 0)}
              />
              <button
                onClick={addCustomLine}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Add
              </button>
            </div>

            {/* Total */}
            <div
              className="flex justify-end pt-2 border-t"
              style={{ borderColor: '#e8e0d4' }}
            >
              <div className="text-right">
                <p className="text-xs" style={{ color: '#6b6560' }}>Total</p>
                <p className="text-2xl font-mono font-bold" style={{ color: '#1a1714' }}>
                  {fmtMoney(invoice.total)}
                </p>
              </div>
            </div>

            {/* Pricing insight */}
            {insight && (
              <div
                className="text-xs p-3 rounded-xl"
                style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
              >
                <span className="font-semibold">Pricing insight: </span>{insight}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Invoice Details */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: '#1a1714' }}>Invoice Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                  Invoice Number
                </label>
                <input
                  className="w-full text-sm font-mono rounded-xl border px-3 py-2"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#faf8f4' }}
                  value={invoice.number}
                  onChange={(e) => setInvoice({ ...invoice, number: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                  Firm Name
                </label>
                <input
                  className="w-full text-sm rounded-xl border px-3 py-2"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#faf8f4' }}
                  value={invoice.firmName ?? ''}
                  onChange={(e) => setInvoice({ ...invoice, firmName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                  Issue Date
                </label>
                <input
                  type="date"
                  className="w-full text-sm rounded-xl border px-3 py-2"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                  value={invoice.issuedDate}
                  onChange={(e) => setInvoice({ ...invoice, issuedDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full text-sm rounded-xl border px-3 py-2"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                  value={invoice.dueDate}
                  onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Payment instructions, thank you note, terms..."
                className="w-full text-sm rounded-xl border px-3 py-2 resize-none"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                value={invoice.notes ?? ''}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1714' }}>Invoice Preview</h3>

            {/* Invoice preview */}
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
            >
              {/* Firm + title */}
              <div className="flex justify-between items-start">
                <div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-dm-serif)',
                      fontSize: 20,
                      color: '#1a1714',
                    }}
                  >
                    {invoice.firmName || 'Your Firm'}
                  </h2>
                </div>
                <div className="text-right">
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-serif)',
                      fontSize: 24,
                      color: '#2d5a27',
                    }}
                  >
                    INVOICE
                  </p>
                  <p className="text-sm font-mono" style={{ color: '#6b6560' }}>{invoice.number}</p>
                </div>
              </div>

              <div
                className="flex justify-between text-sm border-t border-b py-3"
                style={{ borderColor: '#e8e0d4' }}
              >
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>Bill To</p>
                  <p className="font-semibold" style={{ color: '#1a1714' }}>{invoice.clientName}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>Issued</p>
                      <p className="font-mono text-xs" style={{ color: '#1a1714' }}>{invoice.issuedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>Due</p>
                      <p className="font-mono text-xs" style={{ color: '#1a1714' }}>{invoice.dueDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: '#6b6560' }}>
                    <th className="text-left py-1">Description</th>
                    <th className="text-right py-1 w-16">Qty</th>
                    <th className="text-right py-1 w-24">Unit Price</th>
                    <th className="text-right py-1 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id} style={{ borderTop: '1px solid #f0ece4' }}>
                      <td className="py-1.5 pr-4" style={{ color: '#1a1714' }}>{li.description}</td>
                      <td className="py-1.5 text-right font-mono" style={{ color: '#6b6560' }}>{li.quantity}</td>
                      <td className="py-1.5 text-right font-mono" style={{ color: '#6b6560' }}>{fmtMoney(li.unitPrice)}</td>
                      <td className="py-1.5 text-right font-mono font-semibold" style={{ color: '#1a1714' }}>{fmtMoney(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div
                className="flex flex-col items-end gap-1 pt-3 border-t"
                style={{ borderColor: '#e8e0d4' }}
              >
                <div className="flex gap-8 text-xs" style={{ color: '#6b6560' }}>
                  <span>Subtotal</span>
                  <span className="font-mono w-24 text-right">{fmtMoney(invoice.subtotal)}</span>
                </div>
                {invoice.taxAmount != null && invoice.taxAmount > 0 && (
                  <div className="flex gap-8 text-xs" style={{ color: '#6b6560' }}>
                    <span>Tax ({((invoice.taxRate ?? 0) * 100).toFixed(2)}%)</span>
                    <span className="font-mono w-24 text-right">{fmtMoney(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex gap-8 text-sm font-bold" style={{ color: '#1a1714' }}>
                  <span>Total</span>
                  <span className="font-mono w-24 text-right">{fmtMoney(invoice.total)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div
                  className="pt-3 border-t text-xs"
                  style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                >
                  <p className="font-medium mb-1" style={{ color: '#1a1714' }}>Notes</p>
                  <p>{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: '#e8e0d4' }}
        >
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-sm px-4 py-2 rounded-xl border font-medium"
            style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          <div className="flex gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="text-sm px-4 py-2 rounded-xl font-medium text-white"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Next
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSave('draft')}
                  className="text-sm px-4 py-2 rounded-xl border font-medium"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('sent')}
                  className="text-sm px-4 py-2 rounded-xl font-medium text-white"
                  style={{ backgroundColor: '#2d5a27' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                >
                  Mark as Sent
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
