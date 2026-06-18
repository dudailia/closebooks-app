'use client'

import { useEffect, useState } from 'react'
import { supabaseConfigured } from '@/lib/supabase/client'
import { hydrateFirmData } from '@/lib/hydrateFirmData'
import { LegacyImportBanner } from '@/components/LegacyImportBanner'

export default function FirmDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true)
      return
    }
    void hydrateFirmData()
      .catch(err => console.error('[CloseBooks] Hydration error:', err))
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" style={{ backgroundColor: '#faf8f4' }}>
        <p className="text-sm" style={{ color: '#6b6560' }}>Loading your firm data…</p>
      </div>
    )
  }

  return (
    <>
      <LegacyImportBanner />
      {children}
    </>
  )
}
