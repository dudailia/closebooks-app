// ─── In-process exception store ───────────────────────────────────────────────
// Intended to be populated by the autopilot close flow when exceptions are
// detected, then read by GET /api/agent/exceptions.
//
// This lived inside the route file, but a Next.js route module may only export
// HTTP handlers and route config — exporting `storeExceptions` from there made
// the production build fail once `typescript.ignoreBuildErrors` was turned off.
//
// NOTE: process-local and not persisted. It resets on every cold start and is
// not shared across serverless instances, so it is only meaningful within a
// single request lifetime. Replace with a Supabase table before relying on it.

export interface AgentException {
  id: string
  transactionId?: string
  description: string
  date: string
  amount: number
  agentSuggestion: string
  suggestedAccount: string
  confidence: number
  reasoning: string
  clientId: string
  resolvedAt?: string
  resolution?: string
}

const exceptionStore = new Map<string, AgentException[]>()

export function storeExceptions(clientId: string, exceptions: AgentException[]): void {
  exceptionStore.set(clientId, exceptions)
}

export function getExceptions(clientId: string): AgentException[] {
  return exceptionStore.get(clientId) ?? []
}

export function setExceptions(clientId: string, exceptions: AgentException[]): void {
  exceptionStore.set(clientId, exceptions)
}
