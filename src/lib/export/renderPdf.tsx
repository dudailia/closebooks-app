import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { CategorizationJob } from '@/types'
import type { FirmSettings } from '@/lib/firmSettings'
import {
  CloseSummaryPdfDoc,
  TrialBalancePdfDoc,
  TransactionDetailPdfDoc,
  BankReconciliationPdfDoc,
  FinancialPackagePdfDoc,
} from '@/lib/export/pdfDocuments'

export type PdfExportType =
  | 'close_summary'
  | 'trial_balance'
  | 'transaction_detail'
  | 'bank_reconciliation'
  | 'package'

export async function renderExportPdfBuffer(args: {
  job: CategorizationJob
  firm?: FirmSettings
  previousJob?: CategorizationJob | null
  type: PdfExportType
  bankReconciliation?: {
    bankBalance?: number
    bookBalance?: number
    outstandingChecks?: number
    depositsInTransit?: number
  }
}): Promise<Buffer> {
  const { job, firm, previousJob, type, bankReconciliation } = args
  let doc: React.ReactElement
  switch (type) {
    case 'close_summary':
      doc = <CloseSummaryPdfDoc job={job} firm={firm} previousJob={previousJob ?? null} />
      break
    case 'trial_balance':
      doc = <TrialBalancePdfDoc job={job} firm={firm} previousJob={previousJob ?? null} />
      break
    case 'transaction_detail':
      doc = <TransactionDetailPdfDoc job={job} firm={firm} />
      break
    case 'bank_reconciliation':
      doc = (
        <BankReconciliationPdfDoc
          job={job}
          firm={firm}
          bankBalance={bankReconciliation?.bankBalance}
          bookBalance={bankReconciliation?.bookBalance}
          outstandingChecks={bankReconciliation?.outstandingChecks}
          depositsInTransit={bankReconciliation?.depositsInTransit}
        />
      )
      break
    case 'package':
      doc = <FinancialPackagePdfDoc job={job} firm={firm} previousJob={previousJob ?? null} />
      break
  }
  return renderToBuffer(doc)
}
