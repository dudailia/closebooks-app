'use client'
import { useState } from 'react'
import type { CategorizationJob } from '@/types'
import MonthlyReportPreviewModal from './MonthlyReportPreviewModal'

export default function SendMonthlyReportButton({
  job,
  priorJob,
  clientEmail,
}: {
  job: CategorizationJob
  priorJob: CategorizationJob | null
  clientEmail?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors"
        style={{ borderColor: '#2d5a27', color: '#2d5a27', backgroundColor: '#ffffff' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e8f0e6'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff'
        }}
        title="Send the monthly close report to the client"
      >
        ✦ Monthly Report
      </button>
      {open && (
        <MonthlyReportPreviewModal
          job={job}
          priorJob={priorJob}
          initialEmail={clientEmail}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
