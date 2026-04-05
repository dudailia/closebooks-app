'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DocumentChecklist from '@/components/DocumentChecklist'
import AuditRiskBadge from '@/components/AuditRiskBadge'
import type { ChecklistItem } from '@/components/DocumentChecklist'

// ─── Demo data ────────────────────────────────────────────────────────────────

interface AuditDetail {
  id: string
  client: string
  auditType: string
  auditTypeCode: string
  taxYear: number
  responseDueDays: number
  noticeDate: string
  issuesRaised: string[]
  amountInQuestion: number
  irsProposedTax: number
  status: 'in-progress' | 'pending' | 'closed'
  noticeNumber: string
  revenue: number
  entityType: string
  industry: string
}

const AUDIT_DETAILS: Record<string, AuditDetail> = {
  'audit-001': {
    id: 'audit-001',
    client: 'Miller Construction LLC',
    auditType: 'CP2000 — Underreported Income',
    auditTypeCode: 'CP2000',
    taxYear: 2022,
    responseDueDays: 45,
    noticeDate: '2024-11-15',
    noticeNumber: 'CP2000-2024-881234',
    issuesRaised: [
      'Third-party 1099-NEC forms show $47,200 more income than reported on Form 1120-S',
      'Income from Northside General Contractors ($28,400) not reflected in gross receipts',
      'Income from Summit Property Development ($18,800) not reflected in gross receipts',
      'Proposed additional tax: $12,392 plus penalties and interest',
    ],
    amountInQuestion: 47200,
    irsProposedTax: 12392,
    status: 'in-progress',
    revenue: 850000,
    entityType: 'S-Corporation',
    industry: 'Construction',
  },
}

function getAudit(id: string): AuditDetail {
  return AUDIT_DETAILS[id] ?? AUDIT_DETAILS['audit-001']
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { name: 'Bank statements (12 months)', status: 'available', description: 'All business checking and savings accounts' },
  { name: 'Transaction categorization report', status: 'available', description: 'Full ledger export for tax year 2022' },
  { name: 'Journal entries', status: 'available', description: 'General journal — all entries 2022' },
  { name: 'Source documents (receipts/invoices)', status: 'available', description: 'Scanned and organized by category' },
  { name: 'Tax return (Form 1120-S)', status: 'available', description: 'Original 2022 S-Corporation return' },
  { name: 'W-2s and 1099s received', status: 'available', description: 'All income-reporting documents received in 2022' },
  { name: 'Payroll records (941s)', status: 'available', description: 'Quarterly payroll filings and W-2s issued' },
  { name: 'Contracts — Northside General', status: 'available', description: 'Subcontractor agreement and project invoices' },
  { name: 'Contracts — Summit Property Dev', status: 'available', description: 'Service agreement and completion invoices' },
  { name: 'Depreciation schedule', status: 'missing', description: 'Asset list with cost basis and accumulated depreciation' },
  { name: 'Vehicle mileage log', status: 'missing', description: 'Business use log for 3 company vehicles' },
  { name: 'Income reconciliation worksheet', status: 'missing', description: 'Reconciling 1099s received to gross receipts reported' },
]

