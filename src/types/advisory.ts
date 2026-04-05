export interface AdvisorySection {
  type: 'headline' | 'cashflow' | 'expense' | 'anomaly' | 'benchmark' | 'recommendation' | 'forecast'
  title: string
  body: string
  urgency: 'high' | 'medium' | 'low'
  dataPoints: string[]
}

export interface AdvisoryMemo {
  id: string
  jobId: string
  clientName: string
  clientIndustry?: string
  generatedAt: string
  status: 'draft' | 'sent' | 'archived'
  tone: 'executive' | 'detailed' | 'conversational'
  headline: string
  sections: AdvisorySection[]
  sentAt?: string
}
