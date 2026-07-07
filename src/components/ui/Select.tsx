'use client'

import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react'
import {
  affixPaddingStyle,
  inputDataAttrs,
  InputIcon,
  InputShell,
} from '@/components/ui/InputControl'
import {
  controlBaseStyle,
  disabledStyle,
  type InputSize,
  type InputTone,
} from '@/components/ui/inputStyles'

function SelectChevron() {
  return (
    <InputIcon>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </InputIcon>
  )
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  tone?: InputTone
  size?: InputSize
  invalid?: boolean
  loading?: boolean
  leftIcon?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    tone = 'default',
    size = 'md',
    invalid = false,
    loading = false,
    disabled,
    required,
    leftIcon,
    style,
    className,
    children,
    'aria-invalid': ariaInvalid,
    'aria-busy': ariaBusy,
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading)
  const dataAttrs = inputDataAttrs(tone, invalid)
  const showChevron = !loading

  return (
    <InputShell
      size={size}
      leftIcon={leftIcon}
      rightIcon={showChevron ? <SelectChevron /> : undefined}
      loading={loading}
    >
      <select
        ref={ref}
        disabled={isDisabled}
        required={required}
        aria-invalid={ariaInvalid ?? (invalid ? true : undefined)}
        aria-required={required || undefined}
        aria-busy={ariaBusy ?? (loading || undefined)}
        aria-disabled={isDisabled || undefined}
        className={[dataAttrs.className, className].filter(Boolean).join(' ')}
        data-tone={dataAttrs['data-tone']}
        data-invalid={dataAttrs['data-invalid']}
        style={{
          ...controlBaseStyle(size, tone, invalid),
          ...disabledStyle(isDisabled, false),
          ...affixPaddingStyle(size, leftIcon, showChevron ? <SelectChevron /> : undefined, loading),
          appearance: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
    </InputShell>
  )
})

export default Select
