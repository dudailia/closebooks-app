import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { CategorizationJob } from '@/types'
import type { FirmSettings } from '@/lib/firmSettings'
import { renderExportPdfBuffer, type PdfExportType } from '@/lib/export/renderPdf'

export const runtime = 'nodejs'

const bodySchema = z.object({
  job: z.record(z.unknown()),
  firmSettings: z.record(z.unknown()).optional(),
  previousJob: z.record(z.unknown()).optional().nullable(),
  type: z.enum(['close_summary', 'trial_balance', 'transaction_detail', 'bank_reconciliation', 'package']),
  bankReconciliation: z
    .object({
      bankBalance: z.number().optional(),
      bookBalance: z.number().optional(),
      outstandingChecks: z.number().optional(),
      depositsInTransit: z.number().optional(),
    })
    .optional(),
})

function asJob(j: Record<string, unknown>): CategorizationJob {
  return j as unknown as CategorizationJob
}

function asFirm(f?: Record<string, unknown>): FirmSettings {
  const d: FirmSettings = {
    firmName: '',
    firmTagline: '',
    accentColor: '#2d5a27',
    preparedBy: '',
    inboxSlug: '',
  }
  if (!f) return d
  return { ...d, ...(f as FirmSettings) }
}

export async function POST(request: NextRequest) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }
  const { job: jobRaw, firmSettings, previousJob, type, bankReconciliation } = parsed.data
  const job = asJob(jobRaw as Record<string, unknown>)
  const firm = asFirm(firmSettings as Record<string, unknown> | undefined)
  const prev = previousJob ? asJob(previousJob as Record<string, unknown>) : null

  try {
    const buffer = await renderExportPdfBuffer({
      job,
      firm,
      previousJob: prev,
      type: type as PdfExportType,
      bankReconciliation,
    })
    const safe = job.client_name.replace(/\s+/g, '_')
    const name = `${safe}_${type}_${new Date().toISOString().slice(0, 10)}.pdf`
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}"`,
      },
    })
  } catch (e) {
    console.error('[export/pdf]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'PDF render failed' }, { status: 500 })
  }
}
