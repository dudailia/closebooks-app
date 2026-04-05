import { NextResponse } from 'next/server'
import type { CategorizationJob, Transaction } from '@/types'
import type { AuditEvent } from '@/lib/auditTrail'
import { formatAuditEvent } from '@/lib/auditTrail'
import type { FirmSettings } from '@/lib/firmSettings'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function statusLabel(status: Transaction['status']): string {
  return { approved: 'Approved', edited: 'Edited', pending: 'Pending', flagged: 'Flagged' }[status]
}

// ─────────────────────────────────────────────────────────────────────────────
// Category breakdown
// ─────────────────────────────────────────────────────────────────────────────

function buildCategoryBreakdown(transactions: Transaction[]) {
  const map = new Map<string, { debit: number; credit: number; count: number }>()
  for (const tx of transactions) {
    const cat = tx.final_category ?? tx.suggested_category ?? 'Uncategorized'
    const e   = map.get(cat) ?? { debit: 0, credit: 0, count: 0 }
    map.set(cat, {
      debit:  e.debit  + (tx.type === 'debit'  ? tx.amount : 0),
      credit: e.credit + (tx.type === 'credit' ? tx.amount : 0),
      count:  e.count  + 1,
    })
  }
  return Array.from(map.entries())
    .map(([cat, v]) => ({ cat, ...v }))
    .sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit))
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML report template
// ─────────────────────────────────────────────────────────────────────────────

