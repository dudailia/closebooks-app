'use client'

import { useParams } from 'next/navigation'
import ClientPredictiveAdvisoryPage from '@/components/predict/ClientPredictiveAdvisoryPage'

export default function ClientPredictPage() {
  const { clientId } = useParams<{ clientId: string }>()
  return <ClientPredictiveAdvisoryPage clientId={clientId} />
}
