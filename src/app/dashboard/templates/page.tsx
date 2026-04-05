'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface EmailTemplate {
  id: string
  name: string
  category: string
  categoryColor: string
  description: string
  subject: string
  body: string
  placeholders: string[]
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: 'document-request',
    name: 'Document Request',
    category: 'Kickoff',
    categoryColor: '#2d5a27',
    description: 'Ask your client to upload bank statements and supporting documents for the month-end close.',
    subject: 'Document Request — [Month] Month-End Close',
    body: `Hi [Client Name],

I hope you're doing well. I'm reaching out to request the documents needed for your [Month] month-end close.

Please send over the following at your earliest convenience:

  • Bank statements for all accounts (checking, savings, credit cards)
  • Receipts for expenses over $100
  • Payroll summaries for the period
  • Any vendor invoices or bills received during [Month]

Documents are due by [Due Date]. Sending them promptly allows us to close your books on time and deliver your financial statements without delay.

If you have any questions or need to schedule a call, please don't hesitate to reach out.

Warm regards,
[Firm Name]`,
    placeholders: ['Client Name', 'Month', 'Due Date', 'Firm Name'],
  },
  {
    id: 'close-complete',
    name: 'Close Complete',
    category: 'Delivery',
    categoryColor: '#b8734a',
    description: 'Notify your client that their books are closed and financial statements are ready for review.',
    subject: '[Month] Books Are Closed — Financial Statements Ready',
    body: `Hi [Client Name],

Great news — your [Month] books are officially closed!

Here's a summary of what was completed this cycle:

  ✓ All transactions categorized and reviewed
  ✓ Bank accounts reconciled
  ✓ Financial statements prepared

Your reports are attached to this email. Please take a moment to review the Profit & Loss and Balance Sheet. If anything looks off or you have questions about specific line items, just reply to this email and we'll walk you through it.

We'll reach out again when we're ready to start the next close.

Best regards,
[Firm Name]`,
    placeholders: ['Client Name', 'Month', 'Firm Name'],
  },
  {
    id: 'missing-documents',
    name: 'Missing Documents',
    category: 'Follow-up',
    categoryColor: '#dc2626',
    description: 'Follow up with your client about missing receipts or statements needed to complete the close.',
    subject: 'Action Needed — Missing Documents for [Month] Close',
    body: `Hi [Client Name],

I wanted to follow up on the [Month] month-end close. We're making good progress, but we're still missing a few documents needed to finalize your books:

  • Bank statement for [Account / Period]
  • Receipt(s) for [Description]
  • [Any other missing item]

Without these, we won't be able to categorize those transactions accurately, which may affect the reliability of your financial statements.

Could you please send these over by [Due Date]? If you're having trouble locating anything, just let me know and we can work through it together.

Thank you for your prompt attention to this.

Best,
[Firm Name]`,
    placeholders: ['Client Name', 'Month', 'Due Date', 'Firm Name'],
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    category: 'Advisory',
    categoryColor: '#7c3aed',
    description: 'Invite your client to review their quarterly financials and discuss performance trends.',
    subject: 'Your [Month] Quarterly Financial Review Is Ready',
    body: `Hi [Client Name],

It's time for your quarterly financial review — and there's a lot to discuss!

We've completed the [Month] close and put together a summary of your key numbers. Here's what we'll cover:

  • Revenue and expense trends vs. prior quarter
  • Cash flow analysis and working capital position
  • Year-to-date performance vs. plan
  • Tax planning items to keep on your radar

I'd love to schedule a 30-minute call to walk through the highlights together. These conversations often surface opportunities or issues that are easy to miss when you're heads-down running the business.

Please reply with your availability or use the link below to book a time directly.

Looking forward to connecting,
[Firm Name]`,
    placeholders: ['Client Name', 'Month', 'Firm Name'],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\[([^\]]+)\]/g, (match, key) => values[key] || match)
}

