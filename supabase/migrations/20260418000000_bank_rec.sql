-- Bank Reconciliation Module Migration

CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number_last4 TEXT,
  statement_date DATE NOT NULL,
  beginning_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  ending_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_statement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('debit','credit')) NOT NULL,
  reference_number TEXT,
  matched_transaction_id TEXT,
  match_confidence INTEGER CHECK (match_confidence BETWEEN 0 AND 100),
  status TEXT CHECK (status IN ('unmatched','matched','excluded')) DEFAULT 'unmatched'
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  statement_id UUID REFERENCES bank_statements(id),
  period TEXT NOT NULL,
  bank_balance DECIMAL(12,2) DEFAULT 0,
  book_balance DECIMAL(12,2) DEFAULT 0,
  difference DECIMAL(12,2) DEFAULT 0,
  status TEXT CHECK (status IN ('in_progress','completed','locked')) DEFAULT 'in_progress',
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID REFERENCES reconciliations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('outstanding_check','deposit_in_transit','bank_adjustment','book_adjustment')) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT CHECK (status IN ('open','cleared','voided')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_stmts_client ON bank_statements(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_stmts_firm ON bank_statements(firm_id);
CREATE INDEX IF NOT EXISTS idx_bank_lines_stmt ON bank_statement_lines(statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_lines_status ON bank_statement_lines(status);
CREATE INDEX IF NOT EXISTS idx_recs_client ON reconciliations(client_id);
CREATE INDEX IF NOT EXISTS idx_recs_firm ON reconciliations(firm_id);
CREATE INDEX IF NOT EXISTS idx_rec_items_rec ON reconciliation_items(reconciliation_id);

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_bank_statements" ON bank_statements
  FOR ALL USING (firm_id = auth.uid()::text);

CREATE POLICY "own_bank_lines" ON bank_statement_lines
  FOR ALL USING (
    statement_id IN (SELECT id FROM bank_statements WHERE firm_id = auth.uid()::text)
  );

CREATE POLICY "own_reconciliations" ON reconciliations
  FOR ALL USING (firm_id = auth.uid()::text);

CREATE POLICY "own_rec_items" ON reconciliation_items
  FOR ALL USING (
    reconciliation_id IN (SELECT id FROM reconciliations WHERE firm_id = auth.uid()::text)
  );
