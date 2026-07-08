'use client'

import { useCallback, useState } from 'react'

type PlaygroundCodeProps = {
  code: string
  language?: string
}

export default function PlaygroundCode({ code, language = 'tsx' }: PlaygroundCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code.trim())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [code])

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-elevated)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--surface-raised)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-raised)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            padding: 'var(--space-1) var(--space-2)',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 'var(--space-4)',
          overflowX: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 'var(--line-height-snug)',
          color: 'var(--text-primary)',
          tabSize: 2,
        }}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
