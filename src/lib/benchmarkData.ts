import type { ClientIndustry } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BenchmarkMetric {
  /** Expense as % of total revenue */
  p25: number
  median: number
  p75: number
  label: string
  insight: {
    above: string   // when client is above P75
    below: string   // when client is below P25
  }
}

export interface IndustryBenchmarks {
  industry: ClientIndustry
  dataSource: string
  sampleDescription: string
  metrics: Record<string, BenchmarkMetric>
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Source: US SBA industry benchmarks, BLS data, RMA Annual Statement Studies
// All values expressed as % of total revenue

export const BENCHMARKS: Record<ClientIndustry, IndustryBenchmarks> = {
  Restaurant: {
    industry: 'Restaurant',
    dataSource: 'US SBA & National Restaurant Association',
    sampleDescription: 'Full-service and quick-service restaurants',
    metrics: {
      'Food & Beverage': {
        p25: 23, median: 28, p75: 34,
        label: 'Food & Beverage Cost',
        insight: {
          above: 'Food costs are high — review vendor contracts, portion sizes, and waste tracking.',
          below: 'Excellent food cost control — in the top quartile for your industry.',
        },
      },
      'Payroll & Wages': {
        p25: 27, median: 31, p75: 37,
        label: 'Labor Cost',
        insight: {
          above: 'Labor costs are above average. Review scheduling efficiency and overtime.',
          below: 'Labor is well-controlled — top quartile for restaurant operations.',
        },
      },
      'Rent & Occupancy': {
        p25: 5, median: 8, p75: 12,
        label: 'Occupancy Cost',
        insight: {
          above: 'Occupancy is high relative to revenue. Consider renegotiating the lease.',
          below: 'Excellent rent-to-revenue ratio.',
        },
      },
      'Marketing & Advertising': {
        p25: 1, median: 3, p75: 6,
        label: 'Marketing Spend',
        insight: {
          above: 'Marketing spend is elevated — ensure ROI is being tracked per channel.',
          below: 'Marketing is below average — may be an opportunity to grow revenue.',
        },
      },
      'Utilities': {
        p25: 2, median: 4, p75: 6,
        label: 'Utilities',
        insight: {
          above: 'Utilities are running high — review energy efficiency measures.',
          below: 'Utility costs are well-managed.',
        },
      },
    },
  },

  Retail: {
    industry: 'Retail',
    dataSource: 'US Census Retail Trade Survey & NRHA',
    sampleDescription: 'Brick-and-mortar and e-commerce retail',
    metrics: {
      'Cost of Goods': {
        p25: 42, median: 52, p75: 63,
        label: 'Cost of Goods Sold',
        insight: {
          above: 'COGS is above median — review supplier pricing, shrinkage, and returns.',
          below: 'Strong gross margin — above-average for retail.',
        },
      },
      'Payroll & Wages': {
        p25: 10, median: 15, p75: 20,
        label: 'Labor Cost',
        insight: {
          above: 'Labor is above average for retail. Review staffing relative to sales.',
          below: 'Lean labor structure — ensure service levels are maintained.',
        },
      },
      'Rent & Occupancy': {
        p25: 3, median: 6, p75: 10,
        label: 'Occupancy Cost',
        insight: {
          above: 'Occupancy cost is high. Consider subletting or renegotiating.',
          below: 'Good location economics.',
        },
      },
      'Marketing & Advertising': {
        p25: 1, median: 3, p75: 7,
        label: 'Marketing Spend',
        insight: {
          above: 'Marketing spend is elevated relative to peers.',
          below: 'Low marketing spend — may limit customer acquisition.',
        },
      },
    },
  },

  'Professional Services': {
    industry: 'Professional Services',
    dataSource: 'AICPA & IBISWorld Professional Services Data',
    sampleDescription: 'Consulting, legal, accounting, and advisory firms',
    metrics: {
      'Payroll & Wages': {
        p25: 35, median: 45, p75: 58,
        label: 'Labor Cost (incl. principals)',
        insight: {
          above: 'Labor costs are high relative to revenue — review utilization rates and billing ratios.',
          below: 'Strong labor efficiency — billing well above cost.',
        },
      },
      'Rent & Occupancy': {
        p25: 2, median: 5, p75: 9,
        label: 'Office / Occupancy',
        insight: {
          above: 'Office costs are high for a professional services firm. Remote-first may help.',
          below: 'Lean occupancy costs.',
        },
      },
      'Software & SaaS': {
        p25: 1, median: 3, p75: 6,
        label: 'Software & Tools',
        insight: {
          above: 'Software stack costs are high — audit for unused subscriptions.',
          below: 'Tech costs are lean.',
        },
      },
      'Marketing & Advertising': {
        p25: 1, median: 2, p75: 5,
        label: 'Business Development',
        insight: {
          above: 'Business development spending is high relative to peers.',
          below: 'Low BD investment — referrals and organic growth are likely primary channels.',
        },
      },
    },
  },

  Construction: {
    industry: 'Construction',
    dataSource: 'AGC & US Census Construction Industry Survey',
    sampleDescription: 'General contractors and specialty subcontractors',
    metrics: {
      'Labor': {
        p25: 28, median: 35, p75: 43,
        label: 'Direct Labor',
        insight: {
          above: 'Labor is above median — review crew efficiency and subcontractor mix.',
          below: 'Strong labor cost management.',
        },
      },
      'Materials & Supplies': {
        p25: 30, median: 38, p75: 48,
        label: 'Materials & Supplies',
        insight: {
          above: 'Material costs are high — review purchasing volume discounts.',
          below: 'Good materials cost management.',
        },
      },
      'Equipment': {
        p25: 3, median: 6, p75: 11,
        label: 'Equipment & Tools',
        insight: {
          above: 'Equipment costs are elevated — review rental vs. own decisions.',
          below: 'Equipment costs are well-managed.',
        },
      },
    },
  },

  Healthcare: {
    industry: 'Healthcare',
    dataSource: 'MGMA Medical Practice Survey',
    sampleDescription: 'Physician practices and outpatient clinics',
    metrics: {
      'Payroll & Wages': {
        p25: 38, median: 47, p75: 56,
        label: 'Staff Labor Cost',
        insight: {
          above: 'Staffing costs are above average — review clinical staff-to-provider ratios.',
          below: 'Efficient staffing structure for a healthcare practice.',
        },
      },
      'Medical Supplies': {
        p25: 5, median: 9, p75: 14,
        label: 'Medical Supplies',
        insight: {
          above: 'Supply costs are high — review purchasing contracts and utilization.',
          below: 'Supply costs are well-controlled.',
        },
      },
      'Rent & Occupancy': {
        p25: 4, median: 7, p75: 12,
        label: 'Occupancy Cost',
        insight: {
          above: 'Facility costs are above average for healthcare.',
          below: 'Good occupancy cost management.',
        },
      },
    },
  },

  'E-commerce': {
    industry: 'E-commerce',
    dataSource: 'Shopify & eMarketer E-commerce Benchmarks',
    sampleDescription: 'Direct-to-consumer e-commerce businesses',
    metrics: {
      'Cost of Goods': {
        p25: 35, median: 45, p75: 58,
        label: 'COGS & Fulfillment',
        insight: {
          above: 'COGS + fulfillment is high — review sourcing and 3PL costs.',
          below: 'Strong gross margin for e-commerce.',
        },
      },
      'Marketing & Advertising': {
        p25: 8, median: 15, p75: 25,
        label: 'Paid Acquisition',
        insight: {
          above: 'Marketing spend is very high — review CAC and LTV ratios carefully.',
          below: 'Low acquisition costs — strong organic or referral growth likely.',
        },
      },
      'Shipping & Logistics': {
        p25: 5, median: 9, p75: 14,
        label: 'Shipping & Returns',
        insight: {
          above: 'Shipping costs are high — consider threshold-based free shipping or carrier negotiation.',
          below: 'Shipping costs are competitive.',
        },
      },
      'Software & SaaS': {
        p25: 2, median: 4, p75: 8,
        label: 'Tech & Platform Costs',
        insight: {
          above: 'Platform and tech costs are elevated — audit subscription stack.',
          below: 'Tech costs are lean.',
        },
      },
    },
  },

  Technology: {
    industry: 'Technology',
    dataSource: 'SaaS & Tech Industry Benchmarks (KeyBanc, OpenView)',
    sampleDescription: 'Software, SaaS, and technology services companies',
    metrics: {
      'Payroll & Wages': {
        p25: 40, median: 55, p75: 68,
        label: 'Labor Cost (R&D + G&A)',
        insight: {
          above: 'Labor is high — review headcount efficiency and contractor spend.',
          below: 'Labor is lean for a tech company — strong operational efficiency.',
        },
      },
      'Software & SaaS': {
        p25: 5, median: 10, p75: 18,
        label: 'Software & Infrastructure',
        insight: {
          above: 'Tech stack costs are elevated — audit subscriptions and hosting.',
          below: 'Infrastructure costs are well-managed.',
        },
      },
      'Marketing & Advertising': {
        p25: 8, median: 15, p75: 25,
        label: 'Sales & Marketing',
        insight: {
          above: 'S&M spend is high — review CAC and pipeline efficiency.',
          below: 'Low S&M spend — may limit growth velocity.',
        },
      },
    },
  },

  Manufacturing: {
    industry: 'Manufacturing',
    dataSource: 'NAM & US Census Manufacturing Survey',
    sampleDescription: 'Small and mid-size manufacturers',
    metrics: {
      'Materials & Supplies': {
        p25: 35, median: 45, p75: 58,
        label: 'Raw Materials & COGS',
        insight: {
          above: 'Material costs are high — review supplier contracts and waste.',
          below: 'Strong materials cost management.',
        },
      },
      'Payroll & Wages': {
        p25: 18, median: 25, p75: 33,
        label: 'Direct & Indirect Labor',
        insight: {
          above: 'Labor costs are above average — review shift efficiency.',
          below: 'Labor costs are well-controlled for manufacturing.',
        },
      },
      'Equipment': {
        p25: 4, median: 7, p75: 12,
        label: 'Equipment & Maintenance',
        insight: {
          above: 'Equipment costs are elevated — review maintenance schedules.',
          below: 'Equipment costs are lean.',
        },
      },
      'Utilities': {
        p25: 2, median: 5, p75: 9,
        label: 'Utilities & Energy',
        insight: {
          above: 'Utility costs are high — consider energy efficiency investments.',
          below: 'Energy costs are well-managed.',
        },
      },
    },
  },

  'Real Estate': {
    industry: 'Real Estate',
    dataSource: 'NAR & CCIM Real Estate Business Benchmarks',
    sampleDescription: 'Real estate brokerages, property managers, and agencies',
    metrics: {
      'Payroll & Wages': {
        p25: 20, median: 30, p75: 42,
        label: 'Labor & Commission Cost',
        insight: {
          above: 'Labor and commission costs are high relative to GCI.',
          below: 'Strong labor efficiency — high GCI per agent.',
        },
      },
      'Marketing & Advertising': {
        p25: 5, median: 10, p75: 18,
        label: 'Marketing & Lead Gen',
        insight: {
          above: 'Marketing spend is elevated — review cost per lead.',
          below: 'Low marketing spend — relies on referrals or organic pipeline.',
        },
      },
      'Rent & Occupancy': {
        p25: 2, median: 5, p75: 9,
        label: 'Office Occupancy',
        insight: {
          above: 'Office costs are high for a real estate business.',
          below: 'Lean office footprint.',
        },
      },
    },
  },

  Nonprofit: {
    industry: 'Nonprofit',
    dataSource: 'GuideStar & Nonprofit Finance Fund Benchmarks',
    sampleDescription: '501(c)(3) organizations and charitable nonprofits',
    metrics: {
      'Payroll & Wages': {
        p25: 40, median: 55, p75: 68,
        label: 'Program & Admin Staff',
        insight: {
          above: 'Personnel costs are above average — review staffing vs. program delivery.',
          below: 'Lean staffing structure relative to revenue/grants.',
        },
      },
      'Rent & Occupancy': {
        p25: 3, median: 7, p75: 12,
        label: 'Facility Cost',
        insight: {
          above: 'Facility costs are high relative to budget — consider shared space.',
          below: 'Good occupancy cost management.',
        },
      },
      'Marketing & Advertising': {
        p25: 1, median: 4, p75: 8,
        label: 'Fundraising & Outreach',
        insight: {
          above: 'Fundraising spend is elevated relative to budget.',
          below: 'Low fundraising spend — strong organic donor retention likely.',
        },
      },
    },
  },

  'Legal Services': {
    industry: 'Legal Services',
    dataSource: 'ALM Legal Intelligence & ILTA Law Firm Benchmarks',
    sampleDescription: 'Small and mid-size law firms',
    metrics: {
      'Payroll & Wages': {
        p25: 38, median: 50, p75: 62,
        label: 'Attorney & Staff Labor',
        insight: {
          above: 'Labor costs are high — review attorney utilization and billing rates.',
          below: 'Strong labor efficiency — high revenue per attorney.',
        },
      },
      'Rent & Occupancy': {
        p25: 3, median: 6, p75: 10,
        label: 'Office Occupancy',
        insight: {
          above: 'Office costs are high — consider remote or hybrid models.',
          below: 'Lean occupancy for a law firm.',
        },
      },
      'Software & SaaS': {
        p25: 2, median: 4, p75: 7,
        label: 'Legal Tech & Software',
        insight: {
          above: 'Legal tech costs are elevated — audit practice management tools.',
          below: 'Tech costs are lean.',
        },
      },
      'Marketing & Advertising': {
        p25: 1, median: 3, p75: 6,
        label: 'Business Development',
        insight: {
          above: 'BD spend is elevated — review lead quality and referral pipeline.',
          below: 'Low BD spend — referral-based model likely.',
        },
      },
    },
  },

  Transportation: {
    industry: 'Transportation',
    dataSource: 'ATA & US DOT Transportation Industry Survey',
    sampleDescription: 'Trucking, logistics, and freight companies',
    metrics: {
      'Payroll & Wages': {
        p25: 28, median: 36, p75: 45,
        label: 'Driver & Staff Labor',
        insight: {
          above: 'Labor costs are above average — review driver utilization.',
          below: 'Strong labor cost management for transportation.',
        },
      },
      'Fuel & Fleet': {
        p25: 18, median: 25, p75: 33,
        label: 'Fuel & Fleet Operating Cost',
        insight: {
          above: 'Fuel/fleet costs are high — review route efficiency and fuel hedging.',
          below: 'Good fleet cost management.',
        },
      },
      'Equipment': {
        p25: 5, median: 9, p75: 15,
        label: 'Vehicle & Equipment',
        insight: {
          above: 'Vehicle costs are elevated — review lease vs. own decisions.',
          below: 'Vehicle costs are well-managed.',
        },
      },
    },
  },

  Other: {
    industry: 'Other',
    dataSource: 'General small business benchmarks (SBA)',
    sampleDescription: 'Mixed small and mid-size businesses',
    metrics: {
      'Payroll & Wages': {
        p25: 25, median: 35, p75: 45,
        label: 'Total Labor Cost',
        insight: {
          above: 'Labor costs are above the general business median.',
          below: 'Labor costs are below the general business median.',
        },
      },
      'Rent & Occupancy': {
        p25: 3, median: 6, p75: 10,
        label: 'Occupancy Cost',
        insight: {
          above: 'Occupancy is high relative to revenue.',
          below: 'Occupancy costs are lean.',
        },
      },
    },
  },
}
