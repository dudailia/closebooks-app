import { TrialBalanceLine } from '@/lib/autopilot/pipelineTypes';
import {
  ConsolidatedTrialBalanceLine,
  ConsolidatedStatement,
  ConsolidatedStatementLine,
  ConsolidatedSection,
  EliminationEntry,
  EntityGroupMember,
  IntercompanyTransaction,
} from './types';

export function buildConsolidatedTrialBalance(
  entityTBs: Record<string, TrialBalanceLine[]>,
  members: EntityGroupMember[],
  eliminations: EliminationEntry[]
): ConsolidatedTrialBalanceLine[] {
  // Collect all unique account names
  const allAccounts = new Set<string>();
  for (const lines of Object.values(entityTBs)) {
    for (const line of lines) {
      allAccounts.add(line.account);
    }
  }
  // Add elimination accounts
  for (const entry of eliminations) {
    allAccounts.add(entry.debitAccount);
    allAccounts.add(entry.creditAccount);
  }

  const entityIds = members.map((m) => m.client_id);

  const result: ConsolidatedTrialBalanceLine[] = [];

  for (const account of Array.from(allAccounts)) {
    const entityAmounts: Record<string, { debit: number; credit: number }> = {};

    for (const entityId of entityIds) {
      const lines = entityTBs[entityId] ?? [];
      const match = lines.find((l) => l.account === account);
      entityAmounts[entityId] = {
        debit: match?.debit ?? 0,
        credit: match?.credit ?? 0,
      };
    }

    // Sum eliminations for this account
    const eliminationDebits = eliminations
      .filter((e) => e.debitAccount === account)
      .reduce((sum, e) => sum + e.amount, 0);
    const eliminationCredits = eliminations
      .filter((e) => e.creditAccount === account)
      .reduce((sum, e) => sum + e.amount, 0);

    const eliminationEntry = { debit: eliminationDebits, credit: eliminationCredits };

    // Consolidated = sum of all entity amounts minus eliminations
    const totalEntityDebit = entityIds.reduce(
      (sum, id) => sum + (entityAmounts[id]?.debit ?? 0),
      0
    );
    const totalEntityCredit = entityIds.reduce(
      (sum, id) => sum + (entityAmounts[id]?.credit ?? 0),
      0
    );

    const consolidated = {
      debit: totalEntityDebit - eliminationEntry.debit,
      credit: totalEntityCredit - eliminationEntry.credit,
    };

    result.push({ account, entityAmounts, eliminations: eliminationEntry, consolidated });
  }

  return result;
}

export function calculateMinorityInterest(
  entityTBs: Record<string, TrialBalanceLine[]>,
  members: EntityGroupMember[]
): number {
  let minorityInterestShare = 0;

  for (const member of members) {
    if (member.ownership_percentage >= 100 || member.relationship_type !== 'subsidiary') {
      continue;
    }

    const lines = entityTBs[member.client_id] ?? [];
    const entityNetAssets = lines.reduce((sum, line) => {
      // Net assets = credits (equity/liability) - debits
      return sum + (line.credit - line.debit);
    }, 0);

    const minorityFraction = 1 - member.ownership_percentage / 100;
    minorityInterestShare += minorityFraction * entityNetAssets;
  }

  return minorityInterestShare;
}

export function generateEliminationEntries(
  intercompanyTxns: IntercompanyTransaction[]
): EliminationEntry[] {
  return intercompanyTxns
    .filter((txn) => txn.eliminated)
    .map((txn) => ({
      description: `Eliminate: ${txn.description ?? 'intercompany transaction'}`,
      debitAccount: 'Intercompany Payable',
      creditAccount: 'Intercompany Receivable',
      amount: txn.amount,
      fromClientId: txn.from_client_id,
      toClientId: txn.to_client_id,
    }));
}

// Account classification helpers
function isRevenue(account: string): boolean {
  return ['Revenue', 'Income', 'Sales'].some((kw) => account.includes(kw));
}

function isCOGS(account: string): boolean {
  return account.includes('Cost of Goods');
}

