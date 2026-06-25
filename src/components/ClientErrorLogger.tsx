'use client'

import { useEffect } from 'react'

// TEMPORARY diagnostic — forwards uncaught client errors + promise rejections to
// /api/client-errors so they appear in Vercel server logs. Remove after the fix is confirmed.
export default function ClientErrorLogger() {
  useEffect(() => {
    function report(payload: Record<string, unknown>) {
      try {
        const data = JSON.stringify({ ...payload, url: window.location.href })
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/client-errors', new Blob([data], { type: 'application/json' }))
        } else {
          void fetch('/api/client-errors', {
            method: 'POST',
            body: data,
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch { /* never let the logger throw */ }
    }
    const onError = (e: ErrorEvent) =>
      report({ source: 'window.onerror', message: e.message, stack: e.error?.stack ?? null })
    const onRejection = (e: PromiseRejectionEvent) =>
      report({ source: 'unhandledrejection', message: e.reason?.message ?? String(e.reason), stack: e.reason?.stack ?? null })
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}
