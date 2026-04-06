'use client'

import { Component, type ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CloseBooks]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '60vh',
          backgroundColor: '#faf8f4',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            color: '#1a1714',
            marginBottom: 8,
          }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b6560', fontSize: 14, marginBottom: 8, maxWidth: 380 }}>
            This page encountered an unexpected error. Your data is safe.
          </p>
          {this.state.error?.message && (
            <p style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#a09a94',
              backgroundColor: '#f0ebe3',
              padding: '6px 12px',
              borderRadius: 6,
              marginBottom: 24,
              maxWidth: 480,
              wordBreak: 'break-all',
            }}>
              {this.state.error.message}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2d5a27',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
            <Link
              href="/dashboard"
              style={{
                backgroundColor: '#fff',
                color: '#1a1714',
                border: '1px solid #e8e0d4',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
