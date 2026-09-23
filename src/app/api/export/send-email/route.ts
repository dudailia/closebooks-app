import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { CategorizationJob } from '@/types'
import type { FirmSettings } from '@/lib/firmSettings'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { renderExportPdfBuffer, type PdfExportType } from '@/lib/export/renderPdf'

export const runtime = 'nodejs'

const bodySchema = z.object({
  to: z.string().email(),
  job: z.record(z.unknown()),
  firmSettings: z.record(z.unknown()).optional(),
  previousJob: z.record(z.unknown()).optional().nullable(),
  pdfType: z.enum(['close_summary', 'trial_balance', 'transaction_detail', 'bank_reconciliation', 'package']),
  subject: z.string().min(1).max(200).optional(),
  bodyText: z.string().max(8000).optional(),
  bankReconciliation: z
    .object({
      bankBalance: z.number().optional(),
      bookBalance: z.number().optional(),
      outstandingChecks: z.number().optional(),
      depositsInTransit: z.number().optional(),
    })
    .optional(),
})

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function resolveFirmId(userId: string): Promise<string | null> {
  const svc = getServiceSupabase()
  if (!svc) return null
  const { data } = await svc.from('firm_members').select('firm_id').eq('user_id', userId).limit(1).maybeSingle()
  if (data?.firm_id) return data.firm_id as string
  const { data: firm } = await svc.from('firms').select('id').eq('owner_id', userId).maybeSingle()
  return (firm?.id as string | undefined) ?? null
}

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
  return { ...d, ...(f as Partial<FirmSettings>) }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Email delivery is not configured. Set RESEND_API_KEY in the server environment (see .env.example).',
      },
      { status: 503 }
    )
  }

  const { to, job: jobRaw, firmSettings, previousJob, pdfType, subject, bodyText, bankReconciliation } =
    parsed.data
  const job = asJob(jobRaw as Record<string, unknown>)
  const firm = asFirm(firmSettings as Record<string, unknown> | undefined)
  const prev = previousJob ? asJob(previousJob as Record<string, unknown>) : null

  const buffer = await renderExportPdfBuffer({
    job,
    firm,
    previousJob: prev,
    type: pdfType as PdfExportType,
    bankReconciliation,
  })

  const from = process.env.RESEND_FROM_EMAIL ?? 'CloseBooks <onboarding@resend.dev>'
  const safeName = job.client_name.replace(/[^a-zA-Z0-9_\-. ]/g, '_').replace(/\s+/g, '_')
  const filename = `${safeName}_${pdfType}.pdf`
  const defaultSubject = `${firm.firmName || 'Your firm'} — ${job.client_name} (${job.created_at.slice(0, 10)})`
  const textBody =
    bodyText ??
    `Please find attached your ${pdfType.replace(/_/g, ' ')} report for ${job.client_name}.\n\nPrepared using CloseBooks.`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: subject ?? defaultSubject,
      text: textBody,
      attachments: [{ filename, content: buffer.toString('base64') }],
    }),
  })

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!res.ok) {
    return NextResponse.json(
      { error: data.message ?? 'Resend API error', details: data },
      { status: res.status >= 400 ? res.status : 502 }
    )
  }

  const firmId = await resolveFirmId(user.id)
  const svc = getServiceSupabase()
  if (svc && firmId) {
    await svc.from('report_email_log').insert({
      firm_id: firmId,
      client_name: job.client_name,
      report_type: pdfType,
      recipient_email: to,
      provider_message_id: data.id ?? null,
      meta: { filename },
    })
  }

  return NextResponse.json({
    ok: true,
    messageId: data.id ?? null,
    note:
      'Open tracking requires Resend webhooks or a dedicated transactional provider; not enabled in this route.',
  })
}
