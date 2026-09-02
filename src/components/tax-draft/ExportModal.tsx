'use client'

import { useState } from 'react'
import DemoDataNotice from '@/components/DemoDataNotice'

interface Props {
  returnId: string
  clientName: string
  formType: string
  taxYear: number
  onClose: () => void
}

const FORMATS = [
  {
    id: 'drake' as const,
    name: 'Drake Software',
    extension: '.drf',
    description: 'Pipe-delimited Drake Tax import file. Compatible with Drake Tax 2024 and later.',
    color: '#1e40af',
    bg: '#dbeafe',
    icon: 'D',
  },
  {
    id: 'lacerte' as const,
    name: 'Lacerte',
    extension: '.tab',
    description: 'Tab-delimited Lacerte import format. Compatible with Lacerte Tax and ProConnect.',
    color: '#065f46',
    bg: '#d1fae5',
    icon: 'L',
  },
  {
    id: 'proseries' as const,
    name: 'ProSeries',
    extension: '.xml',
    description: 'XML format compatible with Intuit ProSeries Professional and ProSeries Basic.',
    color: '#7c2d12',
    bg: '#fed7aa',
    icon: 'P',
  },
  {
    id: 'pdf' as const,
    name: 'PDF with Annotations',
    extension: '.txt',
    description: 'Formatted return with all AI annotations and opportunity notes included.',
    color: '#1a1714',
    bg: '#f3f4f6',
    icon: '↓',
  },
]

export default function ExportModal({ returnId, clientName, formType, taxYear, onClose }: Props) {
  const [exporting, setExporting] = useState<string | null>(null)
  const [exported, setExported] = useState<string[]>([])

  async function handleExport(format: 'drake' | 'lacerte' | 'pdf') {
    setExporting(format)
    try {
      const res = await fetch('/api/tax-draft/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId, format }),
      })
      if (!res.ok) throw new Error('Export failed')

      // The export route does not yet resolve a real return — it returns a fixed
      // sample and flags that in this header. Keep the marker on the downloaded
      // file so a sample can never be mistaken for the client's actual return.
      const isSample = res.headers.get('X-CloseBooks-Sample-Data') === 'true'
      const blob = await res.blob()
      const ext = FORMATS.find((f) => f.id === format)?.extension ?? '.txt'
      const filename = isSample
        ? `SAMPLE_${formType}_${taxYear}${ext}`
        : `${clientName.replace(/\s+/g, '_')}_${formType}_${taxYear}${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setExported((prev) => [...prev, format])
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e8e0d4' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: '#1a1714' }}>
              Export Tax Return
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              {clientName} · {formType} · {taxYear}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: '#6b6560', backgroundColor: '#faf8f4' }}
          >
            ×
          </button>
        </div>

        {/* Format cards */}
        <div className="p-6" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DemoDataNotice style={{ marginBottom: 4 }}>
            Sample export. This does not yet read {clientName}&apos;s return — every
            format below exports the same fixed sample return, and the downloaded
            file is prefixed <code>SAMPLE_</code>. Do not file or send it to a client.
          </DemoDataNotice>
          {FORMATS.map((fmt) => {
            const isExporting = exporting === fmt.id
            const isDone = exported.includes(fmt.id)
            const canExport = fmt.id !== 'proseries' // ProSeries stubbed

            return (
              <div
                key={fmt.id}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ border: '1px solid #e8e0d4', backgroundColor: isDone ? '#f9fffe' : '#faf8f4' }}
              >
                {/* Logo placeholder */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ backgroundColor: fmt.bg, color: fmt.color }}
                >
                  {fmt.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                      {fmt.name}
                    </p>
                    <code
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#f3f4f6', color: '#6b6560' }}
                    >
                      {fmt.extension}
                    </code>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                    {fmt.description}
                  </p>
                </div>

                {/* Export button */}
                {isDone ? (
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                  >
                    ✓ Downloaded
                  </span>
                ) : canExport ? (
                  <button
                    onClick={() => handleExport(fmt.id as 'drake' | 'lacerte' | 'pdf')}
                    disabled={isExporting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                    style={{
                      backgroundColor: isExporting ? '#d4a88a' : '#b8734a',
                      minWidth: 70,
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting) e.currentTarget.style.backgroundColor = '#a06040'
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting) e.currentTarget.style.backgroundColor = '#b8734a'
                    }}
                  >
                    {isExporting ? 'Exporting…' : 'Export'}
                  </button>
                ) : (
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs flex-shrink-0"
                    style={{ color: '#9ca3af', border: '1px solid #e8e0d4' }}
                  >
                    Coming soon
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div
          className="px-6 py-3 rounded-b-2xl text-xs"
          style={{ borderTop: '1px solid #e8e0d4', backgroundColor: '#faf8f4', color: '#6b6560' }}
        >
          Exported files will download to your browser. All exports include the complete annotated return and Schedule K-1 data.
        </div>
      </div>
    </div>
  )
}
