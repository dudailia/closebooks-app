'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getRecentCorrections } from '@/lib/corrections'
import { saveJob, saveClient } from '@/lib/storage'
import { logActivity } from '@/lib/activity'
import { notify } from '@/lib/notify'
import type { ChartOfAccounts, CategorizationJob, Transaction } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#faf8f4',
  accent: '#2d5a27',
  copper: '#b8734a',
  text: '#1a1714',
  border: '#e8e0d4',
  card: '#ffffff',
  muted: '#7a7065',
  lightGreen: '#f0f7ef',
  errorRed: '#c0392b',
}

type RawTransaction = {
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
}

const SAMPLE_TRANSACTIONS: RawTransaction[] = [
  { date: '2024-03-01', description: 'DEPOSIT - CLIENT PAYMENT ACME CORP', amount: 4250.00, type: 'credit' },
  { date: '2024-03-03', description: 'SQUARE INC PAYMENT - RETAIL SALES', amount: 1820.50, type: 'credit' },
  { date: '2024-03-05', description: 'QUICKBOOKS ONLINE SUBSCRIPTION', amount: 65.00, type: 'debit' },
  { date: '2024-03-05', description: 'STRIPE PAYOUT - ONLINE ORDERS', amount: 3100.00, type: 'credit' },
  { date: '2024-03-07', description: 'OFFICE DEPOT - SUPPLIES AND EQUIPMENT', amount: 284.50, type: 'debit' },
  { date: '2024-03-08', description: 'AT&T BUSINESS INTERNET SERVICE', amount: 129.99, type: 'debit' },
  { date: '2024-03-10', description: 'PAYROLL - BI-WEEKLY EMPLOYEE WAGES', amount: 8500.00, type: 'debit' },
  { date: '2024-03-12', description: 'AMAZON WEB SERVICES CLOUD HOSTING', amount: 340.22, type: 'debit' },
  { date: '2024-03-13', description: 'CLIENT PAYMENT - SMITH AND ASSOCIATES', amount: 2800.00, type: 'credit' },
  { date: '2024-03-14', description: 'ZOOM VIDEO COMMUNICATIONS MONTHLY', amount: 19.99, type: 'debit' },
  { date: '2024-03-15', description: 'RENT - MARCH OFFICE SPACE 123 MAIN ST', amount: 2200.00, type: 'debit' },
  { date: '2024-03-17', description: 'LINKEDIN ADS CAMPAIGN - MARCH', amount: 450.00, type: 'debit' },
  { date: '2024-03-18', description: 'CLIENT RETAINER - JOHNSON CONSULTING', amount: 3500.00, type: 'credit' },
  { date: '2024-03-19', description: 'COMCAST BUSINESS PHONE AND INTERNET', amount: 189.00, type: 'debit' },
  { date: '2024-03-20', description: 'USPS SHIPPING AND POSTAGE - BULK', amount: 78.40, type: 'debit' },
  { date: '2024-03-21', description: 'GOOGLE WORKSPACE BUSINESS STARTER', amount: 84.00, type: 'debit' },
  { date: '2024-03-22', description: 'DEPOSIT - MILESTONE PAYMENT PROJECT X', amount: 6000.00, type: 'credit' },
  { date: '2024-03-24', description: 'UBER FOR BUSINESS - CLIENT MEETINGS', amount: 127.50, type: 'debit' },
  { date: '2024-03-25', description: 'PAYROLL - BI-WEEKLY EMPLOYEE WAGES', amount: 8500.00, type: 'debit' },
  { date: '2024-03-26', description: 'ADOBE CREATIVE CLOUD SUBSCRIPTION', amount: 59.99, type: 'debit' },
  { date: '2024-03-28', description: 'CLIENT PAYMENT - MARTINEZ LLC', amount: 1950.00, type: 'credit' },
  { date: '2024-03-29', description: 'INSURANCE PREMIUM - BUSINESS LIABILITY', amount: 312.00, type: 'debit' },
]

