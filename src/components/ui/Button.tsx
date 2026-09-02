'use client'

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand' | 'brand-ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-sm)',
    borderRadius: 'var(--radius-sm)',
    gap: 'var(--space-2)',
  },
  md: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-base)',
    borderRadius: 'var(--radius-md)',
    gap: 'var(--space-2)',
  },
  lg: {
    padding: 'var(--space-4) var(--space-6)',
    fontSize: 'var(--font-size-md)',
    borderRadius: 'var(--radius-md)',
    gap: 'var(--space-3)',
  },
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    color: 'var(--text-inverse)',
    backgroundColor: 'var(--color-action-primary)',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-sm)',
  },
  secondary: {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    boxShadow: 'none',
  },
  ghost: {
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    boxShadow: 'none',
  },
  danger: {
    color: 'var(--text-inverse)',
    backgroundColor: 'var(--color-danger-fg)',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-sm)',
  },
  brand: {
    color: '#00110A',
    background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-accent-dark) 100%)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,200,83,0.22)',
  },
  'brand-ghost': {
    color: 'var(--text-primary)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-strong)',
    boxShadow: 'none',
  },
}

function hoverBackground(variant: ButtonVariant): string | null {
  switch (variant) {
    case 'primary':
      return 'var(--color-action-hover)'
    case 'secondary':
      return 'var(--surface-elevated)'
    case 'ghost':
      return 'var(--surface-elevated)'
    case 'danger':
      return 'var(--color-danger-fg)'
    case 'brand':
    case 'brand-ghost':
      return null
  }
}

function resetVariantStyles(el: HTMLButtonElement, variant: ButtonVariant) {
  const styles = variantStyles[variant]
  if (variant === 'brand') {
    el.style.background = String(styles.background ?? '')
    el.style.transform = ''
    el.style.boxShadow = String(styles.boxShadow ?? '')
    return
  }
  el.style.backgroundColor = String(styles.backgroundColor ?? 'transparent')
  el.style.filter = ''
  if (variant === 'secondary' || variant === 'brand-ghost') {
    el.style.borderColor = String(
      variant === 'brand-ghost' ? 'var(--border-strong)' : 'var(--border-default)',
    )
  }
}

function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
        opacity="0.35"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    style,
    type = 'button',
    onMouseEnter,
    onMouseLeave,
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading)
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-family-sans)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--line-height-tight)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.55 : 1,
    width: fullWidth ? '100%' : undefined,
    transition: [
      `background-color var(--duration-fast) var(--ease-standard)`,
      `background var(--duration-fast) var(--ease-standard)`,
      `border-color var(--duration-fast) var(--ease-standard)`,
      `box-shadow var(--duration-fast) var(--ease-standard)`,
      `transform var(--duration-fast) var(--ease-standard)`,
      `opacity var(--duration-fast) var(--ease-standard)`,
    ].join(', '),
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (isDisabled) return
        const el = e.currentTarget
        if (variant === 'brand') {
          el.style.transform = 'translateY(-1px)'
          el.style.boxShadow = '0 12px 32px rgba(0,200,83,0.36)'
        } else if (variant === 'brand-ghost') {
          el.style.backgroundColor = 'rgba(255,255,255,0.08)'
          el.style.borderColor = 'rgba(255,255,255,0.15)'
        } else {
          const hoverBg = hoverBackground(variant)
          if (hoverBg) el.style.backgroundColor = hoverBg
          if (variant === 'danger') {
            el.style.filter = 'brightness(0.92)'
          }
          if (variant === 'secondary') {
            el.style.borderColor = 'var(--border-strong)'
          }
        }
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return
        resetVariantStyles(e.currentTarget, variant)
        onMouseLeave?.(e)
      }}
      {...rest}
    >
      {loading ? <Spinner size={size} /> : null}
      {loading ? <span style={{ opacity: 0.85 }}>{children}</span> : children}
    </button>
  )
})

export default Button
