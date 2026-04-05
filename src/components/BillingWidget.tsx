'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CategorizationJob } from '@/types'
import type { Invoice } from '@/types/billing'

function getJobsFromStorage(): CategorizationJob[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('closebooks_jobs') ?? '[]') as CategorizationJob[]
  } catch {
    return []
  }
}

function getInvoicesFromStorage(): Invoice[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('cb_invoices') ?? '[]') as Invoice[]
  } catch {
    return []
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function BillingWidget() {
  const [unbilledCount, setUnbilledCount] = useState(0)
  const [outstanding, setOutstanding] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    const jobs = getJobsFromStorage()
    const invoices = getInvoicesFromStorage()
    const billedJobIds = new Set(invoices.map((inv) => inv.jobId).filter(Boolean) as string[])

    const unbilled = jobs.filter(
      (j) => j.status === 'completed' && !billedJobIds.has(j.id)
    )
    setUnbilledCount(unbilled.length)

    const now = new Date()
    let out = 0
    let ov = 0
    for (const inv of invoices) {
      if (inv.status === 'sent' || inv.status === 'overdue') {
        out += inv.total
      }
      if (inv.status !== 'paid' && new Date(inv.dueDate) < now) {
        ov++
      }
    }
    setOutstanding(out)
    setOverdueCount(ov)
  }, [])

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-semibold"
          style={{ color: '#1a1714', fontFamily: 'var(--font-dm-serif)' }}
        >
          Billing
        </h3>
        <Link
          href="/dashboard/billing"
          className="text-xs font-medium"
          style={{ color: '#b8734a' }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: unbilledCount > 0 ? '#fdf2e9' : '#faf8f4' }}
        >
          <p
            className="text-2xl font-bold font-mono"
            style={{ color: unbilledCount > 0 ? '#b8734a' : '#1a1714' }}
          >
            {unbilledCount}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Unbilled Closes</p>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#faf8f4' }}>
          <p className="text-2xl font-bold font-mono" style={{ color: '#1a1714' }}>
            {fmtMoney(outstanding)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Outstanding</p>
        </div>

        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: overdueCount > 0 ? '#fef2f2' : '#faf8f4' }}
        >
          <p
            className="text-2xl font-bold font-mono"
            style={{ color: overdueCount > 0 ? '#dc2626' : '#1a1714' }}
          >
            {overdueCount}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Overdue</p>
        </div>
      </div>

      <Link
        href="/dashboard/billing"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ backgroundColor: '#2d5a27' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Generate Invoice
      </Link>
    </div>
  )
}
