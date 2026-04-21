import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DocumentType, ExtractedDocumentData } from './types'

const anthropic = new Anthropic()

// Detect document type from filename + mime type
export function detectDocumentType(fileName: string, mimeType: string): DocumentType {
  const name = fileName.toLowerCase()
  const mime = mimeType.toLowerCase()
  if (mime.includes('csv') || name.endsWith('.csv')) return 'csv'
  if (name.includes('statement') || name.includes('bank')) return 'statement'
  if (name.includes('receipt')) return 'receipt'
  if (name.includes('invoice') || name.includes('inv')) return 'invoice'
  return 'unknown'
}

// Extract data from document using Claude
export async function extractDocumentData(
  base64Content: string,
  mimeType: string,
  documentType: DocumentType,
  fileName: string,
): Promise<ExtractedDocumentData | null> {
  try {
    // For CSVs, parse directly without Claude
    if (documentType === 'csv') {
      return { confidence: 0.8, categoryHint: 'bank-statement' }
    }

    const isImage = mimeType.includes('image/jpeg') || mimeType.includes('image/png') || mimeType.includes('image/webp')
    const isPdf   = mimeType.includes('application/pdf') || fileName.toLowerCase().endsWith('.pdf')

    if (!isImage && !isPdf) {
      return { confidence: 0.5 }
    }

    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } }
      | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }

    const content: ContentBlock[] = []

    if (isImage) {
      const mediaType = mimeType.includes('png') ? 'image/png' : mimeType.includes('webp') ? 'image/webp' : 'image/jpeg'
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Content } })
    } else if (isPdf) {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Content } })
    }

    const prompt = documentType === 'statement'
      ? `Extract all transactions from this bank statement. Return JSON only, no markdown:
{"transactions":[{"date":"YYYY-MM-DD","description":"string","amount":number}],"confidence":number}`
      : `Extract all data from this ${documentType}. Return JSON only, no markdown:
{"merchantName":"string","amount":number,"date":"YYYY-MM-DD","invoiceNumber":"string|null","dueDate":"YYYY-MM-DD|null","lineItems":[{"description":"string","amount":number}],"tax":number|null,"categoryHint":"string","confidence":number}`

    content.push({ type: 'text', text: prompt })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    const raw = message.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
    const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as ExtractedDocumentData
  } catch (err) {
    console.error('[attachmentProcessor] extraction error:', err)
    return { confidence: 0 }
  }
}

// Upload attachment to Supabase Storage
export async function uploadAttachmentToStorage(
  supabase: SupabaseClient,
  firmId: string,
  emailId: string,
  fileName: string,
  base64Content: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64Content, 'base64')
    const path = `${firmId}/${emailId}/${fileName}`

    const { error } = await supabase.storage
      .from('inbox-attachments')
      .upload(path, buffer, { contentType: mimeType, upsert: true })

    if (error) {
      console.error('[attachmentProcessor] storage upload error:', error)
      return null
    }
    return path
  } catch (err) {
    console.error('[attachmentProcessor] upload error:', err)
    return null
  }
}
