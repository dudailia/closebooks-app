'use client'

import { useEffect } from 'react'

/** Records a session row for /dashboard/settings/sessions */
export default function SessionPulse() {
  useEffect(() => {
    try {
      let id = typeof window !== 'undefined' ? sessionStorage.getItem('cb_session_id') : null
      if (!id && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        id = crypto.randomUUID()
        sessionStorage.setItem('cb_session_id', id)
      }
      if (!id) return
      void fetch('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      })
    } catch {
      /* ignore */
    }
  }, [])
  return null
}
