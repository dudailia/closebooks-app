// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetricBenchmark {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  sampleCount: number
}

export interface IndustryBenchmarks {
  gross_margin: MetricBenchmark
  payroll_to_revenue: MetricBenchmark
  ar_days: MetricBenchmark
  cash_runway: MetricBenchmark
  operating_expense_ratio: MetricBenchmark
}

// ─── Comprehensive benchmark data for 6 industries ────────────────────────────
// Sources: RMA Annual Statement Studies, SBA size standards, IBISWorld industry reports
// All percentages as whole numbers; days and months as integers

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmarks> = {
  Construction: {
    gross_margin: {
      p10: 8, p25: 14, p50: 22, p75: 31, p90: 42,
      sampleCount: 567,
    },
    payroll_to_revenue: {
      p10: 28, p25: 35, p50: 44, p75: 54, p90: 63,
      sampleCount: 567,
    },
    ar_days: {
      p10: 18, p25: 28, p50: 42, p75: 62, p90: 84,
      sampleCount: 543,
    },
    cash_runway: {
      p10: 1, p25: 2, p50: 3, p75: 5, p90: 8,
      sampleCount: 512,
    },
    operating_expense_ratio: {
      p10: 12, p25: 16, p50: 21, p75: 28, p90: 36,
      sampleCount: 567,
    },
  },

  Restaurant: {
    gross_margin: {
      p10: 28, p25: 34, p50: 41, p75: 49, p90: 58,
      sampleCount: 847,
    },
    payroll_to_revenue: {
      p10: 24, p25: 29, p50: 34, p75: 40, p90: 47,
      sampleCount: 847,
    },
    ar_days: {
      p10: 0, p25: 2, p50: 5, p75: 12, p90: 21,
      sampleCount: 612,
    },
    cash_runway: {
      p10: 0, p25: 1, p50: 2, p75: 3, p90: 5,
      sampleCount: 720,
    },
    operating_expense_ratio: {
      p10: 18, p25: 24, p50: 31, p75: 38, p90: 47,
      sampleCount: 847,
    },
  },

  Technology: {
    gross_margin: {
      p10: 44, p25: 58, p50: 71, p75: 82, p90: 89,
      sampleCount: 1247,
    },
    payroll_to_revenue: {
      p10: 32, p25: 42, p50: 54, p75: 64, p90: 74,
      sampleCount: 1247,
    },
    ar_days: {
      p10: 14, p25: 22, p50: 34, p75: 48, p90: 67,
      sampleCount: 1198,
    },
    cash_runway: {
      p10: 2, p25: 4, p50: 7, p75: 12, p90: 24,
      sampleCount: 1156,
    },
    operating_expense_ratio: {
      p10: 18, p25: 26, p50: 36, p75: 47, p90: 58,
      sampleCount: 1247,
    },
  },

  Healthcare: {
    gross_margin: {
      p10: 32, p25: 41, p50: 52, p75: 63, p90: 72,
      sampleCount: 423,
    },
    payroll_to_revenue: {
      p10: 38, p25: 46, p50: 55, p75: 64, p90: 72,
      sampleCount: 423,
    },
    ar_days: {
      p10: 18, p25: 26, p50: 38, p75: 54, p90: 74,
      sampleCount: 418,
    },
    cash_runway: {
      p10: 1, p25: 2, p50: 3, p75: 5, p90: 8,
      sampleCount: 401,
    },
    operating_expense_ratio: {
      p10: 14, p25: 19, p50: 26, p75: 34, p90: 43,
      sampleCount: 423,
    },
  },

  Retail: {
    gross_margin: {
      p10: 18, p25: 26, p50: 36, p75: 47, p90: 58,
      sampleCount: 634,
    },
    payroll_to_revenue: {
      p10: 12, p25: 16, p50: 22, p75: 29, p90: 36,
      sampleCount: 634,
    },
    ar_days: {
      p10: 0, p25: 3, p50: 8, p75: 18, p90: 32,
      sampleCount: 582,
    },
    cash_runway: {
      p10: 1, p25: 2, p50: 3, p75: 5, p90: 8,
      sampleCount: 601,
    },
    operating_expense_ratio: {
      p10: 14, p25: 19, p50: 26, p75: 34, p90: 44,
      sampleCount: 634,
    },
  },

  'Professional Services': {
    gross_margin: {
      p10: 38, p25: 48, p50: 58, p75: 68, p90: 77,
      sampleCount: 891,
    },
    payroll_to_revenue: {
      p10: 38, p25: 46, p50: 55, p75: 64, p90: 72,
      sampleCount: 891,
    },
    ar_days: {
      p10: 14, p25: 22, p50: 32, p75: 46, p90: 62,
      sampleCount: 876,
    },
    cash_runway: {
      p10: 1, p25: 2, p50: 4, p75: 6, p90: 10,
      sampleCount: 854,
    },
    operating_expense_ratio: {
      p10: 16, p25: 22, p50: 29, p75: 37, p90: 46,
      sampleCount: 891,
    },
  },
}

export const ALL_INDUSTRIES = Object.keys(INDUSTRY_BENCHMARKS)

export const METRIC_LABELS: Record<string, { label: string; unit: string; higherIsBetter: boolean }> = {
  gross_margin:           { label: 'Gross Margin',              unit: '%',      higherIsBetter: true  },
  payroll_to_revenue:     { label: 'Payroll-to-Revenue',        unit: '%',      higherIsBetter: false },
  ar_days:                { label: 'AR Days Outstanding',       unit: 'days',   higherIsBetter: false },
  cash_runway:            { label: 'Cash Runway',               unit: 'months', higherIsBetter: true  },
  operating_expense_ratio:{ label: 'Operating Expense Ratio',   unit: '%',      higherIsBetter: false },
}
