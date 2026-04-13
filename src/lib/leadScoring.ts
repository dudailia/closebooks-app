/**
 * Lead scoring for CPA prospects — derived from client records and close activity.
 */

import type { Client } from '@/types'
import type { CategorizationJob } from '@/types'

export interface LeadScore {
  clientId: string
  clientName: string
  score: number
  tier: 'hot' | 'warm' | 'nurture'
  reasons: string[]
  lastActivity: string
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime()
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

export function computeLeadScores(clients: Client[], jobs: CategorizationJob[]): LeadScore[] {
  const byClient = new Map<string, CategorizationJob[]>()
  for (const j of jobs) {
    const key = j.client_name.toLowerCase()
    const arr = byClient.get(key) ?? []
    arr.push(j)
    byClient.set(key, arr)
  }

  return clients.map((c) => {
    const key = c.business_name.toLowerCase()
    const clientJobs = byClient.get(key) ?? []
    const sorted = [...clientJobs].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const last = sorted[0]

    let score = 40
    const reasons: string[] = ['Base firm fit']

    if (c.contact_email) {
      score += 15
      reasons.push('Contact email on file')
    }
    if (c.industry) {
      score += 10
      reasons.push('Industry identified')
    }

    const completed = sorted.filter((j) => j.status === 'completed').length
    if (completed > 0) {
      score += Math.min(25, completed * 8)
      reasons.push(`${completed} completed close(s)`)
    }
    const inReview = sorted.filter((j) => j.status === 'review' || j.status === 'processing').length
    if (inReview > 0) {
      score += 12
      reasons.push('Active engagement in progress')
    }

    const totalTx = sorted.reduce((s, j) => s + j.total_transactions, 0)
    if (totalTx > 200) {
      score += 10
      reasons.push('High transaction volume')
    } else if (totalTx > 50) {
      score += 5
      reasons.push('Moderate transaction volume')
    }

    if (last) {
      const d = daysSince(last.created_at)
      if (d <= 14) {
        score += 15
        reasons.push('Recent close activity')
      } else if (d <= 60) {
        score += 8
        reasons.push('Activity in last 60 days')
      } else {
        score -= 5
        reasons.push('Stale — re-engage')
      }
    } else {
      score -= 10
      reasons.push('No closes yet — onboarding opportunity')
    }

    score = Math.max(0, Math.min(100, Math.round(score)))

    const tier: LeadScore['tier'] =
      score >= 70 ? 'hot' : score >= 45 ? 'warm' : 'nurture'

    return {
      clientId: c.id,
      clientName: c.business_name,
      score,
      tier,
      reasons,
      lastActivity: last?.created_at ?? c.created_at ?? new Date().toISOString(),
    }
  })
}
