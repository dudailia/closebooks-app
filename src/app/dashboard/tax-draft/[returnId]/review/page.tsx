'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import AnnotationPopover from '@/components/tax-draft/AnnotationPopover'
import { SMITH_CONSTRUCTION_RETURN, type ReturnLine } from '@/lib/tax-draft/demoReturnData'

export default function TaxReturnReviewPage() {
  const { returnId } = useParams<{ returnId: string }>()
  const data = SMITH_CONSTRUCTION_RETURN

  const allSections = data.sections
  const [sectionIndex, setSectionIndex] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())

  const currentSection = allSections[sectionIndex]
  const currentLine: ReturnLine | undefined = currentSection?.lines[lineIndex]

  const totalLines = allSections.reduce((s, sec) => s + sec.lines.length, 0)
  const completedLines = reviewed.size

  function handleMarkReviewed() {
    if (currentLine) {
      setReviewed(prev => new Set([...prev, currentLine.id]))
      goNext()
    }
  }

  function handleOverride(_v: number, _n: string) {
    if (currentLine) {
      setReviewed(prev => new Set([...prev, currentLine.id]))
      goNext()
    }
  }

  function goNext() {
    const lines = currentSection.lines
    if (lineIndex < lines.length - 1) {
      setLineIndex(lineIndex + 1)
    } else if (sectionIndex < allSections.length - 1) {
      setSectionIndex(sectionIndex + 1)
      setLineIndex(0)
    }
  }

  function goPrev() {
    if (lineIndex > 0) {
      setLineIndex(lineIndex - 1)
    } else if (sectionIndex > 0) {
      setSectionIndex(sectionIndex - 1)
      setLineIndex(allSections[sectionIndex - 1].lines.length - 1)
    }
  }

  const isFirst = sectionIndex === 0 && lineIndex === 0
  const isLast = sectionIndex === allSections.length - 1 && lineIndex === (currentSection?.lines.length ?? 1) - 1

  const pct = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <DashboardNav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Link href={`/dashboard/tax-draft/${returnId}`} style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none' }}>
            ← Back to Draft
          </Link>
          <div style={{ fontSize: 13, color: '#6b6560' }}>
            {data.client} · {data.formType} · {data.taxYear}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>
              Section {sectionIndex + 1} of {allSections.length}: {currentSection?.name}
            </span>
            <span style={{ fontSize: 13, color: '#2d5a27', fontWeight: 600 }}>{pct}% reviewed</span>
          </div>
          <div style={{ height: 6, backgroundColor: '#e8e0d4', borderRadius: 3 }}>
            <div style={{ height: '100%', borderRadius: 3, backgroundColor: '#2d5a27', width: `${pct}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#a09a94' }}>
            Line {lineIndex + 1} of {currentSection?.lines.length} · {completedLines} / {totalLines} total lines reviewed
          </div>
        </div>

        {/* Section overview: all lines */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Line list */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e8e0d4', backgroundColor: '#f8f5f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentSection?.name}
              </div>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {currentSection?.lines.map((line, i) => {
                const isActive = i === lineIndex
                const isDone = reviewed.has(line.id)
                return (
                  <button
                    key={line.id}
                    onClick={() => setLineIndex(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 16px',
                      border: 'none', textAlign: 'left', cursor: 'pointer',
                      backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                      borderLeft: isActive ? '3px solid #2d5a27' : '3px solid transparent',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: isDone ? '#2d5a27' : isActive ? '#e8e0d4' : '#f5f0ea',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: isDone ? '#fff' : '#6b6560',
                    }}>
                      {isDone ? '✓' : line.lineNumber}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {line.description}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b6560', fontVariantNumeric: 'tabular-nums' }}>
                        {line.currentAmount != null ? '$' + line.currentAmount.toLocaleString() : '—'}
                      </div>
                    </div>
                    {line.needsReview && !isDone && (
                      <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>!</span>
                    )}
                    {line.opportunity && (
                      <span style={{ fontSize: 10, color: '#f59e0b' }}>✦</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Current line detail */}
          {currentLine && (
            <div>
              <div style={{
                backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12,
                padding: '14px 18px', marginBottom: 12,
              }}>
                <div style={{ fontSize: 10, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Line {currentLine.lineNumber}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>{currentLine.description}</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#a09a94' }}>Current Year</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>
                      {currentLine.currentAmount != null ? '$' + currentLine.currentAmount.toLocaleString() : '—'}
                    </div>
                  </div>
                  {currentLine.priorYearAmount != null && (
                    <div>
                      <div style={{ fontSize: 10, color: '#a09a94' }}>Prior Year</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#6b6560', fontVariantNumeric: 'tabular-nums' }}>
                        ${currentLine.priorYearAmount.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <AnnotationPopover
                lineNumber={currentLine.lineNumber}
                lineDescription={currentLine.description}
                reasoning={currentLine.reasoning}
                confidence={currentLine.confidence}
                lawReference={currentLine.lawReference}
                opportunity={currentLine.opportunity}
                opportunityValue={currentLine.opportunityValue}
                onMarkReviewed={handleMarkReviewed}
                onOverride={handleOverride}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={goPrev}
            disabled={isFirst}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #e8e0d4',
              backgroundColor: '#fff', color: '#1a1714', fontSize: 13, fontWeight: 500,
              cursor: isFirst ? 'not-allowed' : 'pointer', opacity: isFirst ? 0.5 : 1,
            }}
          >← Previous</button>

          <button
            onClick={() => {
              if (currentLine) {
                setReviewed(prev => new Set([...currentSection.lines.map(l => l.id), ...prev]))
              }
            }}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #e8e0d4',
              backgroundColor: '#faf8f4', color: '#6b6560', fontSize: 12, cursor: 'pointer',
            }}
          >Approve All in Section</button>

          {isLast ? (
            <Link
              href={`/dashboard/tax-draft/${returnId}`}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}
            >✓ Complete Review</Link>
          ) : (
            <button
              onClick={goNext}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                backgroundColor: '#1a1714', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >Next →</button>
          )}
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
