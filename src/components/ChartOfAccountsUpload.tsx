'use client'

import { useState, useRef } from 'react'
import { parseChartOfAccountsCSV } from '@/lib/parseCSV'
import type { ChartOfAccounts } from '@/types'

// ---------------------------------------------------------------------------
// Preset templates
// ---------------------------------------------------------------------------

const STANDARD_SMALL_BUSINESS: ChartOfAccounts[] = [
  // Assets
  { code: '1000', name: 'Checking Account',          type: 'asset'     },
  { code: '1010', name: 'Savings Account',            type: 'asset'     },
  { code: '1020', name: 'Petty Cash',                 type: 'asset'     },
  { code: '1100', name: 'Accounts Receivable',        type: 'asset'     },
  { code: '1200', name: 'Inventory',                  type: 'asset'     },
  { code: '1300', name: 'Prepaid Expenses',           type: 'asset'     },
  { code: '1500', name: 'Equipment',                  type: 'asset'     },
  { code: '1510', name: 'Accumulated Depreciation',   type: 'asset'     },
  // Liabilities
  { code: '2000', name: 'Accounts Payable',           type: 'liability' },
  { code: '2100', name: 'Credit Card Payable',        type: 'liability' },
  { code: '2200', name: 'Sales Tax Payable',          type: 'liability' },
  { code: '2300', name: 'Payroll Liabilities',        type: 'liability' },
  { code: '2400', name: 'Short-Term Loan',            type: 'liability' },
  { code: '2500', name: 'Long-Term Loan',             type: 'liability' },
  // Equity
  { code: '3000', name: "Owner's Equity",             type: 'equity'    },
  { code: '3100', name: "Owner's Draw",               type: 'equity'    },
  { code: '3200', name: 'Retained Earnings',          type: 'equity'    },
  // Revenue
  { code: '4000', name: 'Sales Revenue',              type: 'revenue'   },
  { code: '4100', name: 'Service Revenue',            type: 'revenue'   },
  { code: '4200', name: 'Other Income',               type: 'revenue'   },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold',         type: 'expense'   },
  { code: '5100', name: 'Payroll & Wages',            type: 'expense'   },
  { code: '5200', name: 'Rent & Lease',               type: 'expense'   },
  { code: '5300', name: 'Utilities',                  type: 'expense'   },
  { code: '5400', name: 'Office Supplies',            type: 'expense'   },
  { code: '5500', name: 'Marketing & Advertising',    type: 'expense'   },
  { code: '5600', name: 'Insurance',                  type: 'expense'   },
  { code: '5700', name: 'Professional Fees',          type: 'expense'   },
  { code: '5800', name: 'Travel & Entertainment',     type: 'expense'   },
  { code: '5900', name: 'Depreciation Expense',       type: 'expense'   },
  { code: '6000', name: 'Bank Fees & Charges',        type: 'expense'   },
  { code: '6100', name: 'Subscriptions & Software',   type: 'expense'   },
  { code: '6200', name: 'Taxes & Licenses',           type: 'expense'   },
  { code: '6300', name: 'Miscellaneous Expense',      type: 'expense'   },
]

const ECOMMERCE_ADDITIONS: ChartOfAccounts[] = [
  { code: '1110', name: 'Stripe Clearing Account',   type: 'asset'     },
  { code: '1120', name: 'PayPal Clearing Account',   type: 'asset'     },
  { code: '4300', name: 'Shopify Sales',             type: 'revenue'   },
  { code: '4400', name: 'Amazon Sales',              type: 'revenue'   },
  { code: '4500', name: 'Refunds & Returns',         type: 'revenue'   },
  { code: '5010', name: 'Product COGS',              type: 'expense'   },
  { code: '5020', name: 'Shipping & Fulfillment',    type: 'expense'   },
  { code: '5030', name: 'Packaging Materials',       type: 'expense'   },
  { code: '5510', name: 'Shopify & Platform Fees',   type: 'expense'   },
  { code: '5520', name: 'Payment Processing Fees',   type: 'expense'   },
  { code: '5530', name: 'Digital Advertising',       type: 'expense'   },
  { code: '5540', name: 'Influencer & Affiliate',    type: 'expense'   },
]

