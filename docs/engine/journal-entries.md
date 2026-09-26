# Journal entries

Code: `src/lib/autopilot/journalEntries.ts` (`generateJournalEntries`).
Tests: `src/lib/autopilot/__tests__/journalEntries.test.ts` (`npm test`).

Used by the review page's **Export → Journal entries CSV** (`/api/export`,
format `journal_entries`), the **Journal entries** section of the close report
(`/api/report`), and the autopilot routes (`/api/autopilot/pipeline/start`,
`/api/autopilot/start-close`). The QuickBooks push does not use it yet.

## How an entry is built

Each approved transaction becomes one entry with two sides: the approved
account and the bank account. Both come from the client's chart of accounts.
Nothing is guessed from the description.

- **Approved account:** `final_account_code`. If a transaction is `approved`
  but has no `final_account_code` (AI auto-approvals only set the suggestion),
  its `suggested_account_code` is used, because approving accepts the
  suggestion. `edited` transactions must have a `final_account_code`.
- **Splits:** one line per split, plus one bank line for the full amount.
- **Memo:** `Posted to 6100 Subscriptions & Software` on the entry and on each
  account line. The bank line's memo is the bank description.
- **Source:** who chose the account.
  - `rule`: `categorizationSource` is `firm_rule` (a saved category rule).
  - `human`: `categorizationSource` is `manual`, or the status is `edited`.
  - `ai`: everything else, including `copilot`.

  `categorizationSource` and `splits` are not saved to Supabase yet. After a
  reload from Supabase, source falls back to the status (`edited` = human,
  otherwise ai) and splits are gone.
- **Entry #:** `JE-0001`, `JE-0002`, … in date order. Transactions with the
  same date keep their original order.

## Direction: `type`, not the sign of `amount`

Amounts are stored unsigned (the CSV parser takes the absolute value), so
direction comes from `type`:

| `type`   | Meaning   | Debit            | Credit           |
|----------|-----------|------------------|------------------|
| `debit`  | money out | approved account | bank             |
| `credit` | money in  | bank             | approved account |

The sign of `amount` is ignored; only its size is used.

## Bank account

The bank side is chosen from the chart of accounts, in this order:

1. the first **asset** account whose name contains "checking";
2. otherwise the account with code **1000** (the default in the templates);
3. otherwise the first **asset** account named "cash" or "bank".

If none match, there is no bank account and nothing posts. The account used
appears in the CSV's first line (`# Bank account: 1000 Checking Account`) and
in the report, so a reviewer can see the assumption.

## Exceptions (no entry)

These transactions produce no entry. Each is listed with its reason:

- flagged: `Flagged for review.`
- not approved (pending): `Not approved.`
- no bank account in the chart
- zero amount
- no approved account code, or a code that is not in the chart (this includes
  split codes)
- splits that don't add up to the transaction amount, or a split that isn't
  positive
- posted to the bank account itself (the entry would debit and credit the
  same account)

## Checks (entry posts, flagged for review)

Some entries post but get the flag `check: possible refund`:

- money in posted to an **expense** account;
- money out posted to a **revenue** account.

## Balance check

All math is done in whole cents, so 0.10 + 0.20 comes to exactly 0.30.
After building the entries, `assertBalanced` checks that debits equal credits
for each entry and for the whole journal. If either check fails, it throws
`JournalBalanceError` and returns no entries at all, so an unbalanced entry is
never output. The export returns the error as a 422. The report shows it in
place of "Balanced".
