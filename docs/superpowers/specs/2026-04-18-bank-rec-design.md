# Bank Reconciliation Module — Design Spec
**Date:** 2026-04-18  
**Status:** Approved  
**Scope:** Full bank rec module for CloseBooks

---

## 1. Overview

Add a complete bank reconciliation workspace to CloseBooks under `src/app/dashboard/clients/[clientId]/bank-rec/`. This addresses the #2 most time-consuming CPA task after categorization. The module handles statement import, auto-matching, manual reconciliation, and generates the standard accountant's reconciliation report.

---

## 2. Architecture

### Route Structure
```
src/app/dashboard/clients/[clientId]/bank-rec/
  page.tsx              ← List reconciliations, upload new statement
  [recId]/page.tsx      ← Full workspace for a specific reconciliation
```

### API Routes
```
src/app/api/bank-rec/
  statement/route.ts       POST: upload + parse CSV/OFX/PDF → save to Supabase
  match/route.ts           POST: run auto-match algorithm
  ai-match/route.ts        POST: Claude AI matching for remaining unmatched
  reconciliation/route.ts  GET/POST/PUT: CRUD reconciliations + items
```

### Library
```
src/lib/bank-rec/
  types.ts         TypeScript types for all bank rec entities
  parse-csv.ts     Auto-detect column mapping, normalize dates/amounts
  parse-ofx.ts     OFX/QFX SGML parser (custom, no deps)
  parse-pdf.ts     pdf-parse text extraction + Claude Vision fallback
  matching.ts      Exact → amount → compound → AI queue algorithm
  storage.ts       Supabase CRUD for all 4 tables
```

### UI Components
```
src/components/bank-rec/
  UploadStatement.tsx         Drag-to-upload, auto-detect format (CSV/OFX/PDF)
  ReconciliationWorkspace.tsx Orchestrates workspace state, panels, actions
  StatementPanel.tsx          Left: bank statement lines, unmatched highlighted amber
  BookPanel.tsx               Right: book transactions from localStorage jobs
  MatchedPairs.tsx            Center: matched pairs with confidence badges
  BalanceBar.tsx              Sticky header: bank bal / book bal / difference
  ReconciliationReport.tsx    Print-to-PDF standard reconciliation report
```

---

## 3. Data Model (Supabase)

```sql
-- One per uploaded bank statement file
CREATE TABLE bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number_last4 TEXT,
  statement_date DATE NOT NULL,
  beginning_balance DECIMAL(12,2) NOT NULL,
  ending_balance DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual transactions from the bank statement
CREATE TABLE bank_statement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('debit', 'credit')) NOT NULL,
  reference_number TEXT,
  matched_transaction_id TEXT,  -- TEXT: refs localStorage txn ID (future: QB ID)
  match_confidence INTEGER CHECK (match_confidence BETWEEN 0 AND 100),
  status TEXT CHECK (status IN ('unmatched', 'matched', 'excluded')) DEFAULT 'unmatched'
);

-- One reconciliation per client period
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  statement_id UUID REFERENCES bank_statements(id),
  period TEXT NOT NULL,           -- e.g. "2024-01"
  bank_balance DECIMAL(12,2),
  book_balance DECIMAL(12,2),
  difference DECIMAL(12,2),
  status TEXT CHECK (status IN ('in_progress', 'completed', 'locked')) DEFAULT 'in_progress',
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outstanding items: checks, deposits in transit, adjusting entries
CREATE TABLE reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID REFERENCES reconciliations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('outstanding_check', 'deposit_in_transit', 'bank_adjustment', 'book_adjustment')) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT CHECK (status IN ('open', 'cleared', 'voided')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only see their own firm's data
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
```

---

## 4. Import Engine

### CSV Auto-Detection
- Detect column mapping by header keywords: date (date/posted/trans), description (desc/memo/narrative), amount (amount/debit/credit/withdrawal/deposit)
- Handle combined debit/credit columns and separate debit/credit columns
- Normalize date formats: MM/DD/YYYY, YYYY-MM-DD, M/D/YY, etc.
- Strip currency symbols and commas from amounts

### OFX/QFX Parser
- SGML-like format: extract `<STMTTRN>` blocks
- Fields: `<DTPOSTED>`, `<TRNAMT>`, `<NAME>`, `<MEMO>`, `<FITID>` (reference)
- Handle both OFX 1.x (SGML) and OFX 2.x (XML)