const PROFESSIONAL_SERVICES_ADDITIONS: ChartOfAccounts[] = [
  { code: '4600', name: 'Consulting Revenue',        type: 'revenue'   },
  { code: '4700', name: 'Retainer Revenue',          type: 'revenue'   },
  { code: '4800', name: 'Project Revenue',           type: 'revenue'   },
  { code: '5110', name: 'Subcontractor Fees',        type: 'expense'   },
  { code: '5120', name: 'Freelancer Payments',       type: 'expense'   },
  { code: '6110', name: 'SaaS & Software Tools',     type: 'expense'   },
  { code: '6120', name: 'Cloud Infrastructure',      type: 'expense'   },
  { code: '6130', name: 'Professional Development',  type: 'expense'   },
  { code: '6140', name: 'Home Office Expense',       type: 'expense'   },
  { code: '6150', name: 'Client Meals & Entertainment', type: 'expense' },
]

type TemplateName = 'standard' | 'ecommerce' | 'professional'

const TEMPLATES: Record<TemplateName, { label: string; description: string; accounts: ChartOfAccounts[] }> = {
  standard: {
    label: 'Standard Small Business',
    description: '34 accounts · all types',
    accounts: STANDARD_SMALL_BUSINESS,
  },
  ecommerce: {
    label: 'E-commerce',
    description: '46 accounts · Shopify, Stripe, COGS',
    accounts: dedupe([...STANDARD_SMALL_BUSINESS, ...ECOMMERCE_ADDITIONS]),
  },
  professional: {
    label: 'Professional Services',
    description: '44 accounts · consulting, SaaS, subs',
    accounts: dedupe([...STANDARD_SMALL_BUSINESS, ...PROFESSIONAL_SERVICES_ADDITIONS]),
  },
}

