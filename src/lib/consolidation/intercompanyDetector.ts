import Anthropic from '@anthropic-ai/sdk';
import { IntercompanyDetectionResult } from './types';

interface RawTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date?: string;
}

interface DetectionCandidate {
  fromClientId: string;
  toClientId: string;
  amount: number;
  description: string;
  confidence: number;
  matchReason: string;
}

export async function detectIntercompanyTransactions(
  groupId: string,
  entityTransactions: Record<string, RawTransaction[]>,
  memberNames: Record<string, string>,
  period: string
): Promise<IntercompanyDetectionResult[]> {
  const candidates: DetectionCandidate[] = [];
  const entityIds = Object.keys(entityTransactions);

  // --- Rule-based pre-scan ---
  for (let i = 0; i < entityIds.length; i++) {
    for (let j = 0; j < entityIds.length; j++) {
      if (i === j) continue;

      const fromId = entityIds[i];
      const toId = entityIds[j];
      const fromName = memberNames[fromId] ?? fromId;
      const toName = memberNames[toId] ?? toId;
      const fromTxns = entityTransactions[fromId] ?? [];
      const toTxns = entityTransactions[toId] ?? [];

      for (const txnA of fromTxns) {
        // Name mention check
        const descLower = txnA.description.toLowerCase();
        const toNameLower = toName.toLowerCase();
        if (descLower.includes(toNameLower)) {
          candidates.push({
            fromClientId: fromId,
            toClientId: toId,
            amount: Math.abs(txnA.amount),
            description: txnA.description,
            confidence: 0.85,
            matchReason: `Transaction in "${fromName}" mentions "${toName}" in description`,
          });
          continue;
        }

        // Amount matching check — one debit, one credit
        for (const txnB of toTxns) {
          const amountMatch = Math.abs(Math.abs(txnA.amount) - Math.abs(txnB.amount)) < 0.01;
          const typesMatch =
            txnA.type !== txnB.type ||
            (txnA.type === 'debit' && txnB.type === 'credit') ||
            (txnA.type === 'credit' && txnB.type === 'debit');

          if (amountMatch && typesMatch) {
            candidates.push({
              fromClientId: fromId,
              toClientId: toId,
              amount: Math.abs(txnA.amount),
              description: `${txnA.description} / ${txnB.description}`,
              confidence: 0.85,
              matchReason: `Matching amount $${Math.abs(txnA.amount).toFixed(2)} between "${fromName}" and "${toName}" with opposing types`,
            });
          }
        }
      }
    }
  }

  // --- AI scan ---
  let aiResults: DetectionCandidate[] = [];

  try {
    const client = new Anthropic();

    // Truncate: up to 100 total transactions across entities
    const totalCount = Object.values(entityTransactions).reduce(
      (sum, txns) => sum + txns.length,
      0
    );
    const shouldTruncate = totalCount > 100;

    const prompt = `You are analyzing transactions across multiple related business entities to find intercompany transactions that should be eliminated in consolidation.

Entities:
${JSON.stringify(Object.entries(memberNames).map(([id, name]) => ({ id, name })))}

Transactions by entity:
${JSON.stringify(
  Object.entries(entityTransactions).map(([clientId, txns]) => ({
    entity: memberNames[clientId] || clientId,
    clientId,
    transactions: txns.slice(0, 30).map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
    })),
  }))
)}

Identify intercompany transaction pairs: transactions in one entity that correspond to a matching transaction in another entity (same amount, one pays/records and the other receives/records).

Return JSON array only, no markdown:
[{ "fromClientId": "...", "toClientId": "...", "amount": 0, "description": "...", "confidence": 0.0-1.0, "matchReason": "..." }]`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      const parsed = JSON.parse(textContent.text) as Array<{
        fromClientId: string;
        toClientId: string;
        amount: number;
        description: string;
        confidence: number;
        matchReason: string;
      }>;

      aiResults = parsed.map((item) => ({
        fromClientId: item.fromClientId,
        toClientId: item.toClientId,
        amount: item.amount,
        description: item.description,
        confidence: item.confidence,
        matchReason: item.matchReason,
      }));
    }
  } catch {
    // AI call failed — fall back to rule-based results only
  }

  // --- Merge and deduplicate ---
  const allCandidates = [...candidates, ...aiResults];

  // Key: fromClientId|toClientId|amount (rounded to 2dp)
  const deduped = new Map<string, DetectionCandidate>();
  for (const candidate of allCandidates) {
    const key = `${candidate.fromClientId}|${candidate.toClientId}|${candidate.amount.toFixed(2)}`;
    const existing = deduped.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      deduped.set(key, candidate);
    }
  }

  // Filter to confidence >= 0.6 and map to result type
  return Array.from(deduped.values())
    .filter((c) => c.confidence >= 0.6)
    .map((c) => ({
      fromClientId: c.fromClientId,
      fromClientName: memberNames[c.fromClientId] ?? c.fromClientId,
      toClientId: c.toClientId,
      toClientName: memberNames[c.toClientId] ?? c.toClientId,
      amount: c.amount,
      description: c.description,
      confidence: c.confidence,
      matchReason: c.matchReason,
    }));
}
