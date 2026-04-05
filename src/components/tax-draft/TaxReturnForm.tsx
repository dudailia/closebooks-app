'use client'

import React, { useState } from 'react'
import ReturnLineItem from './ReturnLineItem'
import type { FormSection } from '@/lib/tax-draft/demoReturnData'

interface Props {
  sections: FormSection[]
  onLineSelect: (lineId: string) => void
  selectedLineId?: string
}

export default function TaxReturnForm({ sections, onLineSelect, selectedLineId }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleSection(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div>
      {sections.map((section) => {
        const isCollapsed = collapsed[section.id]
        const reviewCount = section.lines.filter((l) => l.needsReview).length
        const oppCount = section.lines.filter((l) => l.opportunity).length

        return (
          <div key={section.id} className="mb-4">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left"
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: isCollapsed ? 8 : '8px 8px 0 0',
                border: '1px solid #e8e0d4',
                borderBottom: isCollapsed ? '1px solid #e8e0d4' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="text-sm font-bold" style={{ color: '#1a1714' }}>
                  {section.name}
                </span>
                <span className="text-xs" style={{ color: '#6b6560' }}>
                  {section.lines.length} lines
                </span>
                {reviewCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                  >
                    {reviewCount} review
                  </span>
                )}
                {oppCount > 0 && (
                  <span className="text-xs" style={{ color: '#b8734a' }}>
                    {oppCount} ★
                  </span>
                )}
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <path d="M2 4l4 4 4-4" stroke="#6b6560" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Table */}
            {!isCollapsed && (
              <div
                style={{
                  border: '1px solid #e8e0d4',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  overflow: 'hidden',
                }}
              >
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
                      <th className="py-1.5 px-3 text-left text-xs font-medium" style={{ color: '#6b6560', width: 48 }}>
                        Line
                      </th>
                      <th className="py-1.5 px-3 text-left text-xs font-medium" style={{ color: '#6b6560' }}>
                        Description
                      </th>
                      <th className="py-1.5 px-3 text-right text-xs font-medium" style={{ color: '#6b6560', width: 120 }}>
                        Prior Year
                      </th>
                      <th className="py-1.5 px-3 text-right text-xs font-medium" style={{ color: '#6b6560', width: 130 }}>
                        Current Year
                      </th>
                      <th className="py-1.5 px-3 text-right text-xs font-medium" style={{ color: '#6b6560', width: 70 }}>
                        Chg%
                      </th>
                      <th className="py-1.5 px-3 text-right text-xs font-medium" style={{ color: '#6b6560', width: 90 }}>
                        &nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.lines.map((line, idx) => (
                      <React.Fragment key={line.id}>
                        <ReturnLineItem
                          lineNumber={line.lineNumber}
                          description={line.description}
                          priorYearAmount={line.priorYearAmount}
                          currentAmount={line.currentAmount}
                          hasAnnotation={!!line.reasoning}
                          hasOpportunity={!!line.opportunity}
                          needsReview={line.needsReview ?? false}
                          isHighlighted={selectedLineId === line.id}
                          onClick={() => onLineSelect(line.id)}
                        />
                        {idx < section.lines.length - 1 && (
                          <tr key={`${line.id}-divider`}>
                            <td
                              colSpan={6}
                              style={{ borderBottom: '1px solid #f3f4f6', padding: 0 }}
                            />
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