function dedupe(accounts: ChartOfAccounts[]): ChartOfAccounts[] {
  const seen = new Set<string>()
  return accounts.filter((a) => {
    if (seen.has(a.code)) return false
    seen.add(a.code)
    return true
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ORDER: ChartOfAccounts['type'][] = ['asset', 'liability', 'equity', 'revenue', 'expense']

const TYPE_STYLES: Record<ChartOfAccounts['type'], { bg: string; text: string }> = {
  asset:     { bg: '#dbeafe', text: '#1e40af' },
  liability: { bg: '#fee2e2', text: '#991b1b' },
  equity:    { bg: '#ede9fe', text: '#5b21b6' },
  revenue:   { bg: '#dcfce7', text: '#166534' },
  expense:   { bg: '#fef9c3', text: '#854d0e' },
}

function sortAccounts(accounts: ChartOfAccounts[]): ChartOfAccounts[] {
  return [...accounts].sort((a, b) => {
    const ti = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
    if (ti !== 0) return ti
    return a.code.localeCompare(b.code)
  })
}

function newBlankAccount(): ChartOfAccounts & { _id: string } {
  return { _id: crypto.randomUUID(), code: '', name: '', type: 'expense' }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  onContinue: (accounts: ChartOfAccounts[]) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChartOfAccountsUpload({ onContinue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>(STANDARD_SMALL_BUSINESS)
  const [activeTemplate, setActiveTemplate] = useState<TemplateName | null>('standard')
  const [addingRow, setAddingRow] = useState(false)
  const [newRow, setNewRow] = useState(newBlankAccount)
  const [newRowError, setNewRowError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<ChartOfAccounts['type'] | 'all'>('all')

  // --- Template selection ---------------------------------------------------

  function applyTemplate(name: TemplateName) {
    setAccounts(TEMPLATES[name].accounts)
    setActiveTemplate(name)
    setUploadError(null)
  }

  // --- CSV upload -----------------------------------------------------------

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadError(null)

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only .csv files are accepted.')
      return
    }

    const text = await file.text()
    const { accounts: parsed, errors } = parseChartOfAccountsCSV(text)

    if (parsed.length === 0) {
      setUploadError('No accounts could be read. Ensure columns are: Code, Name, Type.')
      return
    }

    const coaAccounts: ChartOfAccounts[] = parsed.map((a) => ({
      code: a.code,
      name: a.name,
      type: (a.type as ChartOfAccounts['type']) || 'expense',
    }))

    setAccounts(coaAccounts)
    setActiveTemplate(null)
    if (errors.length > 0) setUploadError(`Loaded with warnings: ${errors[0]}`)
  }

  // --- Add row -------------------------------------------------------------

  function handleAddRowCommit() {
    if (!newRow.code.trim()) { setNewRowError('Code is required.'); return }
    if (!newRow.name.trim()) { setNewRowError('Name is required.'); return }
    if (accounts.some((a) => a.code === newRow.code.trim())) {
      setNewRowError(`Code "${newRow.code.trim()}" already exists.`)
      return
    }
    setAccounts((prev) => sortAccounts([...prev, { code: newRow.code.trim(), name: newRow.name.trim(), type: newRow.type }]))
    setNewRow(newBlankAccount())
    setNewRowError(null)
    setAddingRow(false)
    setActiveTemplate(null)
  }

  function handleAddRowCancel() {
    setAddingRow(false)
    setNewRow(newBlankAccount())
    setNewRowError(null)
  }

  // --- Delete row ----------------------------------------------------------

  function handleDelete(code: string) {
    setAccounts((prev) => prev.filter((a) => a.code !== code))
    setActiveTemplate(null)
  }

  // --- Derived state -------------------------------------------------------

  const sorted = sortAccounts(accounts)
  const visible = filterType === 'all' ? sorted : sorted.filter((a) => a.type === filterType)
  const counts = TYPE_ORDER.reduce<Record<string, number>>((acc, t) => {
    acc[t] = accounts.filter((a) => a.type === t).length
    return acc
  }, {})

  // -------------------------------------------------------------------------

  return (
    <div className="space-y-5 font-sans" style={{ color: '#1a1714' }}>

      {/* Template selector */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: '#6b6560' }}>PRESET TEMPLATES</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.entries(TEMPLATES) as [TemplateName, typeof TEMPLATES[TemplateName]][]).map(([key, tpl]) => (
            <button
              key={key}
              onClick={() => applyTemplate(key)}
              className="text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
              style={{
                borderColor: activeTemplate === key ? '#2d5a27' : '#e0dbd4',
                backgroundColor: activeTemplate === key ? '#f0ece4' : '#faf8f4',
                boxShadow: activeTemplate === key ? 'inset 0 0 0 1px #2d5a27' : 'none',
              }}
            >
              <span className="font-medium block" style={{ color: activeTemplate === key ? '#2d5a27' : '#1a1714' }}>
                {tpl.label}
              </span>
              <span className="text-xs" style={{ color: '#6b6560' }}>{tpl.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload CSV */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: '#e0dbd4' }} />
        <span className="text-xs" style={{ color: '#a09a94' }}>or upload your own</span>
        <div className="h-px flex-1" style={{ backgroundColor: '#e0dbd4' }} />
      </div>

      <div>
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors"
          style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4' }}
        >
          <UploadCsvIcon />
          Upload Chart of Accounts CSV
        </button>
        <p className="text-xs mt-1.5" style={{ color: '#a09a94' }}>
          Expected columns: <code className="font-mono">Code, Name, Type</code>
        </p>
        {uploadError && (
          <p className="text-xs mt-1.5" style={{ color: '#991b1b' }}>{uploadError}</p>
        )}
      </div>

      {/* Account table */}
      {accounts.length > 0 && (
        <div>
          {/* Table header row */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', ...TYPE_ORDER] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="text-xs px-2 py-0.5 rounded-full border transition-colors capitalize"
                  style={{
                    borderColor: filterType === t ? '#2d5a27' : '#e0dbd4',
                    backgroundColor: filterType === t ? '#d4e8d0' : '#faf8f4',
                    color: filterType === t ? '#2d5a27' : '#6b6560',
                    fontWeight: filterType === t ? 600 : 400,
                  }}
                >
                  {t === 'all' ? `All (${accounts.length})` : `${t} (${counts[t] ?? 0})`}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setAddingRow(true); setActiveTemplate(null) }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0"
              style={{ borderColor: '#2d5a27', color: '#2d5a27', backgroundColor: '#faf8f4' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d4e8d0' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
            >
              <PlusIcon /> Add Account
            </button>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e0dbd4' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: '#f5f0ea' }}>
                  <th className="px-3 py-2 text-left font-medium w-20" style={{ color: '#6b6560' }}>Code</th>
                  <th className="px-3 py-2 text-left font-medium" style={{ color: '#6b6560' }}>Name</th>
                  <th className="px-3 py-2 text-left font-medium w-24" style={{ color: '#6b6560' }}>Type</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {visible.map((account, i) => (
                  <tr
                    key={account.code}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#faf8f4' : '#f5f0ea',
                      borderTop: '1px solid #e0dbd4',
                    }}
                  >
                    <td className="px-3 py-2 font-mono" style={{ color: '#1a1714' }}>{account.code}</td>
                    <td className="px-3 py-2" style={{ color: '#1a1714' }}>{account.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className="px-1.5 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: TYPE_STYLES[account.type].bg,
                          color: TYPE_STYLES[account.type].text,
                        }}
                      >
                        {account.type}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => handleDelete(account.code)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${account.name}`}
                        title="Remove"
                        style={{ color: '#a09a94' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#991b1b'; e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#a09a94'; e.currentTarget.style.opacity = '' }}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add row inline form */}
                {addingRow && (
                  <tr style={{ backgroundColor: '#f0ece4', borderTop: '1px solid #e0dbd4' }}>
                    <td className="px-2 py-1.5">
                      <input
                        autoFocus
                        placeholder="1010"
                        value={newRow.code}
                        onChange={(e) => setNewRow((r) => ({ ...r, code: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#2d5a27]"
                        style={{ borderColor: '#e0dbd4', backgroundColor: '#fff' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRowCommit()}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        placeholder="Account name"
                        value={newRow.name}
                        onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2d5a27]"
                        style={{ borderColor: '#e0dbd4', backgroundColor: '#fff' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRowCommit()}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={newRow.type}
                        onChange={(e) => setNewRow((r) => ({ ...r, type: e.target.value as ChartOfAccounts['type'] }))}
                        className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2d5a27] capitalize"
                        style={{ borderColor: '#e0dbd4', backgroundColor: '#fff' }}
                      >
                        {TYPE_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={handleAddRowCommit}
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: '#2d5a27' }}
                        >
                          Add
                        </button>
                        <button
                          onClick={handleAddRowCancel}
                          className="px-2 py-1 rounded text-xs border"
                          style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {visible.length === 0 && !addingRow && (
              <p className="text-xs text-center py-6" style={{ color: '#a09a94' }}>
                No accounts match this filter.
              </p>
            )}
          </div>

          {newRowError && (
            <p className="text-xs mt-1.5" style={{ color: '#991b1b' }}>{newRowError}</p>
          )}
        </div>
      )}

      {/* Continue */}
      <button
        onClick={() => onContinue(accounts)}
        disabled={accounts.length === 0}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#2d5a27' }}
        onMouseEnter={(e) => { if (accounts.length > 0) e.currentTarget.style.opacity = '0.9' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        Use these {accounts.length} accounts →
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UploadCsvIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 9V3M7 3L4.5 5.5M7 3L9.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3.5h9M5 3.5V2.5h3v1M10 3.5l-.6 7a.5.5 0 01-.5.5H4.1a.5.5 0 01-.5-.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
