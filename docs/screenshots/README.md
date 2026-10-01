# Screenshots from the end-to-end test

Made by `npm run e2e` (`e2e/core-path.spec.ts`), on a local build in demo
mode (no Supabase) with the **fake model** (`src/lib/ai/fakeCategorizer.ts`).
The accounts and confidences on screen come from that keyword stand-in, **not
from Claude**, so they say nothing about the engine's accuracy. All data is
synthetic: `e2e/fixtures/us-dates-8.csv` (8 rows, US dates, written for the
test) and `eval/data/synthetic_upload.csv` (292 rows, fictional Brightline
Studio LLC).

| File | Step |
|---|---|
| `01-demo-dashboard.png` | Demo mode opens the dashboard with no sign-in |
| `02-new-client-form.png`, `03-client-created.png` | Two clients with the same name created on the Clients page |
| `04a-new-close-client-picker.png` | New Close step 1: searchable client list (two clients share the name; the email tells them apart) |
| `04-chart-of-accounts.png` | New Close step 2: the 34-account Standard Small Business template |
| `05-upload-preview-us-dates.png` | 8-row file with MM/DD/YYYY dates, read as August 2026 |
| `06-review-after-categorise.png` | Review page after categorising |
| `07-recategorise-and-rule-offer.png` | Stripe payout moved from 4100 to 1100 Accounts Receivable; "Always categorize ...?" offer |
| `08-all-approved.png` | All 8 rows approved |
| `09-export-menu.png` | Export menu with the journal-entry CSV |
| `10-close-report.png` | Close report, full page, with the journal entries section |
| `11-second-close-rule-applied.png` | Second close (292 rows): Stripe payouts on 1100 from the saved rule, marked Edited; these 5 rows were not sent to the model |
| `12-clients-closes-by-id.png` | Clients page: both closes are on the chosen client (2 closes); its same-name twin has 0 |
