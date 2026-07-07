'use client'

import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { inputDataAttrs } from '@/components/ui/InputControl'
import {
  controlBaseStyle,
  disabledStyle,
  type InputSize,
  type InputTone,
} from '@/components/ui/inputStyles'
import { InputSpinner } from '@/components/ui/InputSpinner'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  tone?: InputTone
  size?: InputSize
  invalid?: boolean
  loading?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    tone = 'default',
    size = 'md',
    invalid = false,
    loading = false,
    disabled,
    readOnly,
    required,
    style,
    className,
    rows = 4,
    'aria-invalid': ariaInvalid,
    'aria-busy': ariaBusy,
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading)
  const dataAttrs = inputDataAttrs(tone, invalid)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={ref}
        rows={rows}
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
        style={{
          ...controlBaseStyle(size, tone, invalid),
          ...disabledStyle(isDisabled, Boolean(readOnly)),
          minHeight: undefined,
          resize: 'vertical',
          display: 'block',
          ...style,
        }}
        {...rest}
      />
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            pointerEvents: 'none',
          }}
        >
          <InputSpinner size={size} />
        </span>
      ) : null}
    </div>
  )
})

export default Textarea