### PDF Parser
1. Use `pdf-parse` (already in package.json) to extract text
2. Send extracted text to Claude: "Parse these bank statement lines. Return JSON array with date, description, amount, type (debit/credit)"
3. If pdf-parse returns blank (scanned PDF), use Claude Vision: convert PDF pages to images, send to Claude vision API
4. Normalize output to `BankStatementLine[]`

---

## 5. Matching Algorithm

Priority order for each unmatched bank line:

```
1. EXACT     amount === bookAmount AND date diff ≤ 1 day AND ref# matches
             → confidence 100

2. AMOUNT    amount === bookAmount AND date diff ≤ 3 business days
             → confidence 85 + (3 - dayDiff) * 3 ... maps to 85-94

3. FUZZY     |amount - bookAmount| ≤ 0.01 AND date diff ≤ 5 days
             → confidence 70-84

4. COMPOUND  bankAmount === sum(2-3 book entries) AND all dates ≤ 3 days
             → confidence 75-90

5. AI QUEUE  remaining unmatched → batch send to Claude with context
             "Bank: '{desc}' ${amount} on {date}. Book candidates: [list]"
             → Claude returns match suggestion + confidence 0-100
```

Match confidence display:
- **Green badge** (90-100): Auto-suggested, one-click confirm
- **Amber badge** (70-89): Review suggested  
- **Red badge** (<70): Needs manual work or investigation

---

## 6. Workspace UI

### Layout
```
┌──────────────────────────────────────────────────────┐
│  BALANCE BAR: Bank $X  │  Book $Y  │  Diff $Z        │
├──────────────┬──────────────────┬────────────────────┤
│ BANK LINES   │  MATCHED PAIRS   │  BOOK TRANSACTIONS │
│ (unmatched   │  (click to       │  (unmatched        │
│  amber)      │   unmatch)       │   amber)           │
│              │                  │                    │
│ Click to     │  confidence      │  Click to          │
│ select →     │  badges          │  select →          │
└──────────────┴──────────────────┴────────────────────┘
[Auto-Match]  [AI Match]  [Create JE]  [Complete Rec]
```

### Interaction Model (no new dependencies)
1. Click a bank line → highlights amber, enters "selecting" mode
2. Click one or more book transactions → compound match candidate
3. Press Enter or click "Match" → creates match
4. Click a matched pair → unmatch
5. "Auto-Match" button → runs algorithm, shows results with confidence badges
6. "AI Match" → sends remaining unmatched to Claude, populates suggestions
7. "Create JE" → opens modal for bank items with no book entry
8. "Complete Rec" → validates difference === 0.00, locks reconciliation

---

## 7. Reconciliation Report

Standard accountant format, printable via `window.print()`:

```
BANK RECONCILIATION — [Client] — [Period]

Bank Statement Balance:                    $XX,XXX.XX
  Add: Deposits in Transit               +$X,XXX.XX
  Less: Outstanding Checks              -$X,XXX.XX
                                         ──────────
Adjusted Bank Balance:                    $XX,XXX.XX

Book Balance:                             $XX,XXX.XX
  Add: Bank Adjustments                 +$XXX.XX
  Less: Book Adjustments               -$XXX.XX
                                         ──────────
Adjusted Book Balance:                    $XX,XXX.XX

Difference (must be $0.00):               $0.00  ✓

Prepared by: [CPA name]  Date: [date]
```

---

## 8. Historical Tracking

- Prior period's reconciliation pre-populates the current period's starting point
- Outstanding checks/deposits from prior period carry forward automatically
- Trend metrics on the index page: avg items per rec, days to complete, outstanding check aging

---

## 9. Navigation

Add "Bank Rec" to the Sidebar nav under the client section. Route: `/dashboard/clients/[clientId]/bank-rec`.

---

## 10. Implementation Sequence

1. Supabase migration (4 tables + RLS)
2. TypeScript types
3. Parse libraries: CSV → OFX → PDF
4. Supabase storage layer
5. API routes: statement upload, match, reconciliation CRUD, AI match
6. UI components: UploadStatement → BalanceBar → StatementPanel → BookPanel → MatchedPairs → ReconciliationWorkspace → ReconciliationReport
7. Pages: bank-rec index + workspace
8. Sidebar nav update

---

## 11. Dependencies

No new npm packages required. Uses:
- `@supabase/supabase-js` (already installed)
- `@anthropic-ai/sdk` (already installed)
- `pdf-parse` (already installed)
- `papaparse` (already installed — for CSV)