function isExpense(account: string): boolean {
  return [
    'Expense',
    'Payroll',
    'Rent',
    'Insurance',
    'Travel',
    'Marketing',
    'Software',
    'Professional',
    'Utilities',
    'Office',
    'Fees',
    'Meals',
  ].some((kw) => account.includes(kw));
}

function isAsset(account: string): boolean {
  return ['Cash', 'Receivable', 'Asset', 'Equipment', 'Inventory', 'Prepaid'].some((kw) =>
    account.includes(kw)
  );
}

function isLiability(account: string): boolean {
  return ['Payable', 'Liability', 'Loan', 'Credit', 'Deferred'].some((kw) =>
    account.includes(kw)
  );
}

function isEquity(account: string): boolean {
  return ['Equity', 'Retained', 'Capital', 'Stock'].some((kw) => account.includes(kw));
}

function netAmount(
  line: ConsolidatedTrialBalanceLine,
  entityId: string,
  isDebitNormal: boolean
): number {
  const amounts = line.entityAmounts[entityId] ?? { debit: 0, credit: 0 };
  return isDebitNormal
    ? amounts.debit - amounts.credit
    : amounts.credit - amounts.debit;
}

function buildSection(
  name: string,
  lines: ConsolidatedTrialBalanceLine[],
  entityIds: string[],
  isDebitNormal: boolean
): ConsolidatedSection {
  const sectionLines: ConsolidatedStatementLine[] = lines.map((line) => {
    const entityAmounts: Record<string, number> = {};
    for (const entityId of entityIds) {
      entityAmounts[entityId] = netAmount(line, entityId, isDebitNormal);
    }

    const eliminationAmount = isDebitNormal
      ? line.eliminations.debit - line.eliminations.credit
      : line.eliminations.credit - line.eliminations.debit;

    const consolidatedAmount = isDebitNormal
      ? line.consolidated.debit - line.consolidated.credit
      : line.consolidated.credit - line.consolidated.debit;

    return { account: line.account, entityAmounts, eliminationAmount, consolidatedAmount };
  });

  // Build subtotals
  const subtotal: Record<string, number> = {};
  for (const entityId of entityIds) {
    subtotal[entityId] = sectionLines.reduce(
      (sum, l) => sum + (l.entityAmounts[entityId] ?? 0),
      0
    );
  }
  subtotal['eliminations'] = sectionLines.reduce((sum, l) => sum + l.eliminationAmount, 0);
  subtotal['consolidated'] = sectionLines.reduce((sum, l) => sum + l.consolidatedAmount, 0);

  return { name, lines: sectionLines, subtotal };
}

export function buildConsolidatedStatements(
  consolidatedTB: ConsolidatedTrialBalanceLine[],
  entityIds: string[],
  period: string
): { pnl: ConsolidatedStatement; balanceSheet: ConsolidatedStatement } {
  const revenueLines = consolidatedTB.filter((l) => isRevenue(l.account));
  const cogsLines = consolidatedTB.filter((l) => isCOGS(l.account));
  const expenseLines = consolidatedTB.filter(
    (l) => isExpense(l.account) && !isCOGS(l.account)
  );
  const assetLines = consolidatedTB.filter((l) => isAsset(l.account));
  const liabilityLines = consolidatedTB.filter((l) => isLiability(l.account));
  const equityLines = consolidatedTB.filter((l) => isEquity(l.account));

  const pnl: ConsolidatedStatement = {
    title: 'Consolidated Profit & Loss',
    period,
    entityIds,
    sections: [
      buildSection('Revenue', revenueLines, entityIds, false),
      buildSection('Cost of Goods Sold', cogsLines, entityIds, true),
      buildSection('Operating Expenses', expenseLines, entityIds, true),
    ],
  };

  const balanceSheet: ConsolidatedStatement = {
    title: 'Consolidated Balance Sheet',
    period,
    entityIds,
    sections: [
      buildSection('Assets', assetLines, entityIds, true),
      buildSection('Liabilities', liabilityLines, entityIds, false),
      buildSection('Equity', equityLines, entityIds, false),
    ],
  };

  return { pnl, balanceSheet };
}
