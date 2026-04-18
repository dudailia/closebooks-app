import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCSV } from '@/lib/bank-rec/parse-csv'
import { parseOFX } from '@/lib/bank-rec/parse-ofx'
import { parsePDFText } from '@/lib/bank-rec/parse-pdf'
import { createStatement, getStatements, getStatement } from '@/lib/bank-rec/storage'

export async function GET(request: NextRequest) {
  const sb = createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const clientId = searchParams.get('clientId')

  if (id) {
    const stmt = await getStatement(id)
    return stmt
      ? NextResponse.json({ statement: stmt })
      : NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!clientId) return NextResponse.json({ error: 'Missing clientId or id' }, { status: 422 })
  const stmts = await getStatements(clientId)
  return NextResponse.json({ statements: stmts })
}

export async function POST(request: NextRequest) {
  const sb = createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { clientId: string; format: 'csv' | 'ofx' | 'pdf'; content: string; bankName?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { clientId, format, content, bankName } = body
  if (!clientId || !format || !content) {
    return NextResponse.json({ error: 'Missing required fields: clientId, format, content' }, { status: 422 })
  }

  try {
    let parsed
    if (format === 'csv') {
      parsed = parseCSV(content, bankName)
    } else if (format === 'ofx') {
      parsed = parseOFX(content, bankName)
    } else if (format === 'pdf') {
      // Check if content is base64-encoded PDF bytes
      const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(content.replace(/\s/g, '').slice(0, 100))
      if (isBase64) {
        const mod = await import('pdf-parse')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfParse = (mod as any).default ?? mod
        const base64Clean = content.replace(/^data:[^;]+;base64,/, '')
        const result = await pdfParse(Buffer.from(base64Clean, 'base64'))
        if (!result.text?.trim()) {
          return NextResponse.json({ error: 'Scanned PDF detected — please export as CSV from your bank portal instead.' }, { status: 422 })
        }
        parsed = await parsePDFText(result.text)
      } else {
        // content is already extracted plain text
        parsed = await parsePDFText(content)
      }
    } else {
      return NextResponse.json({ error: 'Unsupported format. Use csv, ofx, or pdf.' }, { status: 422 })
    }

    const statement = await createStatement(user.id, clientId, parsed)
    return NextResponse.json({ statement, lineCount: parsed.lines.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Parsing failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
