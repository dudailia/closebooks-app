'use client'

import { useEffect, useState } from 'react'
import { loadFirmSettings, saveFirmSettings } from '@/lib/firmSettings'
import type { FirmSettings } from '@/lib/firmSettings'

const ACCENT_PRESETS = [
  { label: 'Forest',  color: '#2d5a27' },
  { label: 'Navy',    color: '#1e3a5f' },
  { label: 'Slate',   color: '#334155' },
  { label: 'Amber',   color: '#b45309' },
  { label: 'Violet',  color: '#6d28d9' },
  { label: 'Rose',    color: '#be185d' },
]

export default function SettingsPage() {
  const [mounted, setMounted]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [settings, setSettings] = useState<FirmSettings>({
    firmName:    '',
    firmTagline: 'Certified Public Accountants',
    accentColor: '#2d5a27',
    preparedBy:  '',
    inboxSlug:   '',
  })

  useEffect(() => {
    setSettings(loadFirmSettings())
    setMounted(true)
  }, [])

  function handleChange(field: keyof FirmSettings, value: string) {
    setSettings((s) => ({ ...s, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    const slug = settings.inboxSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    const next = { ...settings, inboxSlug: slug }
    setSettings(next)
    saveFirmSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 space-y-8 page-enter">

        {/* Header */}
        <div>
          <p className="text-sm font-medium" style={{ color: '#b8734a' }}>Configuration</p>
          <h1
            className="text-3xl mt-0.5"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Firm Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Customize how your firm appears on client-facing reports and summaries.
          </p>
        </div>

        {mounted ? (
          <div
            className="rounded-2xl border p-6 space-y-6"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            {/* Firm name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                Firm Name
              </label>
              <input
                type="text"
                value={settings.firmName}
                onChange={(e) => handleChange('firmName', e.target.value)}
                placeholder="e.g. Smith & Associates CPA"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              />
              <p className="text-xs" style={{ color: '#a09a94' }}>Appears in the header of client summary reports.</p>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={settings.firmTagline}
                onChange={(e) => handleChange('firmTagline', e.target.value)}
                placeholder="e.g. Certified Public Accountants"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              />
            </div>

            {/* Prepared by */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                Prepared By
              </label>
              <input
                type="text"
                value={settings.preparedBy}
                onChange={(e) => handleChange('preparedBy', e.target.value)}
                placeholder="e.g. Jane Smith, CPA"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              />
              <p className="text-xs" style={{ color: '#a09a94' }}>Shown in the footer of client summaries.</p>
            </div>

            {/* Document inbox address */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                Document inbox slug
              </label>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span style={{ color: '#6b6560' }}>books+</span>
                <input
                  type="text"
                  value={settings.inboxSlug}
                  onChange={(e) => handleChange('inboxSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="yourfirm"
                  className="flex-1 min-w-[120px] max-w-[200px] rounded-xl border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                />
                <span style={{ color: '#6b6560' }}>@inbox.closebooks.app</span>
              </div>
              <p className="text-xs" style={{ color: '#a09a94' }}>
                Used on the Inbox page as your firm&apos;s forwarding address. Wire your email provider to deliver into CloseBooks when you enable inbound processing.
              </p>
            </div>

            {/* Accent color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                Brand Color
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => handleChange('accentColor', p.color)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                    style={{
                      borderColor: settings.accentColor === p.color ? p.color : '#e8e0d4',
                      backgroundColor: settings.accentColor === p.color ? `${p.color}15` : '#ffffff',
                      color: '#1a1714',
                      boxShadow: settings.accentColor === p.color ? `0 0 0 2px ${p.color}40` : 'none',
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <label className="text-xs" style={{ color: '#6b6560' }}>Custom:</label>
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                  style={{ borderColor: '#e8e0d4', padding: 2 }}
                />
                <span className="font-mono text-xs" style={{ color: '#6b6560' }}>{settings.accentColor}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium" style={{ color: '#1a1714' }}>Preview</p>
              <div
                className="rounded-xl px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: settings.accentColor }}
              >
                <div>
                  <p className="font-bold text-white text-base leading-tight">
                    {settings.firmName || 'Your Firm Name'}
                  </p>
                  <p className="text-white text-xs mt-0.5" style={{ opacity: 0.8 }}>
                    {settings.firmTagline || 'Certified Public Accountants'}
                  </p>
                </div>
                <div className="text-right text-white text-xs" style={{ opacity: 0.85 }}>
                  <p className="font-medium">Acme Corp</p>
                  <p>Month-End Summary</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: '#a09a94' }}>This is how your header will look on client summaries.</p>
            </div>

            {/* Save */}
            <div className="pt-2">
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: saved ? '#059669' : '#2d5a27' }}
                onMouseEnter={(e) => { if (!saved) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { if (!saved) e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                {saved ? '✓ Saved' : 'Save Settings'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 animate-pulse space-y-4"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-24 rounded" style={{ backgroundColor: '#f0ece4' }} />
                <div className="h-10 w-full rounded-xl" style={{ backgroundColor: '#f0ece4' }} />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
