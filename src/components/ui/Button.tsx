'use client'

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
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
}

function hoverBackground(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return 'var(--color-action-hover)'
    case 'secondary':
      return 'var(--surface-elevated)'
    case 'ghost':
      return 'var(--surface-elevated)'
    case 'danger':
      return 'var(--color-danger-fg)'
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
      `border-color var(--duration-fast) var(--ease-standard)`,
      `box-shadow var(--duration-fast) var(--ease-standard)`,
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
        el.style.backgroundColor = hoverBackground(variant)
        if (variant === 'danger') {
          el.style.filter = 'brightness(0.92)'
        }
        if (variant === 'secondary') {
          el.style.borderColor = 'var(--border-strong)'
        }
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return
        const el = e.currentTarget
        el.style.backgroundColor = String(variantStyles[variant].backgroundColor ?? 'transparent')
        el.style.filter = ''
        if (variant === 'secondary') {
          el.style.borderColor = 'var(--border-default)'
        }
        onMouseLeave?.(e)
      }}
      {...rest}
    >
      {loading ? <Spinner size={size} /> : null}
      <span style={{ opacity: loading ? 0.85 : 1 }}>{children}</span>
    </button>
  )
})

export default Button
