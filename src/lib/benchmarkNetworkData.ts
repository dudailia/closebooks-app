import type { ClientIndustry } from '@/types'

export interface SpendRatio {
  industry: ClientIndustry
  category: string
  p25: number
  median: number
  p75: number
  sampleSize: number
  lastUpdated: string
}

// Hardcoded seed dataset: all 13 industries × 10 expense categories
// All values are PERCENTAGES of total expense spend
export const NETWORK_BENCHMARKS: SpendRatio[] = [
  // ─── Restaurant ──────────────────────────────────────────────────────────────
  { industry: 'Restaurant', category: 'Payroll & Wages',           p25: 28, median: 34, p75: 41, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Cost of Goods Sold',        p25: 25, median: 31, p75: 38, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Rent & Occupancy',          p25:  8, median: 12, p75: 17, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Utilities',                 p25:  3, median:  5, p75:  7, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Marketing & Advertising',   p25:  1, median:  2, p75:  4, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Software & SaaS',           p25: 0.5, median: 1.2, p75: 2.1, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Office Supplies',           p25: 0.3, median: 0.7, p75: 1.2, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Travel & Entertainment',    p25: 0.2, median: 0.6, p75: 1.4, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Insurance',                 p25:  2, median:  3, p75:  4, sampleSize: 214, lastUpdated: '2026-03-01' },
  { industry: 'Restaurant', category: 'Professional Services',     p25:  1, median:  2, p75:  3, sampleSize: 214, lastUpdated: '2026-03-01' },

  // ─── Retail ──────────────────────────────────────────────────────────────────
  { industry: 'Retail', category: 'Payroll & Wages',               p25: 18, median: 24, p75: 30, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Cost of Goods Sold',            p25: 35, median: 44, p75: 55, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Rent & Occupancy',              p25:  6, median:  9, p75: 14, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Utilities',                     p25:  2, median:  3, p75:  5, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Marketing & Advertising',       p25:  2, median:  4, p75:  7, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Software & SaaS',               p25:  1, median:  2, p75:  4, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Office Supplies',               p25: 0.4, median: 0.8, p75: 1.5, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Travel & Entertainment',        p25: 0.5, median:  1, p75:  2, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Insurance',                     p25:  1, median:  2, p75:  3, sampleSize: 186, lastUpdated: '2026-03-01' },
  { industry: 'Retail', category: 'Professional Services',         p25:  1, median:  2, p75:  4, sampleSize: 186, lastUpdated: '2026-03-01' },

  // ─── Professional Services ────────────────────────────────────────────────────
  { industry: 'Professional Services', category: 'Payroll & Wages',         p25: 38, median: 45, p75: 55, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Cost of Goods Sold',      p25:  0, median:  1, p75:  3, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Rent & Occupancy',        p25:  8, median: 12, p75: 18, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Utilities',               p25:  1, median:  2, p75:  3, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Marketing & Advertising', p25:  3, median:  5, p75:  9, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Software & SaaS',         p25:  3, median:  6, p75: 10, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Office Supplies',         p25:  1, median:  2, p75:  3, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Travel & Entertainment',  p25:  2, median:  4, p75:  7, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Insurance',               p25:  2, median:  3, p75:  5, sampleSize: 312, lastUpdated: '2026-03-01' },
  { industry: 'Professional Services', category: 'Professional Services',   p25:  1, median:  3, p75:  6, sampleSize: 312, lastUpdated: '2026-03-01' },

  // ─── Construction ─────────────────────────────────────────────────────────────
  { industry: 'Construction', category: 'Payroll & Wages',         p25: 30, median: 38, p75: 47, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Cost of Goods Sold',      p25: 22, median: 30, p75: 40, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Rent & Occupancy',        p25:  2, median:  4, p75:  7, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Utilities',               p25:  1, median:  2, p75:  4, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Marketing & Advertising', p25:  1, median:  2, p75:  4, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Software & SaaS',         p25:  1, median:  2, p75:  3, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Office Supplies',         p25: 0.5, median:  1, p75:  2, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Travel & Entertainment',  p25:  1, median:  3, p75:  5, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Insurance',               p25:  4, median:  6, p75:  9, sampleSize: 143, lastUpdated: '2026-03-01' },
  { industry: 'Construction', category: 'Professional Services',   p25:  2, median:  3, p75:  5, sampleSize: 143, lastUpdated: '2026-03-01' },

  // ─── Healthcare ───────────────────────────────────────────────────────────────
  { industry: 'Healthcare', category: 'Payroll & Wages',           p25: 40, median: 50, p75: 60, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Cost of Goods Sold',        p25:  5, median:  9, p75: 14, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Rent & Occupancy',          p25:  7, median: 11, p75: 16, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Utilities',                 p25:  2, median:  3, p75:  4, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Marketing & Advertising',   p25:  1, median:  2, p75:  4, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Software & SaaS',           p25:  2, median:  4, p75:  7, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Office Supplies',           p25:  1, median:  2, p75:  3, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Travel & Entertainment',    p25: 0.5, median:  1, p75:  2, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Insurance',                 p25:  3, median:  5, p75:  8, sampleSize: 178, lastUpdated: '2026-03-01' },
  { industry: 'Healthcare', category: 'Professional Services',     p25:  2, median:  4, p75:  6, sampleSize: 178, lastUpdated: '2026-03-01' },

  // ─── E-commerce ───────────────────────────────────────────────────────────────
  { industry: 'E-commerce', category: 'Payroll & Wages',           p25: 12, median: 18, p75: 25, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Cost of Goods Sold',        p25: 30, median: 40, p75: 52, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Rent & Occupancy',          p25:  2, median:  4, p75:  7, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Utilities',                 p25: 0.5, median:  1, p75:  2, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Marketing & Advertising',   p25:  8, median: 14, p75: 22, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Software & SaaS',           p25:  3, median:  5, p75:  9, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Office Supplies',           p25: 0.3, median: 0.7, p75: 1.5, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Travel & Entertainment',    p25: 0.5, median:  1, p75:  2, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Insurance',                 p25:  1, median:  2, p75:  3, sampleSize: 127, lastUpdated: '2026-03-01' },
  { industry: 'E-commerce', category: 'Professional Services',     p25:  1, median:  2, p75:  4, sampleSize: 127, lastUpdated: '2026-03-01' },

  // ─── Technology ───────────────────────────────────────────────────────────────
  { industry: 'Technology', category: 'Payroll & Wages',           p25: 35, median: 42, p75: 51, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Cost of Goods Sold',        p25:  0, median:  2, p75:  5, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Rent & Occupancy',          p25:  4, median:  7, p75: 11, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Utilities',                 p25: 0.5, median:  1, p75:  2, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Marketing & Advertising',   p25:  5, median:  9, p75: 15, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Software & SaaS',           p25:  8, median: 14, p75: 22, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Office Supplies',           p25: 0.5, median:  1, p75:  2, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Travel & Entertainment',    p25:  2, median:  4, p75:  7, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Insurance',                 p25:  1, median:  2, p75:  4, sampleSize: 248, lastUpdated: '2026-03-01' },
  { industry: 'Technology', category: 'Professional Services',     p25:  3, median:  5, p75:  9, sampleSize: 248, lastUpdated: '2026-03-01' },

  // ─── Manufacturing ────────────────────────────────────────────────────────────
  { industry: 'Manufacturing', category: 'Payroll & Wages',        p25: 22, median: 29, p75: 37, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Cost of Goods Sold',     p25: 30, median: 40, p75: 52, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Rent & Occupancy',       p25:  3, median:  6, p75: 10, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Utilities',              p25:  3, median:  5, p75:  8, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Marketing & Advertising',p25:  1, median:  2, p75:  4, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Software & SaaS',        p25:  1, median:  2, p75:  4, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Office Supplies',        p25: 0.5, median:  1, p75:  2, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Travel & Entertainment', p25:  1, median:  2, p75:  4, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Insurance',              p25:  3, median:  5, p75:  7, sampleSize: 98, lastUpdated: '2026-03-01' },
  { industry: 'Manufacturing', category: 'Professional Services',  p25:  1, median:  2, p75:  4, sampleSize: 98, lastUpdated: '2026-03-01' },

  // ─── Real Estate ──────────────────────────────────────────────────────────────
  { industry: 'Real Estate', category: 'Payroll & Wages',          p25: 15, median: 22, p75: 30, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Cost of Goods Sold',       p25:  5, median: 10, p75: 18, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Rent & Occupancy',         p25:  2, median:  4, p75:  7, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Utilities',                p25:  2, median:  4, p75:  7, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Marketing & Advertising',  p25:  3, median:  6, p75: 10, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Software & SaaS',          p25:  1, median:  2, p75:  4, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Office Supplies',          p25: 0.5, median:  1, p75:  2, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Travel & Entertainment',   p25:  1, median:  3, p75:  5, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Insurance',                p25:  5, median:  8, p75: 12, sampleSize: 113, lastUpdated: '2026-03-01' },
  { industry: 'Real Estate', category: 'Professional Services',    p25:  3, median:  5, p75:  8, sampleSize: 113, lastUpdated: '2026-03-01' },

  // ─── Nonprofit ────────────────────────────────────────────────────────────────
  { industry: 'Nonprofit', category: 'Payroll & Wages',            p25: 35, median: 45, p75: 57, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Cost of Goods Sold',         p25:  1, median:  3, p75:  7, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Rent & Occupancy',           p25:  5, median:  9, p75: 14, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Utilities',                  p25:  2, median:  3, p75:  5, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Marketing & Advertising',    p25:  2, median:  4, p75:  7, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Software & SaaS',            p25:  1, median:  3, p75:  5, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Office Supplies',            p25:  1, median:  2, p75:  3, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Travel & Entertainment',     p25:  1, median:  3, p75:  5, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Insurance',                  p25:  2, median:  3, p75:  5, sampleSize: 89, lastUpdated: '2026-03-01' },
  { industry: 'Nonprofit', category: 'Professional Services',      p25:  2, median:  4, p75:  7, sampleSize: 89, lastUpdated: '2026-03-01' },

  // ─── Legal Services ───────────────────────────────────────────────────────────
  { industry: 'Legal Services', category: 'Payroll & Wages',        p25: 40, median: 50, p75: 60, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Cost of Goods Sold',     p25:  0, median:  1, p75:  2, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Rent & Occupancy',       p25: 10, median: 14, p75: 20, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Utilities',              p25:  1, median:  2, p75:  3, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Marketing & Advertising',p25:  2, median:  4, p75:  7, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Software & SaaS',        p25:  3, median:  5, p75:  8, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Office Supplies',        p25:  1, median:  2, p75:  4, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Travel & Entertainment', p25:  2, median:  4, p75:  7, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Insurance',              p25:  3, median:  5, p75:  8, sampleSize: 156, lastUpdated: '2026-03-01' },
  { industry: 'Legal Services', category: 'Professional Services',  p25:  2, median:  4, p75:  7, sampleSize: 156, lastUpdated: '2026-03-01' },

  // ─── Transportation ───────────────────────────────────────────────────────────
  { industry: 'Transportation', category: 'Payroll & Wages',        p25: 28, median: 36, p75: 45, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Cost of Goods Sold',     p25: 15, median: 22, p75: 32, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Rent & Occupancy',       p25:  2, median:  4, p75:  7, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Utilities',              p25:  8, median: 13, p75: 19, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Marketing & Advertising',p25:  1, median:  2, p75:  3, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Software & SaaS',        p25:  1, median:  2, p75:  3, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Office Supplies',        p25: 0.3, median: 0.7, p75: 1.5, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Travel & Entertainment', p25:  2, median:  4, p75:  7, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Insurance',              p25:  6, median: 10, p75: 15, sampleSize: 74, lastUpdated: '2026-03-01' },
  { industry: 'Transportation', category: 'Professional Services',  p25:  1, median:  2, p75:  3, sampleSize: 74, lastUpdated: '2026-03-01' },

  // ─── Other ────────────────────────────────────────────────────────────────────
  { industry: 'Other', category: 'Payroll & Wages',                 p25: 22, median: 30, p75: 40, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Cost of Goods Sold',              p25: 10, median: 18, p75: 28, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Rent & Occupancy',               p25:  5, median:  8, p75: 13, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Utilities',                       p25:  2, median:  3, p75:  5, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Marketing & Advertising',         p25:  2, median:  4, p75:  7, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Software & SaaS',                 p25:  2, median:  4, p75:  7, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Office Supplies',                 p25: 0.5, median:  1, p75:  2, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Travel & Entertainment',          p25:  1, median:  2, p75:  4, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Insurance',                       p25:  2, median:  3, p75:  5, sampleSize: 47, lastUpdated: '2026-03-01' },
  { industry: 'Other', category: 'Professional Services',           p25:  1, median:  3, p75:  5, sampleSize: 47, lastUpdated: '2026-03-01' },
]
