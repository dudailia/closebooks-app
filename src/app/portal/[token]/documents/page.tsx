'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import DocumentUpload from '@/components/portal/DocumentUpload'
import type { PortalDocument } from '@/lib/portal/types'

export default function DocumentsPage() {
  const params = useParams()
  const token = params.token as string
  const [documents, setDocuments] = useState<(PortalDocument & { signedUrl?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [accentColor, setAccentColor] = useState('#b8734a')

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/documents?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadDocs()
    // Read accent from CSS custom property
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    if (accent) setAccentColor(accent)
  }, [loadDocs])

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        Loading documents…
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 26, color: '#1a1714', margin: '0 0 4px' }}>
          Document Center
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          Upload requested documents and view what's been shared with your accountant.
        </p>
      </div>
      <DocumentUpload
        token={token}
        accentColor={accentColor}
        documents={documents}
        onRefresh={loadDocs}
      />
    </div>
  )
}