const COA_TEMPLATES: Record<string, ChartOfAccounts[]> = {
  'Standard Small Business': [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '3000', name: 'Owner Equity', type: 'equity' },
    { code: '4000', name: 'Revenue', type: 'revenue' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
    { code: '6100', name: 'Payroll & Wages', type: 'expense' },
    { code: '6200', name: 'Rent & Occupancy', type: 'expense' },
    { code: '6300', name: 'Software & SaaS', type: 'expense' },
    { code: '6400', name: 'Marketing & Advertising', type: 'expense' },
    { code: '6500', name: 'Utilities', type: 'expense' },
    { code: '6600', name: 'Office Supplies', type: 'expense' },
    { code: '6700', name: 'Travel & Meals', type: 'expense' },
    { code: '6800', name: 'Insurance', type: 'expense' },
    { code: '6900', name: 'Professional Services', type: 'expense' },
    { code: '7000', name: 'Miscellaneous', type: 'expense' },
  ],
  'Professional Services': [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '3000', name: 'Owner Equity', type: 'equity' },
    { code: '4000', name: 'Consulting Revenue', type: 'revenue' },
    { code: '4100', name: 'Retainer Revenue', type: 'revenue' },
    { code: '6100', name: 'Payroll & Wages', type: 'expense' },
    { code: '6200', name: 'Rent & Occupancy', type: 'expense' },
    { code: '6300', name: 'Software & Tools', type: 'expense' },
    { code: '6400', name: 'Business Development', type: 'expense' },
    { code: '6500', name: 'Professional Development', type: 'expense' },
    { code: '6600', name: 'Insurance', type: 'expense' },
    { code: '6700', name: 'Travel & Entertainment', type: 'expense' },
    { code: '7000', name: 'Miscellaneous', type: 'expense' },
  ],
  'E-commerce': [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset' },
    { code: '1300', name: 'Inventory', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '3000', name: 'Owner Equity', type: 'equity' },
    { code: '4000', name: 'Online Sales Revenue', type: 'revenue' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
    { code: '5100', name: 'Shipping & Fulfillment', type: 'expense' },
    { code: '6100', name: 'Payroll & Wages', type: 'expense' },
    { code: '6300', name: 'Platform & Software', type: 'expense' },
    { code: '6400', name: 'Paid Advertising', type: 'expense' },
    { code: '6500', name: 'Returns & Refunds', type: 'expense' },
    { code: '7000', name: 'Miscellaneous', type: 'expense' },
  ],
  'Restaurant': [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '3000', name: 'Owner Equity', type: 'equity' },
    { code: '4000', name: 'Food & Beverage Sales', type: 'revenue' },
    { code: '5000', name: 'Food & Beverage Cost', type: 'expense' },
    { code: '6100', name: 'Payroll & Wages', type: 'expense' },
    { code: '6200', name: 'Rent & Occupancy', type: 'expense' },
    { code: '6300', name: 'Utilities', type: 'expense' },
    { code: '6400', name: 'Marketing & Delivery Apps', type: 'expense' },
    { code: '6500', name: 'Equipment & Repairs', type: 'expense' },
    { code: '6600', name: 'Supplies & Packaging', type: 'expense' },
    { code: '7000', name: 'Miscellaneous', type: 'expense' },
  ],
}

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  'Standard Small Business': 'General-purpose for most service businesses',
  'E-commerce': 'For online stores with COGS, fulfillment, and ad spend',
  'Professional Services': 'Consulting, legal, accounting firms',
  'Restaurant': 'Food cost, labor, occupancy optimized',
}

const LOADING_PHASES = [
  'Matching merchant descriptions...',
  'Applying your chart of accounts...',
  'Detecting recurring transactions...',
  'Calculating confidence scores...',
  'Almost done...',
]

// ─────────────────────────────────────────────────────────────────────────────
// CSV parser
// ─────────────────────────────────────────────────────────────────────────────

