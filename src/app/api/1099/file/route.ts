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

function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `IRS-${timestamp}-${random}`
}

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

    // Simulate IRS e-filing processing delay context
    const confirmationNumber = generateConfirmationNumber()
    const filedAt = new Date().toISOString()
    const expectedProcessing = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    const receipt = {
      confirmationNumber,
      filedAt,
      expectedProcessingDate: expectedProcessing,
      formType: body.formType,
      taxYear: body.taxYear,
      recipientName: body.recipientName,
      recipientTin: body.recipientTin.replace(/(\d{2})(\d{3})(\d{4})/, '**-***$3'),
      amount: body.amount,
      payerName: body.payerName,
      status: 'ACCEPTED',
      irsTrackingId: `EFILE-${Math.floor(Math.random() * 9000000 + 1000000)}`,
      message: `Your ${body.formType} for ${body.recipientName} has been successfully submitted to the IRS. Confirmation: ${confirmationNumber}`,
    }

    return NextResponse.json({ success: true, receipt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
