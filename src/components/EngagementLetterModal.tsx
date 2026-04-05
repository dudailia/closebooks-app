'use client'

import { useState } from 'react'
import type { EngagementLetter, RateCard } from '@/types/billing'
import { getEngagementLetterTemplate } from '@/lib/invoiceGenerator'

interface Props {
  clientName: string
  clientEmail?: string
  firmName: string
  rateCard: RateCard
  onSave: (letter: EngagementLetter) => void
  onClose: () => void
}

type TemplateKey = EngagementLetter['template']

const TEMPLATES: {
  key: TemplateKey
  title: string
  subtitle: string
  services: string[]
}[] = [
  {
    key: 'monthly-bookkeeping',
    title: 'Monthly Bookkeeping',
    subtitle: 'Ongoing bookkeeping and reconciliation',
    services: [
      'Monthly transaction categorization',
      'Bank and credit card reconciliation',
      'Monthly financial reports (P&L, Balance Sheet)',
      'Accounts payable / receivable tracking',
    ],
  },
  {
    key: 'tax-prep',
    title: 'Tax Preparation',
    subtitle: 'Annual tax filing and planning',
    services: [
      'Annual federal and state tax return preparation',
      'Quarterly estimated tax calculations',
      'Tax planning and optimization review',
      'IRS correspondence support',
    ],
  },
  {
    key: 'full-service',
    title: 'Full Service',
    subtitle: 'Comprehensive accounting and advisory',
    services: [
      'Monthly bookkeeping and reconciliation',
      'Quarterly financial review meetings',
      'Annual tax preparation',
      'Payroll processing support',
      'Cash flow forecasting',
      'CFO advisory services',
    ],
  },
  {
    key: 'custom',
    title: 'Custom Engagement',
    subtitle: 'Define your own scope',
    services: [],
  },
]

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function EngagementLetterModal({
  clientName,
  clientEmail,
  firmName,
  rateCard,
  onSave,
  onClose,
}: Props) {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('monthly-bookkeeping')
  const [services, setServices] = useState<string[]>(TEMPLATES[0].services)
  const [customService, setCustomService] = useState('')
  const [monthlyFee, setMonthlyFee] = useState(rateCard.monthlyRetainer || 500)
  const [startDate, setStartDate] = useState(toYMD(new Date()))
  const [endDate, setEndDate] = useState('')

  const templateDef = TEMPLATES.find((t) => t.key === selectedTemplate)!

  function selectTemplate(key: TemplateKey) {
    setSelectedTemplate(key)
    const def = TEMPLATES.find((t) => t.key === key)!
    setServices([...def.services])
  }

  function toggleService(svc: string) {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    )
  }

  function addCustomService() {
    if (!customService.trim()) return
    setServices((prev) => [...prev, customService.trim()])
    setCustomService('')
  }

  function buildLetter(status: EngagementLetter['status']): EngagementLetter {
    const termsText = getEngagementLetterTemplate(
      selectedTemplate,
      clientName,
      services,
      monthlyFee,
      startDate,
      firmName
    )
    const now = new Date().toISOString()
    return {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientName,
      clientEmail,
      createdAt: now,
      status,
      template: selectedTemplate,
      services,
      monthlyFee,
      startDate,
      endDate: endDate || undefined,
      termsText,
      firmName,
      ...(status === 'sent' ? { sentAt: now } : {}),
    }
  }

  const previewText = getEngagementLetterTemplate(
    selectedTemplate,
    clientName,
    services,
    monthlyFee,
    startDate,
    firmName
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: '#e8e0d4' }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
            >
              New Engagement Letter
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              {clientName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: s === step ? '#b8734a' : s < step ? '#fdf2e9' : '#f5f2ed',
                    color: s === step ? '#ffffff' : s < step ? '#b8734a' : '#6b6560',
                  }}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className="w-6 h-px" style={{ backgroundColor: s < step ? '#b8734a' : '#e8e0d4' }} />
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

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Template selector */}
          {step === 1 && (
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: '#1a1714' }}>Select Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.key}
                    onClick={() => selectTemplate(tmpl.key)}
                    className="text-left p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: selectedTemplate === tmpl.key ? '#b8734a' : '#e8e0d4',
                      backgroundColor: selectedTemplate === tmpl.key ? '#fdf2e9' : '#faf8f4',
                    }}
                  >
                    <p
                      className="text-sm font-semibold mb-0.5"
                      style={{ color: selectedTemplate === tmpl.key ? '#b8734a' : '#1a1714' }}
                    >
                      {tmpl.title}
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#6b6560' }}>{tmpl.subtitle}</p>
                    {tmpl.services.length > 0 && (
                      <ul className="space-y-0.5">
                        {tmpl.services.slice(0, 3).map((s) => (
                          <li key={s} className="text-xs flex items-start gap-1.5" style={{ color: '#6b6560' }}>
                            <span style={{ color: '#2d5a27', marginTop: 1 }}>✓</span>
                            {s}
                          </li>
                        ))}
                        {tmpl.services.length > 3 && (
                          <li className="text-xs" style={{ color: '#a09a94' }}>
                            +{tmpl.services.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                    {tmpl.key === 'custom' && (
                      <p className="text-xs" style={{ color: '#6b6560' }}>
                        Build your own service list
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              <h3 className="text-sm font-semibold" style={{ color: '#1a1714' }}>Configure Engagement</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                    Monthly Fee ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={25}
                    className="w-full text-sm font-mono rounded-xl border px-3 py-2"
                    style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full text-sm rounded-xl border px-3 py-2"
                    style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#6b6560' }}>
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    className="w-full text-sm rounded-xl border px-3 py-2"
                    style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: '#6b6560' }}>
                  Included Services
                </label>
                <div className="space-y-2">
                  {(templateDef.services.length > 0 ? templateDef.services : services).map((svc) => (
                    <label
                      key={svc}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={services.includes(svc)}
                        onChange={() => toggleService(svc)}
                        className="rounded"
                        style={{ accentColor: '#2d5a27' }}
                      />
                      <span className="text-sm" style={{ color: '#1a1714' }}>{svc}</span>
                    </label>
                  ))}

                  {/* Custom services added */}
                  {services
                    .filter((s) => !templateDef.services.includes(s))
                    .map((s) => (
                      <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked
                          onChange={() => toggleService(s)}
                          className="rounded"
                          style={{ accentColor: '#b8734a' }}
                        />
                        <span className="text-sm" style={{ color: '#1a1714' }}>{s}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fdf2e9', color: '#b8734a' }}>custom</span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Add custom service */}
              <div className="flex gap-2">
                <input
                  placeholder="Add custom service..."
                  className="flex-1 text-sm rounded-xl border px-3 py-2"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomService() }}
                />
                <button
                  onClick={addCustomService}
                  className="text-sm px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: '#b8734a', color: '#ffffff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a6040' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1714' }}>Letter Preview</h3>
              <div
                className="rounded-xl border p-5 text-xs font-mono whitespace-pre-wrap overflow-auto"
                style={{
                  borderColor: '#e8e0d4',
                  backgroundColor: '#faf8f4',
                  color: '#1a1714',
                  lineHeight: 1.7,
                  maxHeight: 400,
                }}
              >
                {previewText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between shrink-0"
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
                style={{ backgroundColor: '#b8734a' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a6040' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
              >
                Next
              </button>
            ) : (
              <>
                <button
                  onClick={() => onSave(buildLetter('draft'))}
                  className="text-sm px-4 py-2 rounded-xl border font-medium"
                  style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Save Draft
                </button>
                <button
                  onClick={() => onSave(buildLetter('sent'))}
                  className="text-sm px-4 py-2 rounded-xl font-medium text-white"
                  style={{ backgroundColor: '#b8734a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a6040' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
                >
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
