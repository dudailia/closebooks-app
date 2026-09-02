import { NextResponse } from 'next/server'

interface FilingRequest {
  recipientId: string
  recipientName: string
  recipientTin: string
  recipientAddress: string
  payerName: string
  payerTin: string
  amount: number
  federalWithheld?: number
  formType: '1099-NEC' | '1099-MISC' | '1099-K'
  taxYear: number
}

function validateFiling(data: FilingRequest): string[] {
  const errors: string[] = []

  if (!data.recipientName?.trim()) errors.push('Recipient name is required')
  if (!data.recipientTin?.trim()) errors.push('Recipient TIN is required')
  if (!data.recipientAddress?.trim()) errors.push('Recipient address is required')
  if (!data.payerName?.trim()) errors.push('Payer name is required')
  if (!data.payerTin?.trim()) errors.push('Payer TIN is required')
  if (!data.amount || data.amount < 600) errors.push('Amount must be at least $600 for 1099 filing')
  if (!data.formType) errors.push('Form type is required')
  if (!data.taxYear || data.taxYear < 2020) errors.push('Valid tax year is required')

  // Basic TIN format validation (9 digits, possibly with dashes)
  const tinClean = data.recipientTin?.replace(/[-\s]/g, '') ?? ''
  if (tinClean.length !== 9 || !/^\d+$/.test(tinClean)) {
    errors.push('Recipient TIN must be 9 digits')
  }

  return errors
}

/**
 * Validates a 1099 payload. It does NOT file anything.
 *
 * CloseBooks has no IRS e-file integration and is not an IRS-authorized
 * e-file provider. This endpoint previously returned a fabricated confirmation
 * number and `status: 'ACCEPTED'`, which told users a legal filing had been
 * submitted when nothing left the server. It now validates the payload and
 * returns 501 so the caller cannot mistake validation for filing.
 *
 * If e-filing is implemented later, it goes through an authorized transmitter
 * (IRS FIRE / IRIS or a provider such as Track1099 or Tax1099) and this route
 * returns a real transmitter receipt — never a locally generated one.
 */
export async function POST(req: Request) {
  try {
    const body: FilingRequest = await req.json()

    const errors = validateFiling(body)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors, message: 'Validation failed' },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        notImplemented: true,
        error: 'E-filing is not implemented.',
        message:
          `The ${body.formType} for ${body.recipientName} passed validation but was NOT filed. ` +
          'CloseBooks has no IRS e-file integration and is not an IRS-authorized e-file provider. ' +
          'Export the validated data and file through an authorized transmitter.',
        validated: {
          formType: body.formType,
          taxYear: body.taxYear,
          recipientName: body.recipientName,
          recipientTin: body.recipientTin.replace(/(\d{2})(\d{3})(\d{4})/, '**-***$3'),
          amount: body.amount,
          payerName: body.payerName,
        },
      },
      { status: 501 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
