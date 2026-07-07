'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import {
  affixPaddingStyle,
  inputDataAttrs,
  InputAffix,
  InputIcon,
  InputShell,
} from '@/components/ui/InputControl'
import {
  controlBaseStyle,
  disabledStyle,
  type InputSize,
  type InputTone,
} from '@/components/ui/inputStyles'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  tone?: InputTone
  size?: InputSize
  invalid?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    tone = 'default',
    size = 'md',
    invalid = false,
    loading = false,
    disabled,
    readOnly,
    required,
    leftIcon,
    rightIcon,
    style,
    className,
    'aria-invalid': ariaInvalid,
    'aria-busy': ariaBusy,
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading)
  const dataAttrs = inputDataAttrs(tone, invalid)
  const fieldStyle = {
    ...controlBaseStyle(size, tone, invalid),
    ...disabledStyle(isDisabled, Boolean(readOnly)),
    ...affixPaddingStyle(size, leftIcon, rightIcon, loading),
    ...style,
  }

  return (
    <InputShell size={size} leftIcon={leftIcon} rightIcon={rightIcon} loading={loading}>
      <input
        ref={ref}
        disabled={isDisabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={ariaInvalid ?? (invalid ? true : undefined)}
        aria-required={required || undefined}
        aria-busy={ariaBusy ?? (loading || undefined)}
        aria-disabled={isDisabled || undefined}
        className={[dataAttrs.className, className].filter(Boolean).join(' ')}
        data-tone={dataAttrs['data-tone']}
        data-invalid={dataAttrs['data-invalid']}
        style={fieldStyle}
        {...rest}
      />
    </InputShell>
  )
})

export { InputIcon, InputAffix }
export default Input