function fmtAuditTs(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function buildHtml(job: CategorizationJob, auditEvents: AuditEvent[] = []): string {
  const pending      = job.transactions.filter((t) => t.status === 'pending').length
  const autoApproved = job.transactions.filter((t) => t.status === 'approved' && t.confidence >= 0.85).length
  const categoryRows = buildCategoryBreakdown(job.transactions)
  const generatedAt  = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const totalDebits  = job.transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalCredits = job.transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

  const txRows = job.transactions.map((tx) => `
    <tr class="tx-row status-${tx.status}">
      <td class="date">${tx.date}</td>
      <td class="desc">${escHtml(tx.description)}</td>
      <td class="cat">${escHtml(tx.final_category ?? tx.suggested_category ?? '—')}</td>
      <td class="code mono">${escHtml(tx.final_account_code ?? tx.suggested_account_code ?? '')}</td>
      <td class="amount mono ${tx.type}">${tx.type === 'debit' ? '−' : '+'}$${fmt(tx.amount)}</td>
      <td class="status"><span class="badge ${tx.status}">${statusLabel(tx.status)}</span></td>
    </tr>`).join('')

  const catRows = categoryRows.map((r) => `
    <tr>
      <td>${escHtml(r.cat)}</td>
      <td class="num">${r.count}</td>
      <td class="num mono${r.debit > 0 ? ' debit' : ''}">${r.debit > 0 ? `$${fmt(r.debit)}` : '—'}</td>
      <td class="num mono${r.credit > 0 ? ' credit' : ''}">${r.credit > 0 ? `$${fmt(r.credit)}` : '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Close Report — ${escHtml(job.client_name)}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Base ── */
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      color: #1a1714;
      background: #fff;
      line-height: 1.5;
    }

    /* ── Page layout ── */
    .page {
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 48px 60px;
    }

    /* ── Header ── */
    .report-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a1714;
      margin-bottom: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
    }
    .brand-name {
      font-size: 18pt;
      letter-spacing: -0.01em;
      line-height: 1;
    }
    .brand-name .close { color: #1a1714; }
    .brand-name .books { color: #2d5a27; }
    .report-title {
      font-size: 10pt;
      color: #6b6560;
      margin-top: 4px;
      font-family: 'Arial', sans-serif;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .header-meta {
      text-align: right;
      font-family: 'Arial', sans-serif;
      font-size: 9pt;
      color: #6b6560;
      line-height: 1.7;
    }
    .header-meta strong {
      color: #1a1714;
      font-size: 11pt;
    }

    /* ── Section headings ── */
    h2 {
      font-size: 13pt;
      letter-spacing: -0.01em;
      color: #1a1714;
      margin-bottom: 12px;
    }
    .section {
      margin-bottom: 36px;
    }
    .section-label {
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      font-weight: bold;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #2d5a27;
      margin-bottom: 6px;
    }

    /* ── Summary boxes ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .summary-box {
      border: 1px solid #e0dbd4;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .summary-box .num {
      font-size: 22pt;
      font-weight: bold;
      line-height: 1;
      color: #1a1714;
    }
    .summary-box .lbl {
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      color: #6b6560;
      margin-top: 4px;
    }
    .summary-box.green  { border-color: #2d5a27; background: #f0f5ef; }
    .summary-box.green .num { color: #2d5a27; }
    .summary-box.amber  { border-color: #d97706; background: #fefce8; }
    .summary-box.amber  .num { color: #d97706; }
    .summary-box.red    { border-color: #dc2626; background: #fef2f2; }
    .summary-box.red    .num { color: #dc2626; }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Arial', sans-serif;
      font-size: 9pt;
    }
    th {
      text-align: left;
      font-size: 8pt;
      font-weight: bold;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b6560;
      border-bottom: 1.5px solid #e0dbd4;
      padding: 7px 8px;
      background: #faf8f4;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #f0ebe3;
      vertical-align: top;
      color: #1a1714;
    }
    tr:last-child td { border-bottom: none; }
    .mono { font-family: 'Courier New', monospace; font-size: 9pt; }
    .date { white-space: nowrap; color: #6b6560; width: 78px; }
    .desc { max-width: 220px; }
    .cat  { max-width: 160px; color: #1a1714; }
    .code { color: #6b6560; width: 58px; }
    .amount { text-align: right; width: 88px; white-space: nowrap; }
    .amount.debit  { color: #991b1b; }
    .amount.credit { color: #166534; }
    .num { text-align: right; white-space: nowrap; }
    .status { width: 74px; }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 99px;
      font-size: 8pt;
      font-weight: bold;
    }
    .badge.approved { background: #dcfce7; color: #166534; }
    .badge.edited   { background: #dbeafe; color: #1d4ed8; }
    .badge.pending  { background: #fef9c3; color: #854d0e; }
    .badge.flagged  { background: #fee2e2; color: #991b1b; }

    /* ── Totals row ── */
    .totals-row td {
      border-top: 1.5px solid #1a1714;
      font-weight: bold;
      padding-top: 9px;
    }

    /* ── Footer ── */
    .report-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e0dbd4;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      color: #a09a94;
    }

    /* ── Print styles ── */
    @media print {
      body { font-size: 10pt; }
      .page { padding: 24px 36px 40px; max-width: 100%; }
      .no-print { display: none !important; }
      .section { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }

    /* ── Print button (screen only) ── */
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #1a1714;
      color: #fff;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'Arial', sans-serif;
      font-size: 9pt;
      z-index: 100;
    }
    .print-bar button {
      background: #2d5a27;
      color: #fff;
      border: none;
      padding: 7px 18px;
      border-radius: 8px;
      font-size: 9pt;
      font-weight: bold;
      cursor: pointer;
    }
    .print-bar button:hover { background: #1e3d1a; }
    @media print {
      .print-bar { display: none; }
      body { padding-top: 0; }
    }
    body:not(:has(.print-bar)) .page { padding-top: 48px; }
    @media screen {
      body { padding-top: 46px; }
    }
  </style>
</head>
<body>

  <!-- Print bar (screen only) -->
  <div class="print-bar no-print">
    <span><strong>CloseBooks</strong> · ${escHtml(job.client_name)} Close Report</span>
    <button onclick="window.print()">⬇ Save as PDF / Print</button>
  </div>

  <div class="page">

    <!-- Header -->
    <header class="report-header">
      <div>
        <div class="brand">
          <svg class="brand-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#2d5a27"/>
            <rect x="6" y="5" width="13" height="17" rx="2" stroke="white" stroke-width="1.4" fill="none"/>
            <path d="M9.5 10h6M9.5 13h6M9.5 16h4" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
            <rect x="17" y="8" width="6" height="11" rx="1.5" fill="white" fill-opacity="0.25"/>
          </svg>
          <div>
            <div class="brand-name"><span class="close">Close</span><span class="books">Books</span></div>
            <div class="report-title">Month-End Close Report</div>
          </div>
        </div>
      </div>
      <div class="header-meta">
        <strong>${escHtml(job.client_name)}</strong><br/>
        Period: ${fmtDate(job.created_at)}<br/>
        Generated: ${generatedAt}<br/>
        Job ID: <span class="mono">${job.id.slice(0, 8)}</span>
      </div>
    </header>

    <!-- Summary -->
    <div class="section">
      <div class="section-label">Summary</div>
      <div class="summary-grid">
        <div class="summary-box">
          <div class="num">${job.total_transactions}</div>
          <div class="lbl">Total Transactions</div>
        </div>
        <div class="summary-box green">
          <div class="num">${job.approved}</div>
          <div class="lbl">Approved (${job.total_transactions > 0 ? Math.round(job.approved / job.total_transactions * 100) : 0}% · ${autoApproved} auto)</div>
        </div>
        <div class="summary-box amber">
          <div class="num">${pending}</div>
          <div class="lbl">Pending Review</div>
        </div>
        <div class="summary-box red">
          <div class="num">${job.flagged}</div>
          <div class="lbl">Flagged</div>
        </div>
      </div>
    </div>

    <!-- Transactions -->
    <div class="section">
      <div class="section-label">Transactions</div>
      <h2>All Transactions (${job.total_transactions})</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Code</th>
            <th style="text-align:right">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${txRows}
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="4" style="font-family:'Arial',sans-serif">Totals</td>
            <td class="amount mono">
              <div class="debit" style="margin-bottom:2px">−$${fmt(totalDebits)}</div>
              <div class="credit">+$${fmt(totalCredits)}</div>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Category breakdown -->
    <div class="section">
      <div class="section-label">Category Breakdown</div>
      <h2>Amounts by Category</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align:right">Count</th>
            <th style="text-align:right">Debits</th>
            <th style="text-align:right">Credits</th>
          </tr>
        </thead>
        <tbody>
          ${catRows}
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td style="font-family:'Arial',sans-serif">Total</td>
            <td class="num">${job.total_transactions}</td>
            <td class="num mono debit">$${fmt(totalDebits)}</td>
            <td class="num mono credit">$${fmt(totalCredits)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${auditEvents.length > 0 ? `
    <!-- Audit Trail -->
    <div class="section">
      <div class="section-label">Audit Trail</div>
      <h2>Activity Log (${auditEvents.length} event${auditEvents.length !== 1 ? 's' : ''})</h2>
      <table>
        <thead>
          <tr>
            <th style="width:140px">Timestamp</th>
            <th>Event</th>
            <th style="width:80px">Actor</th>
          </tr>
        </thead>
        <tbody>
          ${[...auditEvents].reverse().map((ev) => `
          <tr>
            <td class="mono date" style="font-size:8pt;color:#6b6560">${fmtAuditTs(ev.timestamp)}</td>
            <td>${escHtml(formatAuditEvent(ev))}</td>
            <td style="font-family:'Arial',sans-serif;font-size:9pt;color:#6b6560">${escHtml(ev.actor)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Footer -->
    <footer class="report-footer">
      <span>Generated by <strong>CloseBooks</strong> — AI-Powered Month-End Close · <a href="https://closebooks-app.vercel.app" style="color:#2d5a27;text-decoration:none">closebooks-app.vercel.app</a></span>
      <span>Confidential · ${escHtml(job.client_name)}</span>
    </footer>

  </div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Summary (branded, client-facing)
// ─────────────────────────────────────────────────────────────────────────────

function buildClientSummaryHtml(job: CategorizationJob, firm: FirmSettings): string {
  const approved   = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited')
  const pending    = job.transactions.filter((t) => t.status === 'pending').length
  const flagged    = job.transactions.filter((t) => t.status === 'flagged').length
  const categoryRows = buildCategoryBreakdown(approved)
  const totalDebits  = approved.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalCredits = approved.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const netFlow      = totalCredits - totalDebits
  const generatedAt  = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const accent     = escHtml(firm.accentColor || '#2d5a27')
  const firmName   = firm.firmName   || 'Your Accounting Firm'
  const tagline    = firm.firmTagline || 'Certified Public Accountants'
  const preparedBy = firm.preparedBy || firmName

  const catRows = categoryRows.slice(0, 20).map((r) => `
    <tr>
      <td>${escHtml(r.cat)}</td>
      <td class="num">${r.count}</td>
      <td class="num mono${r.debit > 0 ? ' debit' : ''}">${r.debit > 0 ? `$${fmt(r.debit)}` : '—'}</td>
      <td class="num mono${r.credit > 0 ? ' credit' : ''}">${r.credit > 0 ? `$${fmt(r.credit)}` : '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Month-End Summary — ${escHtml(job.client_name)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; font-size: 11pt; color: #1a1714; background: #fff; line-height: 1.5; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 48px 60px; }
    .header-bar { background: ${accent}; color: #fff; padding: 20px 32px; border-radius: 10px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; }
    .firm-name { font-size: 18pt; letter-spacing: -0.01em; font-weight: bold; }
    .firm-tagline { font-size: 9pt; opacity: 0.8; margin-top: 3px; font-family: Arial, sans-serif; }
    .header-right { text-align: right; font-family: Arial, sans-serif; font-size: 9pt; opacity: 0.9; line-height: 1.6; }
    .section { margin-bottom: 32px; }
    .section-label { font-family: Arial, sans-serif; font-size: 8pt; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase; color: ${accent}; margin-bottom: 8px; }
    h2 { font-size: 14pt; letter-spacing: -0.01em; color: #1a1714; margin-bottom: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 8px; }
    .kpi { border: 1.5px solid #e0dbd4; border-radius: 10px; padding: 16px 18px; }
    .kpi .val { font-size: 22pt; font-weight: bold; line-height: 1; }
    .kpi .lbl { font-family: Arial, sans-serif; font-size: 8.5pt; color: #6b6560; margin-top: 5px; }
    .kpi.accent { border-color: ${accent}; background: #f6faf5; }
    .kpi.accent .val { color: ${accent}; }
    .net-flow { padding: 14px 18px; border-radius: 10px; font-family: Arial, sans-serif; font-size: 10pt; }
    .net-flow.positive { background: #f0fdf4; border: 1.5px solid #86efac; color: #166534; }
    .net-flow.negative { background: #fef2f2; border: 1.5px solid #fca5a5; color: #991b1b; }
    .net-flow strong { font-size: 13pt; }
    table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9pt; }
    th { text-align: left; font-size: 8pt; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6560; border-bottom: 1.5px solid #e0dbd4; padding: 7px 8px; background: #faf8f4; }
    td { padding: 7px 8px; border-bottom: 1px solid #f0ebe3; color: #1a1714; }
    tr:last-child td { border-bottom: none; }
    .num { text-align: right; white-space: nowrap; }
    .mono { font-family: 'Courier New', monospace; }
    .debit { color: #991b1b; }
    .credit { color: #166534; }
    .totals-row td { border-top: 1.5px solid #1a1714; font-weight: bold; }
    .notice { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-family: Arial, sans-serif; font-size: 9pt; color: #854d0e; margin-top: 8px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0dbd4; font-family: Arial, sans-serif; font-size: 8pt; color: #a09a94; display: flex; justify-content: space-between; align-items: center; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1a1714; color: #fff; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; font-family: Arial, sans-serif; font-size: 9pt; z-index: 100; }
    .print-bar button { background: ${accent}; color: #fff; border: none; padding: 7px 18px; border-radius: 8px; font-size: 9pt; font-weight: bold; cursor: pointer; }
    @media screen { body { padding-top: 46px; } }
    @media print { .print-bar { display: none; } body { padding-top: 0; font-size: 10pt; } .page { padding: 24px 36px 40px; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span><strong>${escHtml(firmName)}</strong> · Month-End Summary for ${escHtml(job.client_name)}</span>
    <button onclick="window.print()">⬇ Save as PDF</button>
  </div>
  <div class="page">
    <div class="header-bar">
      <div>
        <div class="firm-name">${escHtml(firmName)}</div>
        <div class="firm-tagline">${escHtml(tagline)}</div>
      </div>
      <div class="header-right">
        <strong>${escHtml(job.client_name)}</strong><br/>
        Month-End Summary<br/>
        ${generatedAt}
      </div>
    </div>

    <div class="section">
      <div class="section-label">Overview</div>
      <h2>Your ${fmtDate(job.created_at)} Close</h2>
      <div class="kpi-grid">
        <div class="kpi accent">
          <div class="val">${approved.length}</div>
          <div class="lbl">Transactions Reviewed &amp; Approved</div>
        </div>
        <div class="kpi">
          <div class="val">$${fmt(totalDebits)}</div>
          <div class="lbl">Total Expenses</div>
        </div>
        <div class="kpi">
          <div class="val">$${fmt(totalCredits)}</div>
          <div class="lbl">Total Income</div>
        </div>
      </div>
      <div class="net-flow ${netFlow >= 0 ? 'positive' : 'negative'}">
        Net cash flow this period: <strong>${netFlow >= 0 ? '+' : ''}$${fmt(Math.abs(netFlow))}</strong>
        ${netFlow >= 0 ? '(income exceeds expenses)' : '(expenses exceed income)'}
      </div>
      ${pending > 0 || flagged > 0 ? `
      <div class="notice" style="margin-top:12px">
        ⚠ ${pending > 0 ? `${pending} transaction${pending !== 1 ? 's' : ''} still under review` : ''}${pending > 0 && flagged > 0 ? ' · ' : ''}${flagged > 0 ? `${flagged} flagged for follow-up` : ''}. Your accountant will reach out if any clarification is needed.
      </div>` : ''}
    </div>

    <div class="section">
      <div class="section-label">Expense &amp; Income Breakdown</div>
      <h2>By Category</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align:right">Transactions</th>
            <th style="text-align:right">Expenses</th>
            <th style="text-align:right">Income</th>
          </tr>
        </thead>
        <tbody>${catRows}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td>Total</td>
            <td class="num">${approved.length}</td>
            <td class="num mono debit">$${fmt(totalDebits)}</td>
            <td class="num mono credit">$${fmt(totalCredits)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <footer class="footer">
      <span>Prepared by <strong>${escHtml(preparedBy)}</strong> · Powered by <a href="https://closebooks-app.vercel.app" style="color:#2d5a27;text-decoration:none">CloseBooks</a></span>
      <span>Confidential — prepared for ${escHtml(job.client_name)} · ${generatedAt}</span>
    </footer>
  </div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.job) {
    return NextResponse.json({ error: 'Missing job' }, { status: 400 })
  }

  const job         = body.job as CategorizationJob
  const auditEvents = (body.auditEvents ?? []) as AuditEvent[]
  const mode        = body.mode as string | undefined

  if (mode === 'client-summary') {
    const firm = (body.firmSettings ?? {}) as FirmSettings
    const html = buildClientSummaryHtml(job, firm)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${job.client_name.replace(/\s+/g, '_')}_month_end_summary.html"`,
      },
    })
  }

  const html = buildHtml(job, auditEvents)

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${job.client_name.replace(/\s+/g, '_')}_close_report.html"`,
    },
  })
}
