// ─────────────────────────────────────────────────────────────────────────────
// Receipt / Invoice / Statement parser
// Calls /api/inbox/process-document internally
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedDocument {
  merchant_name: string
  amount: number
  date: string
  items?: Array<{ description: string; amount: number }>
  tax?: number
  category_hint: string
  confidence: number
}

export interface ParsedStatement {
  transactions: Array<{ date: string; description: string; amount: number }>
}

// ─── Receipt ─────────────────────────────────────────────────────────────────

export async function parseReceipt(imageBase64: string): Promise<ParsedDocument> {
  const res = await fetch('/api/inbox/process-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentType: 'receipt', imageBase64 }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`parseReceipt failed (${res.status}): ${text}`)
  }

  const data = await res.json() as {
    merchant: string
    amount: number
    date: string
    items?: Array<{ description: string; amount: number }>
    tax?: number
    category: string
    confidence: number
  }

  return {
    merchant_name: data.merchant,
    amount: data.amount,
    date: data.date,
    items: data.items,
    tax: data.tax,
    category_hint: data.category,
    confidence: data.confidence,
  }
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

export async function parseInvoice(text: string): Promise<ParsedDocument> {
  const res = await fetch('/api/inbox/process-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentType: 'invoice', rawText: text }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`parseInvoice failed (${res.status}): ${errText}`)
  }

  const data = await res.json() as {
    merchant: string
    amount: number
    date: string
    items?: Array<{ description: string; amount: number }>
    tax?: number
    category: string
    confidence: number
  }

  return {
    merchant_name: data.merchant,
    amount: data.amount,
    date: data.date,
    items: data.items,
    tax: data.tax,
    category_hint: data.category,
    confidence: data.confidence,
  }
}

// ─── Statement ────────────────────────────────────────────────────────────────

export async function parseStatement(text: string): Promise<ParsedStatement> {
  const res = await fetch('/api/inbox/process-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentType: 'statement', rawText: text }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`parseStatement failed (${res.status}): ${errText}`)
  }

  const data = await res.json() as {
    transactions?: Array<{ date: string; description: string; amount: number }>
  }

  return {
    transactions: data.transactions ?? [],
  }
}