// ─── Panel components ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1714', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '13px', color: '#6b6560', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params?.auditId as string
  const audit = getAudit(auditId)

  const [docs, setDocs] = useState<ChecklistItem[]>(CHECKLIST_ITEMS)
  const [generating, setGenerating] = useState(false)
  const [generatedLetter, setGeneratedLetter] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState<{
    defenseStrategy: string
    requiredDocuments: string[]
    resolutionTimeline: string
    fullResponse: string
  } | null>(null)
  const [generatingPackage, setGeneratingPackage] = useState(false)
  const [packageGenerated, setPackageGenerated] = useState(false)
  const [apiError, setApiError] = useState('')

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const available = docs.filter(d => d.status === 'available').length
  const completeness = Math.round((available / docs.length) * 100)

  function handleUpload(itemName: string) {
    setDocs(prev =>
      prev.map(d => d.name === itemName ? { ...d, status: 'uploading' as const } : d)
    )
    setTimeout(() => {
      setDocs(prev =>
        prev.map(d => d.name === itemName ? { ...d, status: 'available' as const } : d)
      )
    }, 2000)
  }

  async function handleGenerateLetter() {
    setGenerating(true)
    setApiError('')
    try {
      const res = await fetch('/api/audit-defense/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditType: audit.auditTypeCode,
          taxYear: audit.taxYear,
          issuesRaised: audit.issuesRaised.join('\n'),
          clientData: {
            name: audit.client,
            industry: audit.industry,
            entityType: audit.entityType,
            revenue: audit.revenue,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAiAnalysis(data.analysis)
        // Use the generated letter if available, or the full response
        const letter = data.analysis.responseLetter || data.analysis.fullResponse
        setGeneratedLetter(letter)
      } else {
        setApiError(data.error || 'Failed to generate response')
        // Fall back to demo letter
        setGeneratedLetter(DEMO_LETTER.replace('[CLIENT]', audit.client).replace('[YEAR]', audit.taxYear.toString()).replace('[AMOUNT]', fmt(audit.amountInQuestion)))
      }
    } catch {
      setApiError('Network error — using demo response')
      setGeneratedLetter(DEMO_LETTER.replace('[CLIENT]', audit.client).replace('[YEAR]', audit.taxYear.toString()).replace('[AMOUNT]', fmt(audit.amountInQuestion)))
    } finally {
      setGenerating(false)
    }
  }

  async function handleGeneratePackage() {
    setGeneratingPackage(true)
    try {
      const res = await fetch('/api/audit-defense/generate-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: audit.id,
          auditType: audit.auditTypeCode,
          taxYear: audit.taxYear,
          clientName: audit.client,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPackageGenerated(true)
      }
    } catch {
      setPackageGenerated(true) // Still show success in demo
    } finally {
      setGeneratingPackage(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px' }}>
        <button
          onClick={() => router.push('/dashboard/audit-defense')}
          style={{ color: '#b8734a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >
          Audit Defense
        </button>
        <span style={{ color: '#c0bbb5' }}>›</span>
        <span style={{ color: '#6b6560' }}>{audit.client}</span>
      </div>

      {/* Page header */}
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1714', margin: 0 }}>
            {audit.client}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#b8734a' }}>{audit.auditType}</span>
            <span style={{ color: '#e8e0d4' }}>·</span>
            <span style={{ fontSize: '14px', color: '#6b6560' }}>Tax Year {audit.taxYear}</span>
            <span style={{ color: '#e8e0d4' }}>·</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>
              {audit.responseDueDays} days to respond
            </span>
          </div>
        </div>
        <button
          onClick={handleGeneratePackage}
          disabled={generatingPackage}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
            backgroundColor: generatingPackage ? '#d4956e' : '#b8734a',
            color: '#ffffff', border: 'none', cursor: generatingPackage ? 'not-allowed' : 'pointer',
          }}
        >
          {packageGenerated ? '✓ Package Ready' : generatingPackage ? 'Assembling…' : 'Generate Response Package'}
        </button>
      </div>

      {/* Success banner */}
      {packageGenerated && (
        <div
          style={{
            backgroundColor: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '10px', padding: '12px 18px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontWeight: 600, color: '#15803d' }}>Response package assembled.</span>
          <span style={{ color: '#166534' }}>{available} of {docs.length} documents ready. 3 documents still need attention.</span>
        </div>
      )}

      {/* Three-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '24px' }}>
        {/* LEFT: Audit details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#ffffff', borderRadius: '14px',
              padding: '20px', border: '1px solid #e8e0d4',
            }}
          >
            <SectionHeader title="Audit Details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Notice Type', value: audit.auditTypeCode },
                { label: 'Notice Number', value: audit.noticeNumber },
                { label: 'Tax Year', value: audit.taxYear.toString() },
                { label: 'Notice Date', value: audit.noticeDate },
                { label: 'Amount in Question', value: fmt(audit.amountInQuestion) },
                { label: 'Proposed Tax Due', value: fmt(audit.irsProposedTax) },
                { label: 'Entity Type', value: audit.entityType },
                { label: 'Days to Respond', value: `${audit.responseDueDays} days` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1714' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues raised */}
          <div
            style={{
              backgroundColor: '#fef2f2', borderRadius: '14px',
              padding: '20px', border: '1px solid #fca5a5',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b', marginBottom: '12px' }}>
              Issues Raised by IRS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {audit.issuesRaised.map((issue, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: 1.5 }}>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Response package builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Document checklist */}
          <div
            style={{
              backgroundColor: '#ffffff', borderRadius: '14px',
              padding: '24px', border: '1px solid #e8e0d4',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <SectionHeader
                title="Response Package"
                subtitle={`${available} of ${docs.length} documents ready`}
              />
              <AuditRiskBadge risk="high" showBar score={completeness} />
            </div>
            <DocumentChecklist items={docs} onUpload={handleUpload} />
          </div>

          {/* Response letter */}
          <div
            style={{
              backgroundColor: '#ffffff', borderRadius: '14px',
              padding: '24px', border: '1px solid #e8e0d4',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <SectionHeader
                title="IRS Response Letter"
                subtitle="AI-generated professional response citing applicable IRC sections"
              />
              <button
                onClick={handleGenerateLetter}
                disabled={generating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '9px', fontWeight: 700, fontSize: '13px',
                  backgroundColor: generating ? '#d4956e' : '#b8734a',
                  color: '#ffffff', border: 'none',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {generating ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Generating…
                  </>
                ) : generatedLetter ? 'Regenerate Letter' : 'Generate Response Letter'}
              </button>
            </div>

            {apiError && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fef9c3', color: '#92400e', fontSize: '12px', marginBottom: '12px' }}>
                {apiError}
              </div>
            )}

            {generatedLetter ? (
              <textarea
                value={generatedLetter}
                onChange={(e) => setGeneratedLetter(e.target.value)}
                style={{
                  width: '100%', minHeight: '400px', padding: '16px',
                  borderRadius: '10px', border: '1px solid #e8e0d4',
                  fontSize: '13px', lineHeight: 1.7, color: '#1a1714',
                  fontFamily: '"Georgia", serif', resize: 'vertical',
                  backgroundColor: '#faf8f4', outline: 'none', boxSizing: 'border-box',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '48px 24px', borderRadius: '10px',
                  border: '2px dashed #e8e0d4', textAlign: 'center',
                  color: '#6b6560', fontSize: '14px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✍️</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>No letter generated yet</div>
                <div style={{ fontSize: '13px' }}>Click "Generate Response Letter" to create a professional IRS response</div>
              </div>
            )}

            {generatedLetter && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  style={{
                    flex: 1, padding: '9px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                    border: '1px solid #e8e0d4', color: '#6b6560',
                    backgroundColor: 'transparent', cursor: 'pointer',
                  }}
                >
                  Copy Letter
                </button>
                <button
                  style={{
                    flex: 1, padding: '9px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                    backgroundColor: '#2d5a27', color: '#ffffff',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: AI analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#ffffff', borderRadius: '14px',
              padding: '20px', border: '1px solid #e8e0d4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #b8734a, #d4956e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1714', margin: 0 }}>
                AI Audit Analysis
              </h2>
            </div>

            {aiAnalysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {aiAnalysis.defenseStrategy && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#b8734a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Defense Strategy
                    </h4>
                    <p style={{ fontSize: '12px', color: '#44413d', lineHeight: 1.7, margin: 0 }}>
                      {aiAnalysis.defenseStrategy.substring(0, 400)}
                      {aiAnalysis.defenseStrategy.length > 400 && '…'}
                    </p>
                  </div>
                )}

                {aiAnalysis.requiredDocuments.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#b8734a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Key Documents Needed
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {aiAnalysis.requiredDocuments.slice(0, 6).map((doc, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#b8734a', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>›</span>
                          <span style={{ fontSize: '12px', color: '#44413d' }}>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.resolutionTimeline && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#b8734a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Estimated Timeline
                    </h4>
                    <p style={{ fontSize: '12px', color: '#44413d', lineHeight: 1.6, margin: 0 }}>
                      {aiAnalysis.resolutionTimeline.substring(0, 200)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: '#6b6560', lineHeight: 1.7, marginBottom: '12px' }}>
                  Generate the response letter to see AI-powered audit analysis, defense positions, and recommended next steps.
                </div>

                {/* Static pre-analysis */}
                <div
                  style={{
                    backgroundColor: '#fffbeb', borderRadius: '10px', padding: '14px',
                    border: '1px solid #fde68a',
                  }}
                >
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                    Initial Risk Assessment
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      'CP2000 — typically favorable resolution if income can be explained',
                      'Documentation appears sufficient for 2 of 3 income sources',
                      'Missing reconciliation worksheet is the critical gap',
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#d97706', fontSize: '12px', flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div
            style={{
              backgroundColor: '#ffffff', borderRadius: '14px',
              padding: '20px', border: '1px solid #e8e0d4',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1714', marginBottom: '14px' }}>
              Response Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { date: '2024-11-15', label: 'IRS notice received', done: true },
                { date: '2024-11-22', label: 'Initial review complete', done: true },
                { date: '2024-12-01', label: 'Document collection', done: false, active: true },
                { date: '2024-12-15', label: 'Response letter drafted', done: false },
                { date: '2024-12-30', label: 'Response submitted to IRS', done: false },
              ].map((step, idx, arr) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: step.done ? '#dcfce7' : step.active ? '#fef9c3' : '#f0ede8',
                        border: `2px solid ${step.done ? '#22c55e' : step.active ? '#f59e0b' : '#e8e0d4'}`,
                        fontSize: '10px', fontWeight: 700,
                        color: step.done ? '#15803d' : step.active ? '#92400e' : '#a0a0a0',
                        flexShrink: 0,
                      }}
                    >
                      {step.done ? '✓' : step.active ? '●' : ''}
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ width: '2px', height: '24px', backgroundColor: step.done ? '#22c55e' : '#e8e0d4' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: idx < arr.length - 1 ? '8px' : '0', paddingTop: '2px' }}>
                    <div style={{ fontSize: '12px', fontWeight: step.active ? 700 : 600, color: step.active ? '#92400e' : step.done ? '#15803d' : '#6b6560' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a0a0a0', marginTop: '1px' }}>{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Demo fallback letter ─────────────────────────────────────────────────────

const DEMO_LETTER = `[CLIENT]
[Address Line 1]
Austin, TX 78701

[Date]

Internal Revenue Service
Automated Underreporter Unit
[IRS Address from Notice]

Re: Response to CP2000 Notice — Tax Year [YEAR]
    Notice Number: CP2000-2024-881234
    Taxpayer: [CLIENT]

Dear IRS Examiner:

We write on behalf of [CLIENT] (the "Taxpayer") in response to the CP2000 notice dated November 15, 2024, proposing additional tax of $12,392 for the tax year [YEAR]. The Taxpayer respectfully disagrees with the proposed adjustments and submits this response pursuant to IRC § 6212 and Rev. Proc. 2016-22.

EXPLANATION OF DISCREPANCY

The IRS notice references third-party information returns (1099-NEC forms) totaling [AMOUNT] that were not reflected in the Taxpayer's reported gross receipts. Upon thorough review of the Taxpayer's records, we have identified the source of this discrepancy.

The income reported by Northside General Contractors ($28,400) and Summit Property Development ($18,800) was received and deposited into the business operating account. However, due to a timing difference in the Taxpayer's accounting system cutover from cash-basis to accrual-basis recognition under IRC § 446, these amounts were allocated to cost-of-goods reconciliation entries rather than gross receipts. This is a presentation error, not an omission of income.

The Taxpayer's total economic income for tax year [YEAR] is consistent with the amounts reported by third parties. We are providing complete bank records, deposit slips, and reconciliation worksheets demonstrating that all [AMOUNT] was properly captured in taxable income.

SUPPORTING DOCUMENTATION ENCLOSED

Please find the following documents enclosed:
1. Bank statements for all business accounts (January–December [YEAR])
2. Complete transaction categorization report
3. Income reconciliation worksheet reconciling 1099-NEC amounts to gross receipts
4. Copies of contracts with Northside General Contractors and Summit Property Development
5. Form 1120-S original filing with all schedules

CONCLUSION

Based on the foregoing, the Taxpayer respectfully requests that the IRS accept this explanation and close the CP2000 examination with no additional tax assessment. Should you require any additional information, please contact our office at your earliest convenience.

Respectfully submitted,

[Preparer Name], CPA
CloseBooks Advisory LLC
(512) 555-0100`
