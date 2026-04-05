import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTaxHandoffData } from '@/lib/taxAnalysis'
import type { CategorizationJob } from '@/types'
import type { FirmSettings } from '@/lib/firmSettings'

const anthropic = new Anthropic()

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function POST(request: Request) {
  let body: { jobs: CategorizationJob[]; taxYear: number; firmSettings?: FirmSettings }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { jobs, taxYear, firmSettings } = body
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({ error: 'No jobs provided.' }, { status: 400 })
  }

  const data = buildTaxHandoffData(jobs, taxYear ?? new Date().getFullYear())
  const firm = firmSettings ?? { firmName: 'CloseBooks', firmTagline: '', accentColor: '#2d5a27', preparedBy: '' }
  const accent = firm.accentColor || '#2d5a27'

  // ── Generate AI tax narrative ──────────────────────────────────────────────
  const summaryForClaude = `
Client: ${data.clientName}
Tax Year: ${data.taxYear}
Months covered: ${data.months.join(', ')}
Total Revenue: $${fmt(data.totalRevenue)}
Total Expenses: $${fmt(data.totalExpenses)}
Net Income: $${fmt(data.netIncome)} (${data.netIncome >= 0 ? 'profit' : 'loss'})

Top Expense Categories:
${data.plRows.slice(0, 8).map((r) => `  • ${r.category}: $${fmt(r.totalDebits)}`).join('\n')}

Depreciation candidates (${data.depreciationCandidates.length}):
${data.depreciationCandidates.slice(0, 5).map((d) => `  • ${d.description} — $${fmt(d.amount)} (${d.suggestedClass})`).join('\n') || '  None found'}

1099-eligible vendors (${data.vendors1099.length}, total $${fmt(data.vendors1099.reduce((s, v) => s + v.totalPaid, 0))}):
${data.vendors1099.slice(0, 5).map((v) => `  • ${v.vendorName}: $${fmt(v.totalPaid)}`).join('\n') || '  None found'}

Owner draws total: $${fmt(data.ownerDraws.reduce((s, d) => s + d.amount, 0))}
Open items: ${data.openItems.join('; ') || 'None'}
`

  let narrative = `${data.clientName} had ${data.netIncome >= 0 ? 'a profitable' : 'a challenging'} ${data.taxYear}, with revenue of $${fmt(data.totalRevenue)} and expenses of $${fmt(data.totalExpenses)}, resulting in net ${data.netIncome >= 0 ? 'income' : 'loss'} of $${fmt(Math.abs(data.netIncome))}.`

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are a CPA writing a concise tax preparer briefing. Given the following annual summary, write 3-4 paragraphs for the tax preparer covering: the financial highlights, what needs decisions (depreciation, 1099s, owner draws), and anything unusual the preparer should know. Be specific with numbers. Use plain language, not jargon.\n\n${summaryForClaude}\n\nReturn only the narrative text, no headings.`,
      }],
    })
    const text = msg.content.find((c) => c.type === 'text')?.text ?? ''
    if (text.trim()) narrative = text.trim()
  } catch {
    // use fallback
  }

  // ── Build HTML ─────────────────────────────────────────────────────────────
  const monthKeys = [...new Set(
    data.plRows.flatMap((r) => Object.keys(r.monthly))
  )].sort()

  const plTableRows = data.plRows.map((r) => `
    <tr>
      <td>${escHtml(r.category)}</td>
      <td class="code">${escHtml(r.accountCode)}</td>
      ${monthKeys.map((m) => `<td class="num">${r.monthly[m] ? `$${fmt(Math.abs(r.monthly[m] ?? 0))}` : '—'}</td>`).join('')}
      <td class="num total">${r.totalDebits > 0 ? `$${fmt(r.totalDebits)}` : '—'}</td>
      <td class="num total credit">${r.totalCredits > 0 ? `$${fmt(r.totalCredits)}` : '—'}</td>
    </tr>`).join('')

  const deprRows = data.depreciationCandidates.map((d) => `
    <tr>
      <td>${escHtml(d.date)}</td>
      <td>${escHtml(d.description)}</td>
      <td class="num">$${fmt(d.amount)}</td>
      <td>${escHtml(d.suggestedClass)}</td>
      <td>${d.usefulLife}-year property</td>
      <td style="color:#a09a94">[ ]</td>
    </tr>`).join('')

  const v1099Rows = data.vendors1099.map((v) => `
    <tr>
      <td>${escHtml(v.vendorName)}</td>
      <td class="num">$${fmt(v.totalPaid)}</td>
      <td class="num">${v.transactionCount}</td>
      <td>${v.likelyCorporate ? '<span style="color:#6b7280">Corporate — exempt</span>' : '<span style="color:#dc2626">Individual — file 1099</span>'}</td>
      <td style="color:#a09a94">[ ]</td>
    </tr>`).join('')

  const drawRows = data.ownerDraws.map((d) => `
    <tr>
      <td>${escHtml(d.date)}</td>
      <td>${escHtml(d.description)}</td>
      <td class="num">$${fmt(d.amount)}</td>
    </tr>`).join('')

  const openItemsHtml = data.openItems.map((item) => `
    <li style="margin-bottom:6px">
      <span style="color:#b45309; margin-right:6px">□</span>${escHtml(item)}
    </li>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Prep Handoff — ${escHtml(data.clientName)} ${data.taxYear}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; font-size: 10.5pt; color: #1a1714; background: #fff; line-height: 1.55; }
    .page { max-width: 900px; margin: 0 auto; padding: 48px 48px 60px; }
    .header-bar { background: ${accent}; color: #fff; padding: 18px 28px; border-radius: 10px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
    .firm-name { font-size: 16pt; font-weight: bold; }
    .header-right { text-align: right; font-family: Arial, sans-serif; font-size: 9pt; opacity: 0.9; line-height: 1.7; }
    .watermark { display: inline-block; background: #fef9c3; border: 1px solid #fde047; color: #854d0e; font-family: Arial, sans-serif; font-size: 8pt; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-bottom: 16px; }
    h2 { font-size: 13pt; color: #1a1714; margin-bottom: 12px; }
    .section { margin-bottom: 36px; }
    .section-label { font-family: Arial, sans-serif; font-size: 8pt; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase; color: ${accent}; margin-bottom: 8px; }
    .narrative { background: #fafaf8; border-left: 3px solid ${accent}; padding: 16px 18px; border-radius: 0 8px 8px 0; font-size: 10pt; line-height: 1.7; color: #1a1714; margin-bottom: 8px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
    .kpi { border: 1.5px solid #e0dbd4; border-radius: 8px; padding: 14px 16px; }
    .kpi .val { font-size: 18pt; font-weight: bold; line-height: 1; }
    .kpi .lbl { font-family: Arial, sans-serif; font-size: 8pt; color: #6b6560; margin-top: 4px; }
    .kpi.accent { border-color: ${accent}; }
    .kpi.accent .val { color: ${accent}; }
    .open-items { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; }
    .open-items ul { list-style: none; padding: 0; font-family: Arial, sans-serif; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 8.5pt; }
    th { text-align: left; font-size: 7.5pt; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6560; border-bottom: 1.5px solid #e0dbd4; padding: 6px 8px; background: #faf8f4; }
    td { padding: 6px 8px; border-bottom: 1px solid #f0ebe3; color: #1a1714; }
    tr:last-child td { border-bottom: none; }
    .num { text-align: right; white-space: nowrap; font-family: 'Courier New', monospace; }
    .code { color: #6b6560; font-family: 'Courier New', monospace; font-size: 8pt; }
    .total { font-weight: bold; }
    .credit { color: #166534; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0dbd4; font-family: Arial, sans-serif; font-size: 8pt; color: #a09a94; display: flex; justify-content: space-between; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1a1714; color: #fff; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; font-size: 9pt; z-index: 100; }
    .print-bar button { background: ${accent}; color: #fff; border: none; padding: 7px 18px; border-radius: 8px; cursor: pointer; font-size: 9pt; font-weight: bold; }
    @media screen { body { padding-top: 46px; } }
    @media print { .print-bar { display: none; } body { padding-top: 0; font-size: 9.5pt; } .page { padding: 24px 32px 40px; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span><strong>Tax Prep Handoff</strong> · ${escHtml(data.clientName)} · ${data.taxYear}</span>
    <button onclick="window.print()">⬇ Save as PDF</button>
  </div>
  <div class="page">
    <div class="header-bar">
      <div>
        <div class="firm-name">${escHtml(firm.firmName || 'CloseBooks')}</div>
        ${firm.firmTagline ? `<div style="font-size:9pt;opacity:0.8;margin-top:2px">${escHtml(firm.firmTagline)}</div>` : ''}
      </div>
      <div class="header-right">
        <strong>TAX PREP HANDOFF PACKAGE</strong><br/>
        ${escHtml(data.clientName)} · ${data.taxYear}<br/>
        Generated ${fmtDate(data.generatedAt)}<br/>
        ${firm.preparedBy ? `Prepared by ${escHtml(firm.preparedBy)}` : ''}
      </div>
    </div>

    ${data.openItems.length > 0 ? `
    <div class="section">
      <div class="section-label">Action Required</div>
      <div class="open-items">
        <ul>${openItemsHtml}</ul>
      </div>
    </div>` : ''}

    <div class="section">
      <div class="section-label">Financial Overview</div>
      <div class="kpi-grid">
        <div class="kpi accent">
          <div class="val">$${fmt(data.totalRevenue)}</div>
          <div class="lbl">Total Revenue</div>
        </div>
        <div class="kpi">
          <div class="val">$${fmt(data.totalExpenses)}</div>
          <div class="lbl">Total Expenses</div>
        </div>
        <div class="kpi ${data.netIncome >= 0 ? 'accent' : ''}">
          <div class="val" style="${data.netIncome < 0 ? 'color:#dc2626' : ''}">${data.netIncome < 0 ? '−' : ''}$${fmt(Math.abs(data.netIncome))}</div>
          <div class="lbl">Net ${data.netIncome >= 0 ? 'Income' : 'Loss'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Tax Preparer Briefing</div>
      <div class="narrative">${escHtml(narrative).replace(/\n\n/g, '</p><p style="margin-top:10px">').replace(/\n/g, '<br/>')}</div>
    </div>

    <div class="section">
      <div class="section-label">Profit &amp; Loss by Category</div>
      <h2>Annual P&amp;L — ${data.taxYear}</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Code</th>
            ${monthKeys.map((m) => `<th class="num">${new Date(m + '-02').toLocaleDateString('en-US', { month: 'short' })}</th>`).join('')}
            <th class="num">Debits</th>
            <th class="num">Credits</th>
          </tr>
        </thead>
        <tbody>${plTableRows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #1a1714;font-weight:bold">
            <td colspan="${2 + monthKeys.length}">Total</td>
            <td class="num">$${fmt(data.totalExpenses)}</td>
            <td class="num credit">$${fmt(data.totalRevenue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${data.depreciationCandidates.length > 0 ? `
    <div class="section">
      <div class="section-label">Depreciation Candidates</div>
      <h2>Potential Capital Expenditures (${data.depreciationCandidates.length})</h2>
      <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#6b6560;margin-bottom:10px">
        Each item may qualify for expensing under Section 179 or bonus depreciation — confirm with client before filing.
      </p>
      <table>
        <thead>
          <tr><th>Date</th><th>Description</th><th class="num">Amount</th><th>Asset Class</th><th>Useful Life</th><th>Decision</th></tr>
        </thead>
        <tbody>${deprRows}</tbody>
      </table>
    </div>` : ''}

    ${data.vendors1099.length > 0 ? `
    <div class="section">
      <div class="section-label">1099 Vendor List</div>
      <h2>Vendors Paid Over $600 — ${data.taxYear}</h2>
      <table>
        <thead>
          <tr><th>Vendor</th><th class="num">Total Paid</th><th class="num">Transactions</th><th>1099 Status</th><th>W-9 on File</th></tr>
        </thead>
        <tbody>${v1099Rows}</tbody>
      </table>
    </div>` : ''}

    ${data.ownerDraws.length > 0 ? `
    <div class="section">
      <div class="section-label">Owner Draws &amp; Distributions</div>
      <h2>Total: $${fmt(data.ownerDraws.reduce((s, d) => s + d.amount, 0))}</h2>
      <table>
        <thead><tr><th>Date</th><th>Description</th><th class="num">Amount</th></tr></thead>
        <tbody>${drawRows}</tbody>
        <tfoot>
          <tr style="font-weight:bold;border-top:2px solid #1a1714">
            <td colspan="2">Total Draws / Distributions</td>
            <td class="num">$${fmt(data.ownerDraws.reduce((s, d) => s + d.amount, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>` : ''}

    <footer class="footer">
      <span>Generated by <strong>${escHtml(firm.firmName || 'CloseBooks')}</strong> · Powered by <a href="https://closebooks-app.vercel.app" style="color:#2d5a27;text-decoration:none">CloseBooks</a> · Confidential</span>
      <span>Tax Year ${data.taxYear} · ${escHtml(data.clientName)}</span>
    </footer>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${data.clientName.replace(/\s+/g, '_')}_tax_handoff_${data.taxYear}.html"`,
    },
  })
}
