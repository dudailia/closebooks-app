'use client'

import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { HelperText } from '@/components/ui/HelperText'
import { Label } from '@/components/ui/Label'
import { mergeDescribedBy } from '@/components/ui/inputStyles'

export type FieldTone = 'default' | 'brand'

export interface FieldProps {
  label?: ReactNode
  htmlFor?: string
  id?: string
  tone?: FieldTone
  helperText?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactElement<{ id?: string }>
}

export function Field({
  label,
  htmlFor,
  id: idProp,
  tone = 'default',
  helperText,
  error,
  required,
  children,
}: FieldProps) {
  const autoId = useId()
  const fieldId = idProp ?? htmlFor ?? autoId.replace(/:/g, '')
  const helperId = helperText ? `${fieldId}-helper` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = mergeDescribedBy(helperId, errorId)
  const invalid = Boolean(error)

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: (children.props as { id?: string }).id ?? fieldId,
        'aria-describedby': mergeDescribedBy(
          describedBy,
          (children.props as { 'aria-describedby'?: string })['aria-describedby'],
        ),
        'aria-invalid': invalid
          ? true
          : (children.props as { 'aria-invalid'?: boolean })['aria-invalid'],
        'aria-required':
          required ?? (children.props as { 'aria-required'?: boolean })['aria-required'],
        required: required ?? (children.props as { required?: boolean }).required,
        invalid: invalid || (children.props as { invalid?: boolean }).invalid,
      })
    : children

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {label ? (
        <Label htmlFor={fieldId} tone={tone} required={required}>
          {label}
        </Label>
      ) : null}
      {control}
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {error ? <ErrorMessage id={errorId}>{error}</ErrorMessage> : null}
    </div>
  )
}

export default Field
