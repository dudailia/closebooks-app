'use client'
import { useEffect, useRef, useState } from 'react'
import { loadFirmSettings, saveFirmSettings, type FirmSettings } from '@/lib/firmSettings'

export default function BrandingSettings() {
  const [s, setS] = useState<FirmSettings | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setS(loadFirmSettings())
  }, [])

  if (!s) return null

  function update(patch: Partial<FirmSettings>) {
    const next = { ...s!, ...patch }
    setS(next)
    void saveFirmSettings(next)
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/firm/logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      update({ logoUrl: data.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const primary = s.primaryColor ?? '#2d5a27'
  const accent = s.accentColor ?? '#b8734a'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }} className="branding-grid">
      <style jsx>{`
        @media (max-width: 820px) {
          :global(.branding-grid) { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ padding: 24, backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1714' }}>Client-facing branding</h2>
        <p style={{ margin: '4px 0 18px', fontSize: 13, color: '#6b6560' }}>
          These colors and your logo appear on client emails and portal pages. Nothing from CloseBooks is shown to clients.
        </p>

        <Row label="Logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {s.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.logoUrl}
                alt="Firm logo"
                style={{
                  height: 40,
                  maxWidth: 160,
                  objectFit: 'contain',
                  border: '1px solid #e0dbd4',
                  borderRadius: 6,
                  padding: 4,
                  backgroundColor: '#faf8f4',
                }}
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={onLogoChange}
              disabled={uploading}
              style={{ fontSize: 13 }}
            />
            {uploading && <span style={{ fontSize: 12, color: '#6b6560' }}>Uploading…</span>}
            {s.logoUrl && !uploading && (
              <button
                type="button"
                onClick={() => update({ logoUrl: undefined })}
                style={{ fontSize: 12, background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Remove
              </button>
            )}
          </div>
          {error && <p style={{ marginTop: 6, fontSize: 12, color: '#991b1b' }}>{error}</p>}
          <p style={{ marginTop: 6, fontSize: 11, color: '#a09a94' }}>PNG, JPG, SVG, or WebP · 512 KB max.</p>
        </Row>

        <Row label="Primary color">
          <ColorPicker value={primary} onChange={(v) => update({ primaryColor: v })} />
        </Row>
        <Row label="Accent color">
          <ColorPicker value={accent} onChange={(v) => update({ accentColor: v })} />
        </Row>
        <Row label="Client-facing firm name">
          <Txt
            value={s.clientFacingName ?? ''}
            placeholder={s.firmName || 'Your firm name'}
            onChange={(v) => update({ clientFacingName: v || undefined })}
          />
          <p style={{ marginTop: 4, fontSize: 11, color: '#a09a94' }}>Shown in email headers and portal pages.</p>
        </Row>
        <Row label='Email "from" name'>
          <Txt
            value={s.emailFromName ?? ''}
            placeholder={`Reports from ${s.firmName || 'your firm'}`}
            onChange={(v) => update({ emailFromName: v || undefined })}
          />
        </Row>
        <Row label="Reply-to email">
          <Txt
            value={s.emailReplyTo ?? ''}
            placeholder="hello@yourfirm.com"
            onChange={(v) => update({ emailReplyTo: v || undefined })}
          />
        </Row>
      </div>

      <aside
        style={{
          padding: 20,
          backgroundColor: '#fff',
          border: '1px solid #e0dbd4',
          borderRadius: 14,
          position: 'sticky',
          top: 88,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#6b6560',
            margin: 0,
            marginBottom: 12,
          }}
        >
          Live preview
        </p>

        <div style={{ border: `1px solid ${primary}33`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', backgroundColor: primary, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, minHeight: 52 }}>
            {s.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logoUrl} alt="" style={{ height: 24, maxWidth: 140, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {s.clientFacingName ?? s.firmName ?? 'Your Firm'}
              </span>
            )}
          </div>
          <div style={{ padding: 16, fontSize: 13, color: '#1a1714', backgroundColor: '#fff' }}>
            <p style={{ margin: 0, marginBottom: 10, color: primary, fontWeight: 600 }}>
              Your books are closed ✓
            </p>
            <p style={{ margin: 0, color: '#6b6560', lineHeight: 1.55, fontSize: 12 }}>
              Revenue was up 12% this month. Net position improved.
            </p>
            <div style={{ marginTop: 12, height: 6, backgroundColor: '#f0ebe3', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', backgroundColor: accent }} />
            </div>
            <button
              type="button"
              style={{
                marginTop: 14,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: primary,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'default',
              }}
            >
              View in portal
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: '#6b6560',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function Txt({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 10px',
        border: '1px solid #e0dbd4',
        borderRadius: 8,
        fontSize: 13,
        color: '#1a1714',
        backgroundColor: '#faf8f4',
        boxSizing: 'border-box',
      }}
    />
  )
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 40,
          height: 32,
          border: '1px solid #e0dbd4',
          borderRadius: 6,
          cursor: 'pointer',
          padding: 0,
          backgroundColor: 'transparent',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 120,
          padding: '6px 10px',
          border: '1px solid #e0dbd4',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'monospace',
          color: '#1a1714',
          backgroundColor: '#faf8f4',
        }}
      />
    </div>
  )
}
