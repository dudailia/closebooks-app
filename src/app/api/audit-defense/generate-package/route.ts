import { NextResponse } from 'next/server'

interface PackageRequest {
  auditId: string
  auditType: string
  taxYear: string | number
  clientName?: string
}

interface DocumentItem {
  name: string
  status: 'available' | 'missing'
  category: string
  description: string
  priority: 'required' | 'recommended' | 'optional'
}

const STANDARD_DOCS: DocumentItem[] = [
  {
    name: 'Bank statements (12 months)',
    status: 'available',
    category: 'Financial Records',
    description: 'Monthly bank statements for all business accounts',
    priority: 'required',
  },
  {
    name: 'Transaction categorization report',
    status: 'available',
    category: 'Financial Records',
    description: 'Detailed breakdown of all transactions by category',
    priority: 'required',
  },
  {
    name: 'Journal entries',
    status: 'available',
    category: 'Accounting Records',
    description: 'General ledger and journal entries for the audit period',
    priority: 'required',
  },
  {
    name: 'Source documents (receipts/invoices)',
    status: 'available',
    category: 'Supporting Documents',
    description: 'Original receipts, invoices, and purchase orders',
    priority: 'required',
  },
  {
    name: 'Tax return (original filing)',
    status: 'available',
    category: 'Tax Documents',
    description: 'Original tax return for the audit year',
    priority: 'required',
  },
  {
    name: 'W-2s and 1099s received',
    status: 'available',
    category: 'Tax Documents',
    description: 'All income-reporting documents received',
    priority: 'required',
  },
  {
    name: 'Depreciation schedule',
    status: 'missing',
    category: 'Accounting Records',
    description: 'Asset depreciation schedule with cost basis and accumulated depreciation',
    priority: 'required',
  },
  {
    name: 'Vehicle mileage log',
    status: 'missing',
    category: 'Supporting Documents',
    description: 'Business vehicle usage log with dates, destinations, and mileage',
    priority: 'required',
  },
  {
    name: 'Home office documentation',
    status: 'missing',
    category: 'Supporting Documents',
    description: 'Square footage measurements and home office use documentation',
    priority: 'recommended',
  },
  {
    name: 'Payroll records',
    status: 'available',
    category: 'Employment Records',
    description: 'Payroll registers, W-2s issued, and 941 filings',
    priority: 'required',
  },
  {
    name: 'Contracts and agreements',
    status: 'available',
    category: 'Legal Documents',
    description: 'Business contracts, lease agreements, and service agreements',
    priority: 'recommended',
  },
  {
    name: 'Prior year tax returns',
    status: 'available',
    category: 'Tax Documents',
    description: 'Tax returns for 3 years prior to audit year for context',
    priority: 'recommended',
  },
]

const CP2000_ADDITIONAL: DocumentItem[] = [
  {
    name: 'Income reconciliation worksheet',
    status: 'missing',
    category: 'Tax Documents',
    description: 'Reconciliation between reported income and IRS-reported amounts',
    priority: 'required',
  },
  {
    name: '1099 forms received vs reported',
    status: 'available',
    category: 'Tax Documents',
    description: 'All 1099s received with explanation of any discrepancies',
    priority: 'required',
  },
]

export async function POST(req: Request) {
  try {
    const body: PackageRequest = await req.json()
    const { auditId, auditType, taxYear, clientName = 'Client' } = body

    if (!auditId || !auditType || !taxYear) {
      return NextResponse.json(
        { success: false, error: 'auditId, auditType, and taxYear are required' },
        { status: 400 }
      )
    }

    let documents = [...STANDARD_DOCS]

    // Add audit-type specific documents
    if (auditType.toLowerCase().includes('cp2000') || auditType.toLowerCase().includes('underreport')) {
      documents = [...documents, ...CP2000_ADDITIONAL]
    }

    const available = documents.filter(d => d.status === 'available')
    const missing = documents.filter(d => d.status === 'missing')
    const required = documents.filter(d => d.priority === 'required')
    const requiredMissing = missing.filter(d => d.priority === 'required')

    const completenessScore = Math.round(
      ((required.length - requiredMissing.length) / required.length) * 100
    )

    const packageSummary = {
      auditId,
      clientName,
      auditType,
      taxYear,
      generatedAt: new Date().toISOString(),
      packageId: `PKG-${Date.now().toString(36).toUpperCase()}`,
      documents,
      stats: {
        total: documents.length,
        available: available.length,
        missing: missing.length,
        requiredMissing: requiredMissing.length,
        completenessScore,
      },
      readyToSubmit: requiredMissing.length === 0,
      estimatedCompletionDays: requiredMissing.length * 3,
    }

    return NextResponse.json({ success: true, package: packageSummary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
