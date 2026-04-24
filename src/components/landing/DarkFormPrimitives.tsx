'use client'
import { forwardRef, InputHTMLAttributes, ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes } from 'react'

export function DarkCard({
  children,
  style,
}: {
  children: ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        backgroundColor: '#111118',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function DarkLabel({
  children,
  htmlFor,
}: {
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#6E6E85',
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  )
}

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 14,
  color: '#F0F0F5',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  outline: 'none',
  transition: 'border-color 160ms, box-shadow 160ms',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export const DarkInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function DarkInput(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        style={{ ...inputStyles, ...props.style }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#00D97E'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,217,126,0.18)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
      />
    )
  }
)

export const DarkSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function DarkSelect(props, ref) {
    return (
      <select
        ref={ref}
        {...props}
        style={{ ...inputStyles, appearance: 'none', cursor: 'pointer', ...props.style }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#00D97E'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,217,126,0.18)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
      >
        {props.children}
      </select>
    )
  }
)

interface DarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  block?: boolean
}

export function DarkButton({
  variant = 'primary',
  block,
  children,
  style,
  ...rest
}: DarkButtonProps) {
  const base: React.CSSProperties = {
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.55 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: block ? '100%' : undefined,
    transition: 'transform 160ms, box-shadow 160ms, background 160ms, border-color 160ms',
    fontFamily: 'inherit',
  }
  const primary: React.CSSProperties = {
    color: '#00110A',
    background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,217,126,0.22)',
  }
  const ghost: React.CSSProperties = {
    color: '#F0F0F5',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
  }
  return (
    <button
      {...rest}
      style={{ ...base, ...(variant === 'primary' ? primary : ghost), ...style }}
      onMouseEnter={(e) => {
        if (rest.disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,217,126,0.36)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
        }
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (rest.disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,217,126,0.22)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        }
        rest.onMouseLeave?.(e)
      }}
    >
      {children}
    </button>
  )
}

export function DarkDivider({ label }: { label?: string }) {
  if (!label) {
    return (
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          margin: '20px 0',
        }}
      />
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '20px 0',
      }}
    >
      <span style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <span
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6E6E85',
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

export function DarkError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <div
      role="alert"
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: 'rgba(255,93,115,0.1)',
        border: '1px solid rgba(255,93,115,0.3)',
        color: '#FF8FA0',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
