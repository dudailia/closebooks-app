'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CloseBooks] Dashboard error boundary caught:', error)
  }, [error])

  return (
    <div style={{
      padding: '80px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backgroundColor: '#faf8f4',
    }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚠</div>
      <h2 style={{
        fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        fontSize: 24,
        fontWeight: 400,
        color: '#1a1714',
        marginBottom: 8,
      }}>
        This page hit an error
      </h2>
      <p style={{ color: '#6b6560', fontSize: 14, marginBottom: 6, maxWidth: 400 }}>
        Something went wrong loading this page. Your data is safe.
      </p>
      {error.digest && (
        <p style={{ fontSize: 11, color: '#a09a94', fontFamily: 'monospace', marginBottom: 24 }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{
            backgroundColor: '#2d5a27', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          style={{
            backgroundColor: '#fff', color: '#1a1714',
            border: '1px solid #e8e0d4', borderRadius: 8,
            padding: '10px 24px', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
