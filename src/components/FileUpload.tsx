'use client'

import { useState, useRef, useCallback } from 'react'
import { parseTransactionCSV } from '@/lib/parseCSV'
import type { Transaction } from '@/types'

interface Props {
  onContinue: (transactions: Transaction[], fileName: string) => void
}

type DropState = 'idle' | 'hovering' | 'error'

const PREVIEW_ROWS = 5

export default function FileUpload({ onContinue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropState, setDropState] = useState<DropState>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<Transaction[] | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  // --- File processing -------------------------------------------------------

  async function processFile(file: File) {
    setError(null)
    setParseErrors([])
    setPreview(null)

    const isPDF = file.name.toLowerCase().endsWith('.pdf')
    const isCSV = file.name.toLowerCase().endsWith('.csv')

    if (!isPDF && !isCSV) {
      setError('Only .csv or .pdf files are accepted. Please export your bank statement from your bank.')
      setFileName(null)
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large (max 20 MB). Try splitting it into smaller exports.')
      setFileName(null)
      return
    }

    if (isPDF) {
      setPdfLoading(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const bytes  = new Uint8Array(arrayBuffer)
        const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64 }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'PDF parsing failed. Please try a different file or use CSV export.')
          setFileName(null)
          return
        }
        const transactions: Transaction[] = data.transactions ?? []
        if (transactions.length === 0) {
          setError('No transactions could be extracted from this PDF. Try exporting as CSV from your bank instead.')
          setFileName(null)
          return
        }
        setFileName(file.name)
        setPreview(transactions)
        if (data.errors?.length > 0) setParseErrors(data.errors)
      } catch {
        setError('Could not process this PDF. Please check your connection and try again.')
        setFileName(null)
      } finally {
        setPdfLoading(false)
      }
      return
    }

    // CSV path
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large (max 10 MB). Try splitting it into smaller exports.')
      setFileName(null)
      return
    }

    const text = await file.text()
    const { transactions, errors } = parseTransactionCSV(text)

    if (transactions.length === 0) {
      setError('No transactions could be read from this file. Check that it is a valid bank CSV.')
      setFileName(null)
      return
    }

    setFileName(file.name)
    setPreview(transactions)
    if (errors.length > 0) setParseErrors(errors)
  }

  // --- Drag-and-drop handlers ------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDropState('hovering')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if we're leaving the drop zone itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropState('idle')
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDropState('idle')

    const file = e.dataTransfer.files[0]
    if (!file) return
    await processFile(file)
  }, [])

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    // Reset input so the same file can be re-selected after a clear
    e.target.value = ''
  }, [])

  // --- Actions ---------------------------------------------------------------

  function handleClear() {
    setFileName(null)
    setPreview(null)
    setParseErrors([])
    setError(null)
    setDropState('idle')
  }

  function handleContinue() {
    if (!preview || !fileName) return
    onContinue(preview, fileName)
  }

  // --- Derived state ---------------------------------------------------------

  const isHovering = dropState === 'hovering'
  const hasFile = fileName !== null && preview !== null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4 font-sans">

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload CSV or PDF bank statement"
        onClick={() => !hasFile && !pdfLoading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !hasFile && !pdfLoading && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          backgroundColor: isHovering ? '#f0ece4' : '#faf8f4',
          borderColor: isHovering ? '#2d5a27' : (hasFile || pdfLoading) ? '#2d5a27' : '#e0dbd4',
          borderStyle: (hasFile || pdfLoading) ? 'solid' : 'dashed',
          cursor: (hasFile || pdfLoading) ? 'default' : 'pointer',
        }}
        className="relative rounded-xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {pdfLoading ? (
          /* PDF processing state */
          <div className="px-6 py-14 sm:py-12 flex flex-col items-center text-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#2d5a27', borderTopColor: 'transparent' }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                AI is extracting transactions from your PDF…
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                This usually takes 10–20 seconds
              </p>
            </div>
          </div>
        ) : hasFile ? (
          /* File selected state */
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon />
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: '#1a1714' }}
                  title={fileName}
                >
                  {fileName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                  {preview!.length} transaction{preview!.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.borderColor = '#1a1714' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.borderColor = '#e0dbd4' }}
            >
              Change file
            </button>
          </div>
        ) : (
          /* Empty / hover state */
          <div className="px-6 py-14 sm:py-12 flex flex-col items-center text-center gap-3">
            <UploadIcon hovering={isHovering} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                Drop your bank statement here
              </p>
              <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
                or{' '}
                <span
                  className="underline underline-offset-2"
                  style={{ color: '#2d5a27' }}
                >
                  click to browse
                </span>
              </p>
            </div>
            <p className="text-xs" style={{ color: '#a09a94' }}>
              CSV or PDF · max 20 MB
            </p>
          </div>
        )}
      </div>

      {/* Parse warnings (non-fatal) */}
      {parseErrors.length > 0 && (
        <div
          className="rounded-lg px-4 py-3 text-xs space-y-1"
          style={{ backgroundColor: '#fef9ec', borderLeft: '3px solid #d4a017', color: '#7a5c00' }}
        >
          <p className="font-medium">Some rows were skipped:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </div>
      )}

      {/* Hard error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: '#fef2f2', borderLeft: '3px solid #dc2626', color: '#991b1b' }}
        >
          {error}
        </div>
      )}

      {/* Preview table */}
      {preview && preview.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: '#6b6560' }}>
            Preview — first {Math.min(PREVIEW_ROWS, preview.length)} of {preview.length} rows
          </p>
          <div
            className="rounded-xl overflow-hidden overflow-x-auto border text-xs"
            style={{ borderColor: '#e0dbd4' }}
          >
            <table className="w-full min-w-[360px]">
              <thead>
                <tr style={{ backgroundColor: '#f5f0ea' }}>
                  {['Date', 'Description', 'Amount', 'Type'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium"
                      style={{ color: '#6b6560' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, PREVIEW_ROWS).map((tx, i) => (
                  <tr
                    key={tx.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#faf8f4' : '#f5f0ea',
                      borderTop: '1px solid #e0dbd4',
                    }}
                  >
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#1a1714' }}>
                      {tx.date}
                    </td>
                    <td
                      className="px-3 py-2 max-w-[220px] truncate"
                      style={{ color: '#1a1714' }}
                      title={tx.description}
                    >
                      {tx.description}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums" style={{ color: '#1a1714' }}>
                      {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={
                          tx.type === 'debit'
                            ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                            : { backgroundColor: '#dcfce7', color: '#166534' }
                        }
                      >
                        {tx.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Continue button */}
      {hasFile && (
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Continue with {preview!.length} transaction{preview!.length !== 1 ? 's' : ''} →
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UploadIcon({ hovering }: { hovering: boolean }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'transform 150ms', transform: hovering ? 'translateY(-3px)' : 'none' }}
    >
      <rect width="40" height="40" rx="10" fill={hovering ? '#d4e8d0' : '#e8e2da'} />
      <path
        d="M20 26V14M20 14L15 19M20 14L25 19"
        stroke={hovering ? '#2d5a27' : '#6b6560'}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 29h14"
        stroke={hovering ? '#2d5a27' : '#6b6560'}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="#d4e8d0" />
      <path
        d="M10 8h8l6 6v10a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z"
        stroke="#2d5a27"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 8v6h6"
        stroke="#2d5a27"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 18h6M13 21h4"
        stroke="#2d5a27"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