function parseCSV(text: string): RawTransaction[] {
  const lines = text.trim().split('\n')
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''))
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''))
      const dateIdx = header.findIndex((h) => h.includes('date'))
      const descIdx = header.findIndex(
        (h) => h.includes('desc') || h.includes('memo') || h.includes('narrat')
      )
      const amtIdx = header.findIndex((h) => h.includes('amount') || h.includes('amt'))
      const typeIdx = header.findIndex(
        (h) => h.includes('type') || h.includes('debit') || h.includes('credit')
      )
      return {
        date: cols[dateIdx] || '',
        description: cols[descIdx] || '',
        amount: Math.abs(parseFloat(cols[amtIdx]) || 0),
        type: (cols[typeIdx]?.toLowerCase().includes('credit')
          ? 'credit'
          : parseFloat(cols[amtIdx]) >= 0
          ? 'credit'
          : 'debit') as 'debit' | 'credit',
      }
    })
    .filter((t) => t.amount > 0 && t.description)
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner SVG
// ─────────────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite',
      }}
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke={COLORS.border}
        strokeWidth="4"
      />
      <path
        d="M44 24a20 20 0 0 0-20-20"
        stroke={COLORS.accent}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress dots
// ─────────────────────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '48px',
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isDone = stepNum < current
        const isActive = stepNum === current

        return (
          <div
            key={stepNum}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isDone
                ? COLORS.accent
                : isActive
                ? COLORS.card
                : COLORS.border,
              border: isDone
                ? `2px solid ${COLORS.accent}`
                : isActive
                ? `2.5px solid ${COLORS.accent}`
                : `2px solid ${COLORS.border}`,
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
          />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────

export default function GetStartedPage() {
  const router = useRouter()

  // Wizard state
  const [step, setStep] = useState(1)
  const [firmName, setFirmName] = useState('')
  const [clientCount, setClientCount] = useState('')
  const [software, setSoftware] = useState('')
  const [usesSampleData, setUsesSampleData] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  // Animation
  const [visible, setVisible] = useState(true)

  // Refs
  const firmInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  // Auto-focus firm name input on step 1
  useEffect(() => {
    if (step === 1 && firmInputRef.current) {
      firmInputRef.current.focus()
    }
  }, [step])

  // Loading phase cycling
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingPhase((p) => (p + 1) % LOADING_PHASES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [loading])

  // Progress bar animation over ~10 seconds
  useEffect(() => {
    if (!loading) {
      setProgress(0)
      return
    }
    setProgress(0)
    const start = Date.now()
    const duration = 10000
    const frame = () => {
      const elapsed = Date.now() - start
      const pct = Math.min(95, (elapsed / duration) * 100)
      setProgress(pct)
      if (pct < 95) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [loading])

  // Step transition animation
  const goToStep = useCallback((next: number) => {
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 180)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleFirmNameContinue() {
    if (firmName.trim()) goToStep(2)
  }

  function handleClientCountSelect(value: string) {
    setClientCount(value)
    goToStep(3)
  }

  function handleSoftwareSelect(value: string) {
    setSoftware(value)
    goToStep(4)
  }

  function handleTemplateSelect(template: string) {
    setSelectedTemplate(template)
    runCategorization(template)
  }

  function handleUseSampleData() {
    setUsesSampleData(true)
    setUploadedFile(null)
    goToStep(5)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setUsesSampleData(false)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      setUploadedFile(file)
      setUsesSampleData(false)
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleUploadContinue() {
    if (uploadedFile || usesSampleData) goToStep(5)
  }

  // ── Categorization API call ───────────────────────────────────────────────

  async function runCategorization(template: string) {
    setLoading(true)
    setError('')

    let rawTransactions: RawTransaction[] = SAMPLE_TRANSACTIONS

    if (uploadedFile && !usesSampleData) {
      try {
        const text = await uploadedFile.text()
        rawTransactions = parseCSV(text)
      } catch {
        rawTransactions = SAMPLE_TRANSACTIONS
      }
    }

    const selectedCoA = COA_TEMPLATES[template] ?? COA_TEMPLATES['Standard Small Business']
    const corrections = getRecentCorrections(10)

    const transactions: Transaction[] = rawTransactions.map((t) => ({
      id: crypto.randomUUID(),
      date: t.date,
      description: t.description,
      original_description: t.description,
      amount: t.amount,
      type: t.type,
      status: 'pending',
      confidence: 0,
      suggested_category: '',
      suggested_account_code: '',
    }))

    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          chartOfAccounts: selectedCoA,
          clientName: firmName.trim() || 'My First Client',
          corrections,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Categorization failed')
      }

      const clientName = firmName.trim() || 'My First Client'
      const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

      const job: CategorizationJob = {
        id: jobId,
        client_name: clientName,
        created_at: new Date().toISOString(),
        status: 'review',
        total_transactions: data.transactions.length,
        auto_categorized: data.summary?.approved ?? 0,
        approved: 0,
        flagged: data.summary?.flagged ?? 0,
        transactions: data.transactions,
        chart_of_accounts: selectedCoA,
      }

      saveJob(job)

      if (firmName.trim()) {
        saveClient({
          id: `client-${Date.now()}`,
          business_name: clientName,
          industry: 'Professional Services',
          contact_email: '',
          accounting_software: (software as 'QuickBooks' | 'Xero' | 'Other') || 'Other',
          created_at: new Date().toISOString(),
        })
      }

      logActivity({
        type: 'close_started',
        description: `Started categorization for ${clientName} — ${data.transactions.length} transactions`,
        clientName,
        jobId,
      })

      notify('get_started_completed', {
        clientName,
        template,
        transactionCount: data.transactions.length,
      })

      setProgress(100)

      setTimeout(() => {
        router.push(`/dashboard/review/${jobId}`)
      }, 400)
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading overlay
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: COLORS.card,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
          padding: '32px',
        }}
      >
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInPhase {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <Spinner />

        <h2
          style={{
            marginTop: '28px',
            marginBottom: '12px',
            fontSize: '22px',
            fontWeight: '600',
            color: COLORS.text,
            textAlign: 'center',
            letterSpacing: '-0.3px',
          }}
        >
          CloseBooks AI is categorizing your transactions...
        </h2>

        <p
          key={loadingPhase}
          style={{
            color: COLORS.muted,
            fontSize: '15px',
            marginBottom: '36px',
            animation: 'fadeInPhase 0.4s ease',
          }}
        >
          {LOADING_PHASES[loadingPhase]}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: '320px',
            maxWidth: '90vw',
            height: '6px',
            backgroundColor: COLORS.border,
            borderRadius: '99px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: COLORS.accent,
              borderRadius: '99px',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {error && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ color: COLORS.errorRed, fontSize: '14px', marginBottom: '12px' }}>
              {error}
            </p>
            <button
              onClick={() => {
                setLoading(false)
                setError('')
                setStep(5)
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: COLORS.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Wizard layout
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
        color: COLORS.text,
        padding: '32px 16px',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-content {
          transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .btn-option:hover {
          border-color: #2d5a27 !important;
          background-color: #f0f7ef !important;
        }
        .btn-option:focus {
          outline: 2px solid #2d5a27;
          outline-offset: 2px;
        }
        .template-btn:hover {
          border-color: #2d5a27 !important;
          background-color: #f0f7ef !important;
        }
        .drag-zone:hover {
          border-color: #2d5a27 !important;
          background-color: #f8fbf7 !important;
        }
      `}</style>

      {/* Logo / brand */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: COLORS.accent,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="4" width="12" height="2" rx="1" fill="white" />
            <rect x="2" y="7.5" width="8" height="2" rx="1" fill="white" />
            <rect x="2" y="11" width="10" height="2" rx="1" fill="white" />
          </svg>
        </div>
        <span
          style={{
            fontSize: '15px',
            fontWeight: '700',
            color: COLORS.text,
            letterSpacing: '-0.3px',
          }}
        >
          CloseBooks
        </span>
      </div>

      {/* Progress dots — 5 steps */}
      <ProgressDots current={step} total={5} />

      {/* Step content container */}
      <div
        className="step-content"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          width: '100%',
          maxWidth: '520px',
        }}
      >
        {/* ── Step 1: Firm name ── */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: COLORS.muted, fontSize: '13px', fontWeight: '500', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 1 of 5
            </p>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: COLORS.text,
                marginBottom: '8px',
                letterSpacing: '-0.5px',
                lineHeight: 1.25,
              }}
            >
              What&apos;s your firm name?
            </h1>
            <p style={{ color: COLORS.muted, fontSize: '15px', marginBottom: '36px' }}>
              You can change this anytime in settings
            </p>

            <input
              ref={firmInputRef}
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFirmNameContinue()}
              placeholder="e.g. Greenfield Accounting"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '18px',
                border: `2px solid ${firmName.trim() ? COLORS.accent : COLORS.border}`,
                borderRadius: '12px',
                backgroundColor: COLORS.card,
                color: COLORS.text,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease',
                marginBottom: '20px',
              }}
              autoComplete="organization"
            />

            <button
              onClick={handleFirmNameContinue}
              disabled={!firmName.trim()}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: firmName.trim() ? COLORS.accent : COLORS.border,
                color: firmName.trim() ? '#fff' : COLORS.muted,
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: firmName.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Client volume ── */}
        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: COLORS.muted, fontSize: '13px', fontWeight: '500', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 2 of 5
            </p>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: COLORS.text,
                marginBottom: '8px',
                letterSpacing: '-0.5px',
                lineHeight: 1.25,
              }}
            >
              How many clients do you close books for each month?
            </h1>
            <p style={{ color: COLORS.muted, fontSize: '15px', marginBottom: '36px' }}>
              Helps us tailor your experience
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {['1–10', '11–25', '26–50', '50+'].map((option) => (
                <button
                  key={option}
                  className="btn-option"
                  onClick={() => handleClientCountSelect(option)}
                  style={{
                    padding: '20px 16px',
                    backgroundColor: clientCount === option ? COLORS.lightGreen : COLORS.card,
                    border: `2px solid ${clientCount === option ? COLORS.accent : COLORS.border}`,
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: COLORS.text,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Accounting software ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: COLORS.muted, fontSize: '13px', fontWeight: '500', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 3 of 5
            </p>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: COLORS.text,
                marginBottom: '8px',
                letterSpacing: '-0.5px',
                lineHeight: 1.25,
              }}
            >
              What accounting software do your clients use?
            </h1>
            <p style={{ color: COLORS.muted, fontSize: '15px', marginBottom: '36px' }}>
              We support all major platforms
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {['QuickBooks', 'Xero', 'Sage', 'Other'].map((option) => (
                <button
                  key={option}
                  className="btn-option"
                  onClick={() => handleSoftwareSelect(option)}
                  style={{
                    padding: '20px 16px',
                    backgroundColor: software === option ? COLORS.lightGreen : COLORS.card,
                    border: `2px solid ${software === option ? COLORS.accent : COLORS.border}`,
                    borderRadius: '12px',
                    fontSize: '17px',
                    fontWeight: '600',
                    color: COLORS.text,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Bank statement upload ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: COLORS.muted, fontSize: '13px', fontWeight: '500', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 4 of 5
            </p>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: COLORS.text,
                marginBottom: '8px',
                letterSpacing: '-0.5px',
                lineHeight: 1.25,
              }}
            >
              Upload a bank statement to see CloseBooks in action
            </h1>
            <p style={{ color: COLORS.muted, fontSize: '15px', marginBottom: '32px' }}>
              We accept CSV exports from any bank or accounting software
            </p>

            {/* Drag-and-drop zone */}
            <div
              ref={dragRef}
              className="drag-zone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: `2px dashed ${dragging ? COLORS.accent : uploadedFile ? COLORS.accent : COLORS.border}`,
                borderRadius: '14px',
                padding: '40px 24px',
                cursor: 'pointer',
                backgroundColor: dragging
                  ? '#f0f7ef'
                  : uploadedFile
                  ? '#f0f7ef'
                  : COLORS.card,
                transition: 'all 0.2s ease',
                marginBottom: '12px',
              }}
            >
              {uploadedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {/* Green checkmark */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l4.5 4.5L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontWeight: '600', color: COLORS.text, fontSize: '15px' }}>
                    {uploadedFile.name}
                  </span>
                  <span style={{ color: COLORS.muted, fontSize: '13px' }}>
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ marginBottom: '4px' }}>
                    <rect x="6" y="8" width="24" height="20" rx="3" stroke={COLORS.muted} strokeWidth="2" />
                    <path d="M13 18h10M18 13v10" stroke={COLORS.muted} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontWeight: '600', color: COLORS.text, fontSize: '15px' }}>
                    Drag & drop your CSV here
                  </span>
                  <span style={{ color: COLORS.muted, fontSize: '13px' }}>
                    or click to browse — CSV files only
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Separator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '16px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
              <span style={{ color: COLORS.muted, fontSize: '13px', flexShrink: 0 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
            </div>

            {/* Sample data button */}
            <button
              onClick={handleUseSampleData}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: usesSampleData ? COLORS.accent : COLORS.card,
                color: usesSampleData ? '#fff' : COLORS.text,
                border: `2px solid ${usesSampleData ? COLORS.accent : COLORS.border}`,
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                marginBottom: '16px',
              }}
            >
              {/* Briefcase icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect
                  x="2"
                  y="7"
                  width="14"
                  height="9"
                  rx="2"
                  stroke={usesSampleData ? 'white' : COLORS.text}
                  strokeWidth="1.5"
                />
                <path
                  d="M6 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                  stroke={usesSampleData ? 'white' : COLORS.text}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Use sample data instead →
            </button>

            {/* Continue button — only if file uploaded */}
            {uploadedFile && (
              <button
                onClick={handleUploadContinue}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: COLORS.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.2s ease',
                }}
              >
                Continue →
              </button>
            )}
          </div>
        )}

        {/* ── Step 5: Chart of accounts ── */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: COLORS.muted, fontSize: '13px', fontWeight: '500', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step 5 of 5
            </p>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: COLORS.text,
                marginBottom: '8px',
                letterSpacing: '-0.5px',
                lineHeight: 1.25,
              }}
            >
              Choose your chart of accounts template
            </h1>
            <p style={{ color: COLORS.muted, fontSize: '15px', marginBottom: '32px' }}>
              You can customize your accounts after categorization
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {Object.keys(COA_TEMPLATES).map((template) => (
                <button
                  key={template}
                  className="template-btn"
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor:
                      selectedTemplate === template ? COLORS.lightGreen : COLORS.card,
                    border: `2px solid ${
                      selectedTemplate === template ? COLORS.accent : COLORS.border
                    }`,
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '15px',
                      color: COLORS.text,
                      marginBottom: '3px',
                    }}
                  >
                    {template}
                  </div>
                  <div style={{ fontSize: '13px', color: COLORS.muted }}>
                    {TEMPLATE_DESCRIPTIONS[template]}
                  </div>
                </button>
              ))}
            </div>

            {/* Upload own CoA option */}
            <UploadCoAOption
              onSelect={() => handleTemplateSelect('Standard Small Business')}
            />
          </div>
        )}
      </div>

      {/* Skip link for step 1 */}
      {step === 1 && (
        <button
          onClick={() => goToStep(2)}
          style={{
            marginTop: '24px',
            background: 'none',
            border: 'none',
            color: COLORS.muted,
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Skip for now
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Upload own CoA
// ─────────────────────────────────────────────────────────────────────────────

function UploadCoAOption({ onSelect }: { onSelect: () => void }) {
  const [showInput, setShowInput] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      // File selected — uses Standard template as fallback but triggers next step
      onSelect()
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          if (!showInput) {
            setShowInput(true)
            setTimeout(() => fileRef.current?.click(), 80)
          } else {
            fileRef.current?.click()
          }
        }}
        style={{
          width: '100%',
          padding: '13px 20px',
          backgroundColor: 'transparent',
          border: `1.5px dashed ${COLORS.border}`,
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '500',
          color: COLORS.muted,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke={COLORS.muted} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        I&apos;ll upload my own
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
