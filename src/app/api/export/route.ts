import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Transaction, ChartOfAccounts } from '@/types'
import { buildCsv, filenameForFormat } from '@/lib/export/buildCsv'
import type { CsvExportFormat, DetailColumnKey } from '@/lib/export/types'
import { ALL_CSV_FORMATS } from '@/lib/export/types'

const formatSchema = z.enum(ALL_CSV_FORMATS)

const bodySchema = z.object({
  transactions: z.array(z.record(z.string(), z.unknown())),
  chartOfAccounts: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  clientName: z.string().min(1).max(500),
  format: formatSchema,
  /** For `transaction_detail` only — which columns to include */
  columns: z.array(z.string()).optional(),
})

function safeFilename(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '_').replace(/\s+/g, '_')
}

export async function POST(request: NextRequest) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const { transactions, chartOfAccounts, clientName, format, columns } = parsed.data

  if (transactions.length === 0) {
    return NextResponse.json({ error: 'No transactions to export.' }, { status: 422 })
  }

  if (format === 'trial_balance' && (!chartOfAccounts || chartOfAccounts.length === 0)) {
    return NextResponse.json({ error: 'chartOfAccounts is required for trial_balance export.' }, { status: 422 })
  }

  const txs = transactions as unknown as Transaction[]
  const coa = (chartOfAccounts ?? []) as unknown as ChartOfAccounts[]

  let detailCols: DetailColumnKey[] | undefined
  if (columns?.length) {
    detailCols = columns.filter((c): c is DetailColumnKey =>
      [
        'date',
        'description',
        'original_description',
        'type',
        'amount',
        'debit',
        'credit',
        'suggested_category',
        'final_category',
        'suggested_account_code',
        'final_account_code',
        'confidence',
        'status',
        'notes',
        'reasoning',
        'tax_relevant',
        'suggested_1099_vendor',
      ].includes(c)
    ) as DetailColumnKey[]
  }

  const csv = buildCsv(format, txs, clientName, coa, detailCols)
  const filename = filenameForFormat(format, safeFilename(clientName))

  const contentType = format === 'iif' ? 'text/plain; charset=utf-8' : 'text/csv; charset=utf-8'

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Transaction-Count': String(transactions.length),
      'X-Export-Format': format,
      'Access-Control-Expose-Headers': 'X-Transaction-Count, X-Export-Format',
    },
  })
}

/** GET documents supported formats for UI */
export async function GET() {
  return NextResponse.json({
    formats: ALL_CSV_FORMATS,
    legacy: ['quickbooks', 'standard'],
  })
}
