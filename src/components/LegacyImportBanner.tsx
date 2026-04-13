'use client'

import { useEffect, useState } from 'react'
import { supabaseConfigured } from '@/lib/supabase/client'
import { importLegacyLocalStorageToSupabase } from '@/lib/firmDataHydration'
import { LEGACY_KEYS, readLegacyJson } from '@/lib/legacyLocalStorage'
import { wasLegacyImportSkipped, skipLegacyImportPrompt } from '@/lib/legacyImportFlag'

export function LegacyImportBanner() {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseConfigured || typeof window === 'undefined') return
    if (wasLegacyImportSkipped()) return
    const jobs = readLegacyJson(LEGACY_KEYS.jobs, [])
    if (!Array.isArray(jobs) || jobs.length === 0) return
    setShow(true)
  }, [])

  async function onImport() {
    setBusy(true)
    setMsg(null)
    try {
      const { imported, errors } = await importLegacyLocalStorageToSupabase()
      skipLegacyImportPrompt()
      setDone(true)
      setMsg(`Imported: ${imported.join(', ') || 'nothing'}.${errors.length ? ` Issues: ${errors.join('; ')}` : ''}`)
      window.location.reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    skipLegacyImportPrompt()
    setShow(false)
  }

  if (!show || done) return null

  return (
    <div
      className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2 border-b"
      style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}
    >
      <span>
        We found data from a previous browser session. Import it into your cloud account?
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onImport}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg font-semibold text-white text-xs"
          style={{ backgroundColor: '#2d5a27' }}
        >
          {busy ? 'Importing…' : 'Import now'}
        </button>
        <button type="button" onClick={dismiss} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: '#d97706' }}>
          Skip
        </button>
      </div>
      {msg && <p className="w-full text-xs mt-1">{msg}</p>}
    </div>
  )
}
