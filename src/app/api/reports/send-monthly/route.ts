import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import MonthlyCloseReport from '@/emails/MonthlyCloseReport'
import { buildMonthlyReport } from '@/lib/reports/summarize'
import { getFirmSettingsCache, hydrateFirmSettings } from '@/lib/firmSettings'
import { dbGetJob } from '@/lib/db'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import type { CategorizationJob } from '@/types'

export const dynamic = 'force-dynamic'

interface Body {
  jobId: string
  preview?: boolean
  clientEmailOverride?: string
  portalUrlOverride?: string
  /** Client can send its full job payload so the route works even without Supabase hydration. */
  jobPayload?: CategorizationJob
  priorJobPayload?: CategorizationJob | null
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Resolve job: prefer client-supplied payload (localStorage-backed flows), fall back to Supabase.
  const job: CategorizationJob | null =
    body.jobPayload ?? (await dbGetJob(body.jobId).catch(() => null))
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  const priorJob: CategorizationJob | null = body.priorJobPayload ?? null

  // Hydrate firm settings (no-op in demo mode)
  try {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await hydrateFirmSettings(ctx.supabase, ctx.firmId)
  } catch {
    /* ignore — fall through to cached/default settings */
  }
  const settings = getFirmSettingsCache()

  const report = buildMonthlyReport(job, priorJob)
  const periodLabel = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  type NarrativeShape = {
    paragraphs?: Array<{ tone: string; html: string }>
    forwardLookingLine?: string
  }
  const narr = (job as { narrative?: NarrativeShape }).narrative
  const ownerNarrative = narr?.paragraphs?.find((p) => p.tone === 'owner')?.html
  const forwardLine = narr?.forwardLookingLine

  const fallbackNarrative = `<p>Your books for ${periodLabel} are closed. Revenue was <strong>$${Math.round(
    report.revenue
  ).toLocaleString('en-US')}</strong> against expenses of <strong>$${Math.round(
    report.expenses
  ).toLocaleString('en-US')}</strong>. The full breakdown is in your portal.</p>`

  const portalBase =
    body.portalUrlOverride ??
    process.env.NEXT_PUBLIC_PORTAL_BASE_URL ??
    `${new URL(req.url).origin}/portal`

  const html = await render(
    MonthlyCloseReport({
      firmName: settings.clientFacingName ?? settings.firmName ?? 'Your accounting firm',
      firmLogoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor ?? settings.accentColor ?? '#2d5a27',
      accentColor: settings.accentColor ?? '#b8734a',
      clientName: job.client_name,
      periodLabel,
      narrativeHtml: ownerNarrative ?? fallbackNarrative,
      forwardLookingLine: forwardLine ?? '',
      pnl: {
        revenue: report.revenue,
        expenses: report.expenses,
        netIncome: report.netIncome,
        revenueDeltaPct: report.revenueDeltaPct,
      },
      topExpenseCategories: report.topExpenseCategories,
      portalUrl: portalBase,
      preparedBy: settings.preparedBy || undefined,
    })
  )

  if (body.preview || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ html, previewOnly: true })
  }

  const to = body.clientEmailOverride
  if (!to) {
    return NextResponse.json({ error: 'client email required to send' }, { status: 400 })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromName =
      settings.emailFromName ?? `${settings.firmName || 'CloseBooks'} Reports`
    const fromAddr = process.env.RESEND_FROM_ADDRESS ?? 'reports@mail.closebooks.app'
    const replyTo = settings.emailReplyTo ?? undefined

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddr}>`,
      to,
      subject: `Your books are closed for ${periodLabel}`,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 })
    return NextResponse.json({ sent: true, id: data?.id, html })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 }
    )
  }
}
