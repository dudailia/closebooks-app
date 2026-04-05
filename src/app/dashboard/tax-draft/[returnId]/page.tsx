'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import TaxReturnForm from '@/components/tax-draft/TaxReturnForm'
import AnnotationPopover from '@/components/tax-draft/AnnotationPopover'
import OpportunitySummary from '@/components/tax-draft/OpportunitySummary'
import ExportModalFull from '@/components/tax-draft/ExportModal'
import {
  SMITH_CONSTRUCTION_RETURN,
  type DemoReturn,
  type ReturnLine,
  type TaxOpportunity,
} from '@/lib/tax-draft/demoReturnData'

const STATUS_CONFIG = {
  draft:    { label: 'Draft',        bg: '#fef3c7', color: '#92400e' },
  review:   { label: 'Under Review', bg: '#dbeafe', color: '#1e40af' },
  approved: { label: 'Approved',     bg: '#dcfce7', color: '#166534' },
  exported: { label: 'Exported',     bg: '#f3e8ff', color: '#6b21a8' },
}

// ─── Animated number hook ──────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TaxDraftViewerPage() {
  const { returnId } = useParams<{ returnId: string }>()
  const [activeSection, setActiveSection] = useState('income')
  const [selectedLine, setSelectedLine] = useState<ReturnLine | null>(null)
  const [rightPanel, setRightPanel] = useState<'opportunities' | 'annotation'>('opportunities')
  const [showExport, setShowExport] = useState(false)
  const [opportunities, setOpportunities] = useState<TaxOpportunity[]>(
    SMITH_CONSTRUCTION_RETURN.opportunities
  )
  const [reviewedLines, setReviewedLines] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Use demo data for all IDs
  const data: DemoReturn = SMITH_CONSTRUCTION_RETURN

  const totalOpps = opportunities.filter(o => o.status !== 'dismissed').length
  const activeSavings = opportunities
    .filter(o => o.status !== 'dismissed')
    .reduce((s, o) => s + o.estimatedSavings, 0)

  const animatedSavings = useCountUp(activeSavings, 1200)

  function handleLineSelect(lineId: string) {
    const line = data.sections.flatMap(s => s.lines).find(l => l.id === lineId) ?? null
    setSelectedLine(line)
    if (line) setRightPanel('annotation')
  }

  function handleAcceptOpp(id: string) {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted' } : o))
  }

  function handleDismissOpp(id: string) {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'dismissed' } : o))
  }

  function handleMarkReviewed() {
    if (selectedLine) {
      setReviewedLines(prev => new Set([...prev, selectedLine.id]))
    }
  }

  function handleOverride(_newVal: number, _note: string) {
    if (selectedLine) {
      setReviewedLines(prev => new Set([...prev, selectedLine.id]))
      setSelectedLine(null)
    }
  }

  function scrollToSection(id: string) {
    setActiveSection(id)
    if (id === 'opportunities') {
      setRightPanel('opportunities')
      setSelectedLine(null)
      return
    }
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const totalLines = data.sections.reduce((s, sec) => s + sec.lines.length, 0)
  const reviewedCount = reviewedLines.size

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <DashboardNav />

      {/* Top header */}
      <div style={{ borderBottom: '1px solid #e8e0d4', backgroundColor: '#fff', padding: '0 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/dashboard/tax-draft" style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none' }}>← All Returns</Link>
            <div style={{ width: 1, height: 20, backgroundColor: '#e8e0d4' }} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1714' }}>{data.client}</span>
              <span style={{ fontSize: 13, color: '#6b6560', marginLeft: 8 }}>Form {data.formType} · {data.taxYear}</span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              backgroundColor: STATUS_CONFIG.draft.bg, color: STATUS_CONFIG.draft.color,
            }}>Draft</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Opportunities badge */}
            <div
              style={{
                padding: '6px 14px', borderRadius: 20, backgroundColor: '#fef3c7',
                color: '#92400e', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                animation: 'pulse 2s infinite',
              }}
              onClick={() => scrollToSection('opportunities')}
            >
              ✦ {totalOpps} opportunities · ${animatedSavings.toLocaleString()} savings
            </div>
            <button
              onClick={() => setShowExport(true)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >Export ↓</button>
            <Link
              href={`/dashboard/tax-draft/${returnId}/review`}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid #e8e0d4',
                backgroundColor: '#fff', color: '#1a1714', fontSize: 13, fontWeight: 500,
                textDecoration: 'none',
              }}
            >Review Mode →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 0 }}>

        {/* Left sidebar: section nav */}
        <div style={{
          width: 200, flexShrink: 0, borderRight: '1px solid #e8e0d4',
          padding: '24px 0', position: 'sticky', top: 0, height: 'calc(100vh - 57px)', overflowY: 'auto',
        }}>
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#a09a94', textTransform: 'uppercase' }}>Sections</div>
          </div>
          {data.sections.map(sec => {
            const opps = sec.lines.filter(l => l.opportunity).length
            const reviews = sec.lines.filter(l => l.needsReview).length
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px',
                  border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                  borderRight: isActive ? '3px solid #2d5a27' : '3px solid transparent',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#2d5a27' : '#1a1714' }}>{sec.name}</div>
                <div style={{ fontSize: 11, color: '#a09a94', marginTop: 1 }}>
                  {sec.lines.length} lines
                  {opps > 0 && <span style={{ color: '#f59e0b', marginLeft: 4 }}>✦ {opps}</span>}
                  {reviews > 0 && <span style={{ color: '#ef4444', marginLeft: 4 }}>⚠ {reviews}</span>}
                </div>
              </button>
            )
          })}

          {/* Opportunities special section */}
          <button
            onClick={() => scrollToSection('opportunities')}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px',
              border: 'none', cursor: 'pointer', marginTop: 8,
              backgroundColor: activeSection === 'opportunities' ? '#fffbeb' : 'transparent',
              borderRight: activeSection === 'opportunities' ? '3px solid #f59e0b' : '3px solid transparent',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: activeSection === 'opportunities' ? 600 : 400, color: '#92400e' }}>
              ✦ Opportunities
            </div>
            <div style={{ fontSize: 11, color: '#a09a94', marginTop: 1 }}>{totalOpps} active · ${activeSavings.toLocaleString()}</div>
          </button>

          {/* Review progress */}
          <div style={{ padding: '16px 16px 0', marginTop: 12, borderTop: '1px solid #e8e0d4' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#a09a94', textTransform: 'uppercase', marginBottom: 8 }}>Review Progress</div>
            <div style={{ fontSize: 12, color: '#6b6560', marginBottom: 6 }}>{reviewedCount} / {totalLines} lines</div>
            <div style={{ height: 4, backgroundColor: '#e8e0d4', borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2, backgroundColor: '#2d5a27',
                width: `${totalLines > 0 ? (reviewedCount / totalLines) * 100 : 0}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        </div>

        {/* Center: form */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', minWidth: 0 }}>
          {/* EIN + taxpayer info bar */}
          <div style={{
            backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 10,
            padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 32, fontSize: 12, color: '#6b6560',
          }}>
            <span>Taxpayer: <strong style={{ color: '#1a1714' }}>{data.client}</strong></span>
            <span>EIN: <strong style={{ color: '#1a1714' }}>{data.ein}</strong></span>
            <span>Tax Year: <strong style={{ color: '#1a1714' }}>{data.taxYear}</strong></span>
            <span>Form: <strong style={{ color: '#1a1714' }}>{data.formType}</strong></span>
            <span style={{ marginLeft: 'auto', color: '#a09a94' }}>
              AI drafted · {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* Tax year-over-year summary */}
          <div style={{
            backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 10,
            padding: '12px 20px', marginBottom: 20,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          }}>
            {[
              { label: 'Total Tax Liability', value: data.totalTaxLiability, prior: data.priorYearLiability },
              { label: 'YoY Change', value: data.totalTaxLiability - data.priorYearLiability, isChange: true },
              { label: 'Potential Savings', value: data.totalOpportunitySavings, isSavings: true },
            ].map((m, i) => {
              const fmtVal = '$' + Math.abs(m.value).toLocaleString()
              const change = m.prior ? ((m.value - m.prior) / m.prior * 100).toFixed(1) : null
              return (
                <div key={i} style={{ textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}>
                  <div style={{ fontSize: 11, color: '#6b6560' }}>{m.label}</div>
                  <div style={{
                    fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: m.isSavings ? '#2d5a27' : m.isChange && m.value > 0 ? '#ef4444' : '#1a1714',
                  }}>
                    {m.isChange && m.value > 0 ? '+' : ''}{fmtVal}
                  </div>
                  {change && <div style={{ fontSize: 11, color: '#6b6560' }}>vs prior year</div>}
                </div>
              )
            })}
          </div>

          {/* Return form */}
          <div ref={el => { sectionRefs.current['form-top'] = el }}>
            {data.sections.map(sec => (
              <div
                key={sec.id}
                ref={el => { sectionRefs.current[sec.id] = el }}
                style={{ marginBottom: 4 }}
              >
                <TaxReturnForm
                  sections={[sec]}
                  onLineSelect={handleLineSelect}
                  selectedLineId={selectedLine?.id}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          width: 320, flexShrink: 0, borderLeft: '1px solid #e8e0d4',
          position: 'sticky', top: 0, height: 'calc(100vh - 57px)', overflowY: 'auto',
          backgroundColor: '#fff',
        }}>
          {/* Panel toggle */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e8e0d4' }}>
            <button
              onClick={() => setRightPanel('opportunities')}
              style={{
                flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                backgroundColor: rightPanel === 'opportunities' ? '#fff' : '#faf8f4',
                color: rightPanel === 'opportunities' ? '#1a1714' : '#6b6560',
                borderBottom: rightPanel === 'opportunities' ? '2px solid #f59e0b' : '2px solid transparent',
              }}
            >✦ Opportunities</button>
            <button
              onClick={() => setRightPanel('annotation')}
              style={{
                flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                backgroundColor: rightPanel === 'annotation' ? '#fff' : '#faf8f4',
                color: rightPanel === 'annotation' ? '#1a1714' : '#6b6560',
                borderBottom: rightPanel === 'annotation' ? '2px solid #b8734a' : '2px solid transparent',
              }}
            >? AI Notes</button>
          </div>

          <div style={{ padding: 16 }}>
            {rightPanel === 'opportunities' ? (
              <OpportunitySummary
                opportunities={opportunities}
                onAccept={handleAcceptOpp}
                onDismiss={handleDismissOpp}
              />
            ) : selectedLine ? (
              <AnnotationPopover
                lineNumber={selectedLine.lineNumber}
                lineDescription={selectedLine.description}
                reasoning={selectedLine.reasoning}
                confidence={selectedLine.confidence}
                lawReference={selectedLine.lawReference}
                opportunity={selectedLine.opportunity}
                opportunityValue={selectedLine.opportunityValue}
                onMarkReviewed={handleMarkReviewed}
                onOverride={handleOverride}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#a09a94' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>?</div>
                <div style={{ fontSize: 13 }}>Click any line in the return to see AI reasoning and annotations.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExport && (
        <ExportModalFull
          returnId={returnId ?? 'smith-2024'}
          clientName={data.client}
          formType={data.formType}
          taxYear={data.taxYear}
          onClose={() => setShowExport(false)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.85 }
        }
      `}</style>

      <AppFooter />
    </div>
  )
}
