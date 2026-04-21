export type ConsolidationMethod = 'full' | 'equity' | 'proportional';

export type RelationshipType = 'parent' | 'subsidiary' | 'affiliate';

export interface EntityGroup {
  id: string;
  firm_id: string;
  name: string;
  parent_client_id: string | null;
  consolidation_method: ConsolidationMethod;
  currency: string;
  fiscal_year_end: string;
  created_at: string;
  updated_at: string;
}

export interface EntityGroupMember {
  id: string;
  group_id: string;
  client_id: string;
  client_name?: string;
  ownership_percentage: number;
  relationship_type: RelationshipType;
}

export interface IntercompanyTransaction {
  id: string;
  group_id: string;
  from_client_id: string;
  to_client_id: string;
  amount: number;
  description: string | null;
  account_code: string | null;
  period: string;
  eliminated: boolean;
  ai_detected: boolean;
  confidence: number | null;
}

export interface IntercompanyDetectionResult {
  fromClientId: string;
  fromClientName: string;
  toClientId: string;
  toClientName: string;
  amount: number;
  description: string;
  confidence: number;
  matchReason: string;
}

export interface EliminationEntry {
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  fromClientId: string;
  toClientId: string;
}

export interface ConsolidatedTrialBalanceLine {
  account: string;
  entityAmounts: Record<string, { debit: number; credit: number }>;
  eliminations: { debit: number; credit: number };
  consolidated: { debit: number; credit: number };
}

export interface ConsolidatedStatementLine {
  account: string;
  entityAmounts: Record<string, number>;
  eliminationAmount: number;
  consolidatedAmount: number;
}

export interface ConsolidatedSection {
  name: string;
  lines: ConsolidatedStatementLine[];
  subtotal: Record<string, number>;
}

export interface ConsolidatedStatement {
  title: string;
  period: string;
  entityIds: string[];
  sections: ConsolidatedSection[];
}

export interface ConsolidationResult {
  groupId: string;
  period: string;
  entityIds: string[];
  consolidatedTB: ConsolidatedTrialBalanceLine[];
  eliminations: EliminationEntry[];
  minorityInterest: number;
  statements: {
    pnl: ConsolidatedStatement;
    balanceSheet: ConsolidatedStatement;
  };
}

export interface EntityGroupWithMembers extends EntityGroup {
  members: EntityGroupMember[];
}