function buildMailto(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// ---------------------------------------------------------------------------
// Category badge
// ---------------------------------------------------------------------------

function CategoryBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: color + '18',
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Template card (sidebar)
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  active,
  onClick,
}: {
  template: EmailTemplate
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 transition-all"
      style={{
        borderColor: active ? template.categoryColor : '#e8e0d4',
        backgroundColor: active ? template.categoryColor + '08' : '#ffffff',
        boxShadow: active ? `0 0 0 1px ${template.categoryColor}30` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = '#c4bdb8'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = '#e8e0d4'
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className="text-sm font-semibold leading-snug"
          style={{ color: active ? '#1a1714' : '#1a1714' }}
        >
          {template.name}
        </span>
        <CategoryBadge label={template.category} color={template.categoryColor} />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#6b6560' }}>
        {template.description}
      </p>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Email preview — styled to look like a real email
// ---------------------------------------------------------------------------

function EmailPreview({
  subject,
  body,
  values,
}: {
  subject: string
  body: string
  values: Record<string, string>
}) {
  const filledSubject = fillTemplate(subject, values)
  const filledBody    = fillTemplate(body, values)

  // Highlight unfilled placeholders vs filled text
  function renderBody(text: string) {
    const parts = text.split(/(\[[^\]]+\])/g)
    return parts.map((part, i) => {
      if (/^\[[^\]]+\]$/.test(part)) {
        return (
          <mark
            key={i}
            style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: 3,
              padding: '1px 3px',
              fontStyle: 'italic',
            }}
          >
            {part}
          </mark>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
    >
      {/* Email chrome header */}
      <div
        className="px-5 py-4 border-b"
        style={{ backgroundColor: '#f8f6f2', borderColor: '#e8e0d4' }}
      >
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-medium w-16 shrink-0 text-right" style={{ color: '#a09a94' }}>To</span>
            <span
              className="text-sm px-2 py-0.5 rounded-md"
              style={{ backgroundColor: '#fdf2e9', color: '#b8734a', fontWeight: 500 }}
            >
              {values['Client Name'] ? `${values['Client Name']}` : '[Client Name]'}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-medium w-16 shrink-0 text-right" style={{ color: '#a09a94' }}>From</span>
            <span className="text-sm" style={{ color: '#6b6560' }}>
              {values['Firm Name'] || '[Firm Name]'}
            </span>
          </div>
          <div className="flex items-baseline gap-3 pt-1" style={{ borderTop: '1px solid #f0ece4' }}>
            <span className="text-xs font-medium w-16 shrink-0 text-right" style={{ color: '#a09a94' }}>Subject</span>
            <span className="text-sm font-semibold leading-snug" style={{ color: '#1a1714' }}>
              {renderBody(filledSubject)}
            </span>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="px-7 py-6">
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: '#1a1714', fontFamily: "'Georgia', serif" }}
        >
          {renderBody(filledBody)}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fill-in form
// ---------------------------------------------------------------------------

function FillForm({
  placeholders,
  values,
  onChange,
}: {
  placeholders: string[]
  values: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  const PLACEHOLDER_META: Record<string, { label: string; hint: string; placeholder: string }> = {
    'Client Name': { label: 'Client Name',  hint: 'Business or contact name',  placeholder: 'e.g. Maple Street Café' },
    'Month':       { label: 'Month / Period', hint: 'Month or quarter covered',   placeholder: 'e.g. March 2026'         },
    'Firm Name':   { label: 'Your Firm Name', hint: 'How the email is signed',    placeholder: 'e.g. Patel & Associates' },
    'Due Date':    { label: 'Due Date',       hint: 'Deadline for documents',     placeholder: 'e.g. April 12, 2026'     },
  }

  return (
    <div className="space-y-3">
      {placeholders.map((key) => {
        const meta = PLACEHOLDER_META[key] ?? { label: key, hint: '', placeholder: `Enter ${key}` }
        return (
          <div key={key}>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#1a1714' }}>
              {meta.label}
            </label>
            {meta.hint && (
              <p className="text-xs mb-1.5" style={{ color: '#a09a94' }}>{meta.hint}</p>
            )}
            <input
              type="text"
              value={values[key] ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={meta.placeholder}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#b8734a'; e.currentTarget.style.backgroundColor = '#ffffff' }}
              onBlur={(e) =>  { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.backgroundColor = '#faf8f4' }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Copy button with feedback
// ---------------------------------------------------------------------------

function CopyButton({ text, label = 'Copy to Clipboard' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: select and copy
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
      style={{
        borderColor: copied ? '#059669' : '#e0dbd4',
        color:       copied ? '#059669' : '#1a1714',
        backgroundColor: copied ? '#ecfdf5' : '#ffffff',
      }}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l4 4 6-6" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <CopyIcon />
          {label}
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page content (uses useSearchParams — wrapped in Suspense by parent)
// ---------------------------------------------------------------------------

function TemplatesContent() {
  const searchParams = useSearchParams()
  const initTemplateId = searchParams.get('template') ?? TEMPLATES[0].id
  const initClient     = searchParams.get('client') ?? ''

  const initTemplate = TEMPLATES.find((t) => t.id === initTemplateId) ?? TEMPLATES[0]

  const [selected, setSelected] = useState<EmailTemplate>(initTemplate)
  const [values,   setValues]   = useState<Record<string, string>>({
    'Client Name': initClient,
  })

  // Reset values when template changes (keep Client Name)
  function selectTemplate(t: EmailTemplate) {
    setSelected(t)
    setValues((prev) => ({ 'Client Name': prev['Client Name'] ?? '' }))
  }

  const handleChange = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }, [])

  const filledSubject = fillTemplate(selected.subject, values)
  const filledBody    = fillTemplate(selected.body, values)
  const copyText      = `Subject: ${filledSubject}\n\n${filledBody}`
  const mailtoHref    = buildMailto(filledSubject, filledBody)

  const unfilledCount = selected.placeholders.filter((p) => !values[p]).length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-10 page-enter">

        {/* Page header */}
        <div className="mb-8">
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '1.9rem',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Email Templates
          </h1>
          <p className="text-sm mt-2" style={{ color: '#6b6560' }}>
            Professional email templates for communicating with your clients throughout the close process.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Left column — template list */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#a09a94' }}>
              Templates
            </p>
            {TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                active={selected.id === t.id}
                onClick={() => selectTemplate(t)}
              />
            ))}

            {/* Tips card */}
            <div
              className="rounded-xl border p-4 mt-4"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#fdf6f0' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: '#b8734a' }}>
                💡 Tips
              </p>
              <ul className="text-xs space-y-1.5 list-none" style={{ color: '#6b6560' }}>
                <li>Fill in the fields on the right to personalize each email before sending.</li>
                <li>Highlighted <mark style={{ backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 2, padding: '0 2px' }}>[placeholders]</mark> in the preview show what still needs to be filled in.</li>
                <li>Use "Send via Email" to open your default mail client with the template pre-loaded.</li>
              </ul>
            </div>
          </div>

          {/* Right column — editor + preview */}
          <div className="space-y-5">

            {/* Template name + category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  className="text-xl font-semibold"
                  style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714' }}
                >
                  {selected.name}
                </h2>
                <CategoryBadge label={selected.category} color={selected.categoryColor} />
              </div>
              {unfilledCount > 0 && (
                <span className="text-xs font-medium" style={{ color: '#d97706' }}>
                  {unfilledCount} field{unfilledCount !== 1 ? 's' : ''} to fill in
                </span>
              )}
            </div>

            {/* Fill-in form + preview in two columns on large screens */}
            <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-5 items-start">

              {/* Fill-in fields */}
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <p className="text-xs font-semibold mb-4 flex items-center gap-2" style={{ color: '#6b6560' }}>
                  <PencilIcon />
                  Fill in details
                </p>
                <FillForm
                  placeholders={selected.placeholders}
                  values={values}
                  onChange={handleChange}
                />
              </div>

              {/* Live preview */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#6b6560' }}>
                  <EyeIcon />
                  Preview
                </p>
                <EmailPreview
                  subject={selected.subject}
                  body={selected.body}
                  values={values}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div
              className="flex flex-wrap items-center gap-3 pt-4 border-t"
              style={{ borderColor: '#e8e0d4' }}
            >
              <CopyButton text={copyText} />

              <a
                href={mailtoHref}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                <MailIcon />
                Send via Email
              </a>

              <p className="text-xs ml-auto" style={{ color: '#a09a94' }}>
                Opens your default email client
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Page export — Suspense boundary for useSearchParams
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f4' }}>
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#e0dbd4" strokeWidth="2" />
          <path d="M10 2a8 8 0 018 8" stroke="#b8734a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    }>
      <TemplatesContent />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M1 5v8h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.3" fill="none" />
      <path d="M1 4l6 4.5L13 4" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 6.5C1 6.5 3 2.5 6.5 2.5S12 6.5 12 6.5 10 10.5 6.5 10.5 1 6.5 1 6.5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  )
}
