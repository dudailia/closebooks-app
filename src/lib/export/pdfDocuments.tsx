import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CategorizationJob, Transaction } from '@/types'
import type { FirmSettings } from '@/lib/firmSettings'
import { computeFinancials, compareToPrior, trialBalanceFromJob } from '@/lib/export/financials'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const styles = (accent: string) =>
  StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1714' },
    header: { borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 8, marginBottom: 16 },
    firm: { fontSize: 16, fontWeight: 'bold', color: accent },
    sub: { fontSize: 9, color: '#666', marginTop: 4 },
    h1: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    h2: { fontSize: 11, fontWeight: 'bold', marginTop: 12, marginBottom: 6, color: accent },
    row: { flexDirection: 'row', marginBottom: 4 },
    right: { textAlign: 'right' },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', marginBottom: 2 },
    footer: { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 8, color: '#888', borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 6 },
    box: { backgroundColor: '#f5f5f0', padding: 8, marginBottom: 8 },
  })

function defaultFirm(): FirmSettings {
  return {
    firmName: 'Accounting Firm',
    firmTagline: '',
    accentColor: '#2d5a27',
    preparedBy: '',
    inboxSlug: '',
  }
}

export function CloseSummaryPdfDoc({
  job,
  firm = defaultFirm(),
  previousJob,
}: {
  job: CategorizationJob
  firm?: FirmSettings
  previousJob?: CategorizationJob | null
}) {
  const accent = firm.accentColor || '#2d5a27'
  const s = styles(accent)
  const fin = computeFinancials(job)
  const cmp = compareToPrior(fin, previousJob ?? null)
  const autoPct = job.total_transactions > 0 ? Math.round((fin.autoApproved / job.total_transactions) * 100) : 0

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <Text style={s.firm}>{firm.firmName || 'CloseBooks'}</Text>
          <Text style={s.sub}>{firm.firmTagline || 'Month-end close'}</Text>
        </View>
        <Text style={s.h1}>Close Summary</Text>
        <Text style={{ marginBottom: 6 }}>Client: {job.client_name}</Text>
        <Text style={{ marginBottom: 8 }}>Close date: {job.created_at.slice(0, 10)}</Text>
        <View style={s.box}>
          <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Key figures (approved/edited transactions)</Text>
          <View style={s.row}>
            <Text style={{ flex: 2 }}>Total revenue (credits)</Text>
            <Text style={[s.right, { flex: 1 }]}>${fmt(fin.totalRevenue)}</Text>
          </View>
          <View style={s.row}>
            <Text style={{ flex: 2 }}>Total expenses (debits)</Text>
            <Text style={[s.right, { flex: 1 }]}>${fmt(fin.totalExpenses)}</Text>
          </View>
          <View style={s.row}>
            <Text style={{ flex: 2 }}>Net</Text>
            <Text style={[s.right, { flex: 1 }]}>${fmt(fin.netIncome)}</Text>
          </View>
        </View>
        {cmp && (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.h2}>vs prior period</Text>
            <Text>
              Revenue: {cmp.revDelta >= 0 ? '+' : ''}${fmt(cmp.revDelta)}
              {cmp.revPct != null ? ` (${cmp.revPct >= 0 ? '+' : ''}${cmp.revPct.toFixed(1)}%)` : ''}
            </Text>
            <Text>
              Expenses: {cmp.expDelta >= 0 ? '+' : ''}${fmt(cmp.expDelta)}
              {cmp.expPct != null ? ` (${cmp.expPct >= 0 ? '+' : ''}${cmp.expPct.toFixed(1)}%)` : ''}
            </Text>
          </View>
        )}
        <Text style={s.h2}>AI categorization</Text>
        <Text>High-confidence auto-approved: {fin.autoApproved} ({autoPct}% of all)</Text>
        <Text>Flagged: {fin.flagged}</Text>
        <Text>Pending: {fin.pending}</Text>
        <Text style={{ marginTop: 20, fontSize: 9 }}>
          Prepared by {firm.preparedBy || firm.firmName || '—'} using CloseBooks
        </Text>
        <Text style={s.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} · Confidential`} fixed />
      </Page>
    </Document>
  )
}

export function TrialBalancePdfDoc({
  job,
  firm = defaultFirm(),
  previousJob,
}: {
  job: CategorizationJob
  firm?: FirmSettings
  previousJob?: CategorizationJob | null
}) {
  const accent = firm.accentColor || '#2d5a27'
  const s = styles(accent)
  const rows = trialBalanceFromJob(job)
  const prevMap = new Map<string, { debit: number; credit: number }>()
  if (previousJob) {
    for (const r of trialBalanceFromJob(previousJob)) {
      prevMap.set(r.code, { debit: r.debit, credit: r.credit })
    }
  }
  let tDebit = 0
  let tCredit = 0
  const byType: Record<string, { debit: number; credit: number }> = {}
  for (const r of rows) {
    tDebit += r.debit
    tCredit += r.credit
    const bt = byType[r.type] ?? { debit: 0, credit: 0 }
    bt.debit += r.debit
    bt.credit += r.credit
    byType[r.type] = bt
  }
  const diff = Math.abs(tDebit - tCredit)

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <Text style={s.firm}>{firm.firmName}</Text>
          <Text style={s.sub}>Trial Balance — {job.client_name}</Text>
        </View>
        <View style={s.tableHeader}>
          <Text style={{ width: '12%' }}>Code</Text>
          <Text style={{ width: '26%' }}>Account</Text>
          <Text style={{ width: '10%' }}>Type</Text>
          <Text style={{ width: '14%', textAlign: 'right' }}>Debit</Text>
          <Text style={{ width: '14%', textAlign: 'right' }}>Credit</Text>
          <Text style={{ width: '24%', textAlign: 'right' }}>Prior net Δ</Text>
        </View>
        {rows.map((r) => {
          const p = prevMap.get(r.code)
          const net = r.debit - r.credit
          const prevNet = p ? p.debit - p.credit : null
          const delta = prevNet != null ? net - prevNet : null
          return (
            <View key={r.code} style={s.tableRow}>
              <Text style={{ width: '12%' }}>{r.code}</Text>
              <Text style={{ width: '26%' }}>{r.name}</Text>
              <Text style={{ width: '10%' }}>{r.type}</Text>
              <Text style={{ width: '14%', textAlign: 'right' }}>{r.debit > 0 ? fmt(r.debit) : '—'}</Text>
              <Text style={{ width: '14%', textAlign: 'right' }}>{r.credit > 0 ? fmt(r.credit) : '—'}</Text>
              <Text style={{ width: '24%', textAlign: 'right' }}>
                {delta != null ? (delta >= 0 ? '+' : '') + fmt(delta) : '—'}
              </Text>
            </View>
          )
        })}
        {Object.entries(byType).map(([type, v]) => (
          <View key={type} style={[s.tableRow, { marginTop: 4 }]}>
            <Text style={{ width: '48%' }}>Subtotal {type}</Text>
            <Text style={{ width: '14%', textAlign: 'right' }}>{fmt(v.debit)}</Text>
            <Text style={{ width: '14%', textAlign: 'right' }}>{fmt(v.credit)}</Text>
            <Text style={{ width: '24%' }} />
          </View>
        ))}
        <View style={[s.tableRow, { marginTop: 8, borderTopWidth: 1, paddingTop: 6 }]}>
          <Text style={{ width: '48%', fontWeight: 'bold' }}>Grand total</Text>
          <Text style={{ width: '14%', textAlign: 'right', fontWeight: 'bold' }}>{fmt(tDebit)}</Text>
          <Text style={{ width: '14%', textAlign: 'right', fontWeight: 'bold' }}>{fmt(tCredit)}</Text>
          <Text style={{ width: '24%', textAlign: 'right', fontSize: 8 }}>Out of balance: {fmt(diff)}</Text>
        </View>
        <Text style={{ marginTop: 10, fontSize: 8, color: '#666' }}>
          Prepared by {firm.firmName} using CloseBooks. TB from categorized transactions.
        </Text>
        <Text style={s.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}

function groupByAccount(job: CategorizationJob): Map<string, Transaction[]> {
  const m = new Map<string, Transaction[]>()
  for (const t of job.transactions) {
    const code = t.final_account_code ?? t.suggested_account_code ?? '—'
    const list = m.get(code) ?? []
    list.push(t)
    m.set(code, list)
  }
  return m
}

export function TransactionDetailPdfDoc({ job, firm = defaultFirm() }: { job: CategorizationJob; firm?: FirmSettings }) {
  const accent = firm.accentColor || '#2d5a27'
  const s = styles(accent)
  const groups = groupByAccount(job)
  const sortedCodes = Array.from(groups.keys()).sort()

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <Text style={s.firm}>{firm.firmName}</Text>
          <Text style={s.sub}>Transaction detail — {job.client_name}</Text>
        </View>
        <Text style={{ marginBottom: 10, fontSize: 9 }}>{new Date().toISOString().slice(0, 10)}</Text>
        <View style={s.tableHeader}>
          <Text style={{ width: '16%' }}>Date</Text>
          <Text style={{ width: '38%' }}>Description</Text>
          <Text style={{ width: '14%', textAlign: 'right' }}>Debit</Text>
          <Text style={{ width: '14%', textAlign: 'right' }}>Credit</Text>
          <Text style={{ width: '18%' }}>Flags / status</Text>
        </View>
        {sortedCodes.map((code) => {
          const txs = groups.get(code) ?? []
          const net = txs.reduce((sum, t) => sum + (t.type === 'debit' ? t.amount : -t.amount), 0)
          const flags = (t: Transaction) =>
            [t.status === 'flagged' ? 'flagged' : '', ...(t.validation_flags ?? [])].filter(Boolean).join(', ')
          return (
            <View key={code} style={{ marginBottom: 10 }} wrap={false}>
              <Text style={s.h2}>GL {code}</Text>
              {txs.map((t) => (
                <View key={t.id} style={s.tableRow}>
                  <Text style={{ width: '16%' }}>{t.date}</Text>
                  <Text style={{ width: '38%' }}>{t.description.slice(0, 55)}</Text>
                  <Text style={{ width: '14%', textAlign: 'right' }}>{t.type === 'debit' ? fmt(t.amount) : ''}</Text>
                  <Text style={{ width: '14%', textAlign: 'right' }}>{t.type === 'credit' ? fmt(t.amount) : ''}</Text>
                  <Text style={{ width: '18%', fontSize: 7 }}>{flags(t) || t.status}</Text>
                </View>
              ))}
              <Text style={{ fontSize: 9, marginTop: 2 }}>Subtotal net: ${fmt(net)}</Text>
            </View>
          )
        })}
        <Text style={s.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}

export function BankReconciliationPdfDoc({
  job,
  firm = defaultFirm(),
  bankBalance = 0,
  bookBalance,
  outstandingChecks = 0,
  depositsInTransit = 0,
}: {
  job: CategorizationJob
  firm?: FirmSettings
  bankBalance?: number
  bookBalance?: number
  outstandingChecks?: number
  depositsInTransit?: number
}) {
  const accent = firm.accentColor || '#2d5a27'
  const s = styles(accent)
  const fin = computeFinancials(job)
  const book = bookBalance ?? fin.netIncome
  const adjustedBank = bankBalance - outstandingChecks + depositsInTransit
  const match = Math.abs(adjustedBank - book) < 0.02

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <Text style={s.firm}>{firm.firmName}</Text>
          <Text style={s.sub}>Bank reconciliation — {job.client_name}</Text>
        </View>
        <Text style={{ marginBottom: 8, fontSize: 9 }}>
          Enter statement balances in your workflow; placeholders below for export.
        </Text>
        <View style={s.row}>
          <Text style={{ flex: 2 }}>Bank statement balance</Text>
          <Text style={[s.right, { flex: 1 }]}>${fmt(bankBalance)}</Text>
        </View>
        <View style={s.row}>
          <Text style={{ flex: 2 }}>Book balance (from close)</Text>
          <Text style={[s.right, { flex: 1 }]}>${fmt(book)}</Text>
        </View>
        <Text style={s.h2}>Reconciling items</Text>
        <View style={s.row}>
          <Text style={{ flex: 2 }}>Outstanding checks</Text>
          <Text style={[s.right, { flex: 1 }]}>${fmt(outstandingChecks)}</Text>
        </View>
        <View style={s.row}>
          <Text style={{ flex: 2 }}>Deposits in transit</Text>
          <Text style={[s.right, { flex: 1 }]}>${fmt(depositsInTransit)}</Text>
        </View>
        <View style={s.row}>
          <Text style={{ flex: 2 }}>Adjusted bank</Text>
          <Text style={[s.right, { flex: 1 }]}>${fmt(adjustedBank)}</Text>
        </View>
        <View style={s.row}>
          <Text style={{ flex: 2 }}>Adjusted book</Text>
          <Text style={[s.right, { flex: 1 }]}>${fmt(book)}</Text>
        </View>
        <Text style={{ marginTop: 12, fontWeight: 'bold', color: match ? accent : '#b91c1c' }}>
          {match ? 'Balances match within $0.02.' : 'Adjust items until bank and book reconcile.'}
        </Text>
        <Text style={s.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}

export function FinancialPackagePdfDoc({
  job,
  firm = defaultFirm(),
  previousJob,
}: {
  job: CategorizationJob
  firm?: FirmSettings
  previousJob?: CategorizationJob | null
}) {
  const accent = firm.accentColor || '#2d5a27'
  const s = styles(accent)
  const fin = computeFinancials(job)
  const rows = trialBalanceFromJob(job)
  let td = 0
  let tc = 0
  for (const r of rows) {
    td += r.debit
    tc += r.credit
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center', color: accent }}>{firm.firmName}</Text>
        <Text style={{ textAlign: 'center', marginBottom: 24 }}>Financial close package</Text>
        <Text style={{ marginBottom: 8 }}>Client: {job.client_name}</Text>
        <Text style={{ marginBottom: 16 }}>Table of contents: 1. Summary 2. Trial balance 3. Transaction detail</Text>
        <Text style={s.h2}>1. Summary</Text>
        <Text>Revenue ${fmt(fin.totalRevenue)} · Expenses ${fmt(fin.totalExpenses)} · Net ${fmt(fin.netIncome)}</Text>
        <Text style={s.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
      <Page size="LETTER" style={s.page}>
        <Text style={s.h1}>2. Trial balance</Text>
        {rows.slice(0, 40).map((r) => (
          <View key={r.code} style={s.tableRow}>
            <Text style={{ width: '15%' }}>{r.code}</Text>
            <Text style={{ width: '40%' }}>{r.name}</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>{r.debit > 0 ? fmt(r.debit) : ''}</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>{r.credit > 0 ? fmt(r.credit) : ''}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 8 }}>Totals: Debit {fmt(td)} Credit {fmt(tc)}</Text>
        <Text style={s.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
