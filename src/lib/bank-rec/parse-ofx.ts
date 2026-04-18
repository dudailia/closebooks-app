import type { ParsedStatement } from './types'

function tag(content: string, name: string): string {
  const xml = content.match(new RegExp(`<${name}[^>]*>([^<]+)</${name}>`, 'i'))
  if (xml) return xml[1].trim()
  const sgml = content.match(new RegExp(`<${name}>([^\\n<]+)`, 'i'))
  return sgml ? sgml[1].trim() : ''
}

function blocks(content: string, name: string): string[] {
  const result: string[] = []
  const closed = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'gi')
  let m: RegExpExecArray | null
  while ((m = closed.exec(content))) result.push(m[1])
  if (result.length) return result
  // SGML: no closing tag — split on next opening tag or end
  const open = new RegExp(`<${name}>([\\s\\S]*?)(?=<${name}>|$)`, 'gi')
  while ((m = open.exec(content))) if (m[1].trim()) result.push(m[1])
  return result
}

function ofxDate(raw: string): string {
  const d = raw.replace(/[^\d]/g, '')
  if (d.length >= 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
  return raw
}

export function parseOFX(content: string, bankName = 'Unknown Bank'): ParsedStatement {
  const txns = blocks(content, 'STMTTRN')
  if (!txns.length) throw new Error('No transactions found in OFX/QFX file. Ensure this is a valid bank export.')

  const balBlock = blocks(content, 'LEDGERBAL')[0] ?? ''
  const endingBalance = parseFloat(tag(balBlock || content, 'BALAMT')) || 0
  const acctId = tag(content, 'ACCTID')
  const last4 = acctId.length >= 4 ? acctId.slice(-4) : undefined
  const bankId = tag(content, 'BANKID') || tag(content, 'FID')

  let statementDate = ''

  const lines = txns
    .map(block => {
      const date = ofxDate(tag(block, 'DTPOSTED'))
      if (date > statementDate) statementDate = date
      const raw = parseFloat(tag(block, 'TRNAMT')) || 0
      const refNum = tag(block, 'FITID') || undefined
      return {
        date,
        description: tag(block, 'NAME') || tag(block, 'MEMO') || 'Unknown',
        amount: Math.abs(raw),
        type: (raw < 0 ? 'debit' : 'credit') as 'debit' | 'credit',
        reference_number: refNum,
        match_confidence: undefined,
      }
    })
    .filter(l => l.date && l.amount > 0)

  return {
    bank_name: bankName || bankId || 'Unknown Bank',
    account_number_last4: last4,
    statement_date: statementDate || new Date().toISOString().slice(0, 10),
    beginning_balance: 0,
    ending_balance: endingBalance,
    lines,
  }
}
