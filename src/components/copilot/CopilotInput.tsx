'use client'

import { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
  placeholder: string
}

export default function CopilotInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
  }

  const canSend = !disabled && !!value.trim()

  return (
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '8px 12px' }}
      onFocus={e => (e.currentTarget.style.borderColor = '#2d5a27')}
      onBlur={e => (e.currentTarget.style.borderColor = '#e8e0d4')}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: '#1a1714', background: 'transparent', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }}
      />
      <button
        onClick={onSubmit}
        disabled={!canSend}
        style={{ flexShrink: 0, background: canSend ? '#2d5a27' : '#e8e0d4', color: canSend ? 'white' : '#9ca3af', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canSend ? 'pointer' : 'default', fontSize: 16, transition: 'background 0.15s' }}
      >
        ↑
      </button>
    </div>
  )
}
