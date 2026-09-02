'use client'

import type { CSSProperties, ReactNode } from 'react'
import { InputSpinner } from '@/components/ui/InputSpinner'
import {
  INPUT_CLASS,
  type InputSize,
  iconPadding,
} from '@/components/ui/inputStyles'

export function InputIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        pointerEvents: 'none',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

export function InputAffix({
  side,
  children,
}: {
  side: 'left' | 'right'
  children: ReactNode
}) {
  return (
    <span
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [side]: 'var(--space-3)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {children}
    </span>
  )
}

export function InputShell({
  size,
  leftIcon,
  rightIcon,
  loading,
  children,
  style,
}: {
  size: InputSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  children: ReactNode
  style?: CSSProperties
}) {
  const hasLeft = Boolean(leftIcon)
  const hasRight = Boolean(rightIcon || loading)

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style,
      }}
    >
      {hasLeft ? <InputAffix side="left">{leftIcon}</InputAffix> : null}
      {children}
      {loading ? (
        <InputAffix side="right">
          <InputSpinner size={size} />
        </InputAffix>
      ) : hasRight ? (
        <InputAffix side="right">{rightIcon}</InputAffix>
      ) : null}
    </div>
  )
}

export function affixPaddingStyle(
  size: InputSize,
  leftIcon?: ReactNode,
  rightIcon?: ReactNode,
  loading?: boolean,
): CSSProperties {
  const style: CSSProperties = {}
  if (leftIcon) {
    style.paddingLeft = iconPadding('left', size)
  }
  if (rightIcon || loading) {
    style.paddingRight = iconPadding('right', size)
  }
  return style
}

export function inputDataAttrs(tone: string, invalid: boolean) {
  return {
    className: INPUT_CLASS,
    'data-tone': tone,
    'data-invalid': invalid ? 'true' : 'false',
  }
}
