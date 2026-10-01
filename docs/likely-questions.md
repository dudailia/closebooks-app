# Likely questions from a CTO, with honest answers

Forty questions a CTO at an AI accounting company would ask about the
CloseBooks engine, grouped by topic. Each answer is short and points to the
code or document that backs it. Line numbers are for branch `overnight`
(created from `eval-harness`) at the end of the 2026-10-01 overnight session.

Ground rules for every answer:

- CloseBooks has no customers and no real client data. Every accuracy, cost
  and latency number comes from one **synthetic** labelled dataset (292 rows,
  one fictional business, one checking account, one 34-account chart). Numbers
  are copied from [facts.md](./facts.md), which names the source file for each.
- "Lenient" accepts the policy alternates in `eval/data/vendors.csv`;
  "strict" accepts only the primary label (definitions in facts.md).
- Where the honest answer is "I don't know yet", I say so and say how I'd
  find out.

Contents: [Architecture](#architecture) (1-5), [Data](#data-and-storage)
(6-9), [Prompt](#the-prompt) (10-14), [Accuracy](#accuracy-and-evaluation)
(15-20), [Calibration](#confidence-and-calibration) (21-25),
[Cost and latency](#cost-and-latency) (26-29),
[Security and multi-tenancy](#security-and-multi-tenancy) (30-35),
[Failure modes and scaling](#failure-modes-and-scaling) (36-38),
[What's weak](#whats-weak) (39-40).

---

## Architecture

### 1. Walk me through one statement from upload to journal entries.

The CSV is parsed in the browser (`src/lib/parseCSV.ts:157`). Firm rules run
first (`src/app/dashboard/upload/page.tsx:153-154`); matched rows skip the
model. The rest go to `POST /api/categorize`, which calls
`categorizeTransactions` (`src/lib/categorize.ts:347`): batches of 20, up to 4
at once, one Claude call per batch. Each suggestion is checked against the
chart (`src/lib/coaValidation.ts:39-88`) and gets a status: approved, pending
or flagged. The job is saved (`src/lib/db.ts:150`), reviewed on the review
page, and exported. Journal entries are built at export time by
`generateJournalEntries` (`src/lib/autopilot/journalEntries.ts:181`). Diagram:
[architecture.md](./architecture.md) section 1.

### 2. Why is so much of this in the browser? The upload page orchestrates the pipeline.

It started as a client-first demo with an in-memory store, and the
orchestration stayed there: rules, the categorise call, merging and saving
all run in `src/app/dashboard/upload/page.tsx:151-208`. The model call itself
is server-side, so the API key never reaches the browser. The cost is that
nothing durable happens if the tab closes mid-upload, and saving is
fire-and-forget (`upload/page.tsx:183`). For a real product I'd move the
pipeline into a server job (see question 38).

### 3. Why one model call per 20 rows instead of one per row or one per statement?

One call per row repeats the chart and system prompt every time, so it costs
more. One call per statement makes the reply long and means one parse error
loses the whole statement. 20 rows (`src/lib/categorize.ts:11`) keeps a
failure to 20 flagged rows (`categorize.ts:338`) and keeps the reply inside
`max_tokens: 4096` (`categorize.ts:254`). I did not measure other batch
sizes; every eval run used 20 (facts.md, "Accuracy per model").

### 4. Why not tool use or structured outputs for the reply?

The reply is a raw JSON array parsed from the text blocks
(`src/lib/categorize.ts:319`). Unreadable replies are retried once
(`categorize.ts:15`, `:283`). I haven't measured how often a reply is
unreadable with the current model. Structured output would remove that
failure class. I'd switch and confirm with the existing mocked-client tests
(`src/lib/__tests__/categorize.test.ts`) plus one capped eval run.

### 5. How much of the repo is the product you're showing me?

A small part. `DEMO_HIDE = true` (`src/lib/features.ts:10`) hides everything
outside the core path: the pages redirect, and `src/middleware.ts:55-60`
returns 404 for any API route not in `VISIBLE_API_ROUTES`
(`src/lib/features.ts:44-58`, 13 routes). Portal, inbox, Plaid, copilot,
autopilot and the QuickBooks push are all off. The engine is
`categorize.ts`, `coaValidation.ts`, `review/rules.ts`, `review/vendor.ts`
and `autopilot/journalEntries.ts`.

## Data and storage

### 6. What exactly do you send to Anthropic?

Per row: date, description, amount and direction. Per batch: the whole chart
(code, name, type) and up to 10 recent corrections
(`src/lib/categorize.ts:103-125`, `src/app/dashboard/upload/page.tsx:158`).
The client name is accepted by the route but not put in the prompt
(`src/app/api/categorize/route.ts:48-65`). Text fields are made single-line,
escaped and capped at 200 characters (`src/lib/promptSanitize.ts:17`,
`:27-32`). The PDF path is different: it sends up to 60,000 characters of
extracted statement text, which can include the account holder's name,
address and account number (`src/app/api/parse-pdf/route.ts:67-82`).

### 7. What's your data retention arrangement with Anthropic?

I don't know yet beyond the default commercial API terms; I have not
arranged zero data retention. Before any real client data, I'd read the
current API data-retention terms, request ZDR if the firm needs it, and write
the answer into the security doc.

### 8. Where does data live, and what happens if the database write fails?

In Supabase (`jobs`, `transactions`, `clients`, plus payload-row tables for
corrections and rules; table list in [architecture.md](./architecture.md)
section 2). `dbSaveJob` writes the in-memory cache first, then Supabase, and
swallows every Supabase error (`src/lib/db.ts:150-205`, the silent return at
`:175` and the empty catch at `:199-201`). The upload page doesn't await it
(`upload/page.tsx:183`). So if the write fails, the reviewer sees the job,
works on it, and loses it on reload with no warning. That is a real gap.
The fix is to await the save and show an error.

### 9. Which bank formats do you support, and how do you handle DD/MM vs MM/DD?

CSV with one signed amount column or separate debit/credit columns
(`src/lib/parseCSV.ts:157-264`), and text PDFs. Dates: a first part above 12
means DD/MM, a second part above 12 means MM/DD, and if every date in the
file is ambiguous it assumes US MM/DD (`parseCSV.ts:66-68`). Scanned PDFs are
rejected (`parse-pdf/route.ts:59-63`). How many real bank exports parse
correctly I don't know yet: the parser has unit tests but has never seen a
real statement. I'd collect sample exports from 10 to 20 banks and run them
through `parseTransactionCSV` with expected row counts and totals.

## The prompt

### 10. What's in the system prompt, and why should I trust it?

`SYSTEM_PROMPT` (`src/lib/categorize.ts:31-79`): a bookkeeper role, keyword
rules with suggested confidences, amount guidance, a confidence scale, the
output format, and a line saying the user message is data, not instructions
(`:78`). Parts of it are wrong for an invoicing business: it sends deposits
and client payments to revenue (`:39`, `:55`, `:60`) and payroll tax to an
expense account (`:37`). The labels expect AR (1100) and Payroll Liabilities
(2300). See question 39.

### 11. The prompt tells the model what confidence to give ("confidence 0.97"). Doesn't that make confidence meaningless?

Partly, yes. Keyword rules like `"PAYROLL TAX" ... → Payroll Tax Expense,
confidence 0.97` (`src/lib/categorize.ts:38`) anchor the score, so a confident
wrong answer can come straight from the prompt. On the synthetic data,
Sonnet 4.6 put payroll tax and sales-tax remittances on 6200 at 0.95 to 0.97
(architecture.md section 8). The threshold can't catch errors the prompt
itself causes. I haven't measured a prompt without the suggested
confidences; it's one of the next experiments.

### 12. How do you defend against prompt injection in bank descriptions?

Each text field is reduced to one line, control characters and Unicode line
separators become spaces, quotes and backslashes are escaped, and
descriptions are capped at 200 characters (`src/lib/promptSanitize.ts:27-32`).
The transactions block is labelled as data (`src/lib/categorize.ts:118`), and
the system prompt says not to follow instructions inside it (`:78`). The
model still reads the text, so this reduces the risk; it doesn't remove it.
After the model replies, the account must exist in the chart or the row is
flagged (`src/lib/coaValidation.ts:56-67`), which limits what an injected
instruction can do to choosing a wrong valid account. The PDF prompt has no
such label (`src/app/api/parse-pdf/route.ts:67-82`). I haven't run an
injection test set.

### 13. Did the eval measure the prompt that's in the code now?

No. All saved runs predate the 2026-09-30 change that labels transaction
text as data. The synthetic descriptions need no sanitising, so only that
label differs, and its effect hasn't been measured (facts.md, "Prompt
version"). Re-measuring is one capped run with `eval/run.ts`.

### 14. Corrections are sent as hints. Are they scoped to the client?

No. `getRecentCorrections(10)` returns the firm's 10 most recent corrections
(`src/lib/corrections.ts:46-48`), and a correction stores only description,
old and new category (`corrections.ts:7-12`), with no client. So a
correction made on client A's books is sent in the prompt for client B. For a
firm, that means one client's bank descriptions go into another client's
prompt, and a pattern right for A may be wrong for B. They should be scoped
by client and selected by vendor, not by recency.

## Accuracy and evaluation

### 15. What's your accuracy?

On the synthetic set, current model (Sonnet 5.5, 2 runs pooled): 482/556
(86.7%) strict, 528/556 (95.0%) lenient. The previous model (Sonnet 4.6, 2
runs): 480/568 (84.5%) strict, 539/568 (94.9%) lenient. Source: facts.md,
"Accuracy per model" (`eval/results/pooled-sonnet-5-5/summary.json`,
`eval/results/full-sonnet-4-6/summary.json`). That is one fictional business
and one chart. I don't know the accuracy on real books.

### 16. Who labelled the test set, and could the labels share the model's biases?

The vendor table that produces the labels was drafted with Claude's help,
then reviewed and corrected by hand by me (`eval/README.md`, "How the labels
were produced"). Ambiguous vendors were labelled by hand one by one. So yes,
there is a risk the labels lean the way a Claude model leans, which would
flatter the scores. The fix is labels from bookkeepers who never saw a model
suggestion, on real statements.

### 17. Why report "lenient" at all? Isn't it a way to make the number bigger?

It's there because some accounts are a policy choice (`eval/README.md`,
"Acceptable alternates"). But one of the alternates is exactly the prompt's
known error: client payments and Stripe payouts are accepted on 4100 revenue
instead of 1100 AR. So lenient hides that error. Strict is the number to hold
me to: 86.7% for the current model (facts.md). The gap shows up most in
auto-approvals: at 0.93, 1 of 274 (0.4%) wrong lenient but 20 of 274 (7.3%)
wrong strict. Of those 20, 19 are policy alternates (18 client payments to
4100 instead of 1100 AR, 1 Mailchimp charge to Software instead of Marketing)
and 1 is a real mistake (Gusto payroll tax to 5100 instead of 2300 Payroll
Liabilities). Source: facts.md, "What the strict errors are"
(`eval/results/strict-errors.md`).

### 18. 292 rows is tiny. How confident are you in any of these numbers?

Not very. 292 rows, 8 REVIEW rows, 2 runs per model at most (Haiku 4.5 one
run), one business, one chart (facts.md, "About the data", "REVIEW rows",
"Stability across runs"). The wrong-auto-approval rate at 0.93 is 1 of 274
lenient (one more error would double it) and 20 of 274 strict. I haven't computed confidence intervals. With
real data I'd want several hundred rows per firm from several firms and
intervals on every rate.

### 19. How stable are the predictions run to run?

Sonnet 5.5: 8 of 280 rows (2.9%) changed account between the two runs, and
9 (3.2%) changed auto-approve decision; mean confidence spread 0.013. Sonnet
4.6: 4 of 292 (1.4%), 6 (2.1%), 0.007. Source: facts.md, "Stability across
runs". Two runs shows that variation exists; it doesn't bound it.

### 20. Did you try other models?

Yes, on the same synthetic set. Haiku 4.5 (single run): 214/284 (75.4%)
strict, 246/284 (86.6%) lenient, and 30/230 (13.0%) lenient, 60/230 (26.1%)
strict wrong among auto-approved at 0.85. Opus 5.5 produced no usable predictions: all 8 calls
failed on a reply-parsing bug (thinking blocks) that is now fixed
(`src/lib/categorize.ts:319` reads text blocks only). Opus is unmeasured.
Source: facts.md, "Accuracy per model".

## Confidence and calibration

### 21. How did you choose 0.93?

From a threshold sweep over saved confidences, no new API calls
(`eval/sweep-cli.ts`, `eval/results/threshold-sweep.md`). For Sonnet 5.5
pooled over 2 runs, 0.93 auto-approves 274 rows (49.3%) with 1 wrong lenient
(0.4%) and 20 wrong strict (7.3%), and leaves 50.5 of 97 rows per statement
for review. The 2% target was set on the lenient figure: 0.91 met it on the
pooled runs (4 of 291 wrong lenient, 1.4%; 27 strict, 9.3%), but run 2 alone
needed 0.93 (facts.md, "Threshold sweep"). The constant is
`src/lib/ai/models.ts:15`. 19 of the 20 strict errors at 0.93 are client
payments and one Mailchimp charge on a policy alternate; 1 is a real mistake
(question 17). If a firm books client payments against invoices, strict is
the number that matters for it, and no threshold below 0.94 gets it under 2%
(0.94: 4 of 242, 1.7%, with 56.0 of 97 rows per statement to review;
facts.md, "Threshold sweep").

### 22. You picked the threshold on the same data you report it on. Isn't that overfitting?

Yes. There is no held-out set: the threshold was chosen and reported on the
same 292 rows. The 0.4% (lenient) and 7.3% (strict) are in-sample numbers
and will be worse on new data. The next experiment is a time split (choose on June, report on July
and August), and with real data a proper held-out month per firm.

### 23. Is confidence calibrated?

Moderately, on this data. Expected calibration error over 10 buckets, strict
labels: Sonnet 5.5 0.092, Sonnet 4.6 0.121, Haiku 4.5 0.202 (single run);
lenient: 0.067, 0.055, 0.089 (facts.md, "Calibration"). On top of the model's
score, `calibrateConfidence` subtracts 0.08 under $20 and caps short or
all-digit descriptions at 0.60 (`src/lib/categorize.ts:168-185`). Those two
adjustments are hand-set; I haven't measured whether they help.

### 24. What happens when the model returns an account that isn't in the chart?

The row is flagged, confidence is capped at 0.55, and a note is added
(`src/lib/coaValidation.ts:56-67`). If the code and name disagree, the
chart's account wins and the row can't auto-approve (`:70-72`, `:84`). If the
direction looks wrong (money out to revenue, money in to an expense),
confidence is capped at 0.60 (`:74-78`). A row missing from an otherwise good
reply is flagged (`src/lib/categorize.ts:396`).

### 25. Are there errors the threshold can't catch?

Yes: confident, consistent errors. On the synthetic data, Sonnet 5.5 books
Gusto payroll-tax impounds to 5100 instead of 2300 at 0.85 to 0.93, and one
of those at 0.93 was auto-approved; Sonnet 4.6 put payroll tax and sales-tax
remittances on 6200 at 0.95 to 0.97 (architecture.md section 8). These come
from the prompt (question 11). Only a prompt fix or a rule catches them.

## Cost and latency

### 26. What does a statement cost?

Categorisation only, list prices, no caching or batch discount: $0.111 per
97-row statement on Sonnet 5.5 ($0.00115 per row); $0.160 on Sonnet 4.6;
$0.050 on Haiku 4.5 (single run). Source: facts.md, "Cost"
(`summary.json` cost fields, prices in `eval/pricing.json`). The PDF path was
not measured. Total eval spend so far: $2.3571 (facts.md, "Total eval spend").

### 27. Why no prompt caching? The chart and system prompt repeat on every batch.

It isn't on in the app: the request has no `cache_control`
(`buildCategorizeRequest`, `src/lib/categorize.ts:131-163`). The eval can now
test it with `--cache` (two breakpoints, after the system prompt and after
the chart), and the code records cache read and write tokens
(`src/lib/categorize.ts:314-315`). I don't know yet what it saves. My
arithmetic says little: the repeated part is about 1,400 tokens (a
character-count estimate), output is about two thirds of a call's cost, and
with 4 batches starting at once the first 4 calls all write, so a 97-row
statement is about break-even. I also don't know whether Sonnet 5.5's minimum
cacheable length is met. The prepared experiment
([next-experiments.md](./next-experiments.md), part b) checks that first for
about $0.05, then measures on and off for about $1.32 in total.

### 28. How fast is it?

Median per transaction (batch time divided by 20): Sonnet 5.5 0.43 s (p90
0.46 s), Sonnet 4.6 1.15 s (p90 1.29 s), Haiku 4.5 0.53 s (single run).
Source: facts.md, "Latency". These were measured one batch at a time. The app
now runs 4 batches at once (`src/lib/categorize.ts:13`); end-to-end time with
concurrency against the real API is not measured, only with a fake model
(`src/lib/__tests__/categorizeConcurrency.test.ts`).

### 29. What stops someone running up your API bill?

Less than I'd like. `/api/categorize` needs a signed-in user with an active
trial or subscription (`src/app/api/categorize/route.ts:19-20`,
`src/lib/routeSubscription.ts:67-120`). It has a rate limit of 10 requests
per second per user (`route.ts:22`), but the limiter is in process memory, so
it's per server instance (`src/lib/rateLimit.ts:1-4`), and there is no cap on
rows per request (`route.ts:11`). The public `/api/demo/categorize` caps
requests at 25 rows, 8 runs per IP per hour and 500 runs per day, also per
instance (`src/app/api/demo/categorize/route.ts:38-52`). I'd add a row cap, a
per-firm monthly spend ledger, and a shared store for the counters.

## Security and multi-tenancy

### 30. How are tenants separated?

By Supabase row-level security on `firm_id`. Core tables (`clients`, `jobs`,
`transactions`) check firm membership, with staff or higher for writes
(audit in [engine/rls-audit.md](./engine/rls-audit.md), section 2a). The
browser uses the anon key with the user's session, so RLS is what separates
firms. The live database was never inspected; the audit is from the SQL files
in the repo (rls-audit.md section 1).

### 31. What did the security audit find, and what's still open?

Sixteen findings (rls-audit.md section 3). The worst: the `portal-docs`
bucket is readable and writable with the public anon key (F1), and members
can reset their own trial (F7). Hidden features' routes now return 404. The
F1 migration was applied on 2026-09-30, so the bucket is closed. Migrations
for F7, F8, part of F15, and (written overnight) F5, F9, F10 and F14 are
written but **not applied** (rls-audit.md section 0,
[migrations-to-apply.md](./migrations-to-apply.md)). Until F7's is applied,
anyone calling Supabase directly can reset a trial; the middleware can't block
that.

### 32. A user who belongs to two firms: which firm's data do they see?

Undefined. `cb_firm_id()` returns `firm_id ... limit 1` with no `order by`
(`supabase/migrations/20260416000000_firm_members_rls_audit.sql:119-127`),
and `category_rules` uses it. Meanwhile the app finds "my firm" by
`firms.owner_id` (`src/lib/db.ts:29-45`, `src/lib/supabase/firmScope.ts:14-18`).
So non-owner members don't persist at all today (the TODO at `db.ts:28`), and
a user in two firms can lose their rules. Finding F5 in rls-audit.md. It's
single-owner software right now. A migration written overnight (not applied,
`supabase/migrations/20261001600000_firm_members_insert_limits.sql`) makes
`cb_firm_id()` return the firm the user owns first, then their oldest
membership; it is tested on PGlite (`supabase/__tests__/migrations.test.ts`).

### 33. Firm rules: are they per client?

No, they're per firm. A rule stores a vendor key, direction and account code,
with no client and no chart (`src/lib/review/rules.ts:7-19`). At upload,
`applyRulesToJob` applies any matching rule to any client and marks the row
edited, confidence at least 0.99 (`rules.ts:134-156`), without checking the
account is in that client's chart. If it isn't, the journal-entry step lists
the row as an exception instead of posting it
(`src/lib/autopilot/journalEntries.ts`, exceptions in
[engine/journal-entries.md](./engine/journal-entries.md)), but the review page
still shows it as categorised. Rules should be scoped to a client, or at
least checked against the chart.

### 34. Does anything leave the system that a client wouldn't expect?

Yes: after each upload, `/api/notify` forwards an event with the **client
name** and row counts to a Formspree form, and the route has no
authentication (`src/app/api/notify/route.ts:3-35`,
`src/app/dashboard/upload/page.tsx:201-206`). It was an owner notification for
the demo. It should be removed or reduced to counts before real data.

### 35. Two clients with the same name?

They used to get mixed up: jobs stored only `client_name`. On branch
`overnight`, New Close step 1 picks a client from a list and the job stores
its id (`src/app/dashboard/upload/page.tsx:175`); matching is by id
(`src/lib/clientJobs.ts`), and the e2e test checks two same-name clients keep
separate closes. Jobs saved before, and jobs from `/get-started`, have no id
and still match by name. The `jobs.client_id` column's migration is written
but not applied, so with Supabase on, new jobs fall back to name matching
after a reload until it is.

## Failure modes and scaling

### 36. What happens when the API fails mid-statement?

Network and API errors are retried up to 3 attempts with 1 s and 2 s back-off
(`src/lib/categorize.ts:14`, `:284-285`); an unreadable reply is retried once
(`:15`, `:283`). If a batch still fails, its 20 rows are flagged with no
suggestion and the rest of the statement continues (`:336-338`). If the
whole request fails, the upload page shows an error and nothing is saved
(`upload/page.tsx:204-207`).

### 37. What's the largest statement you can process?

I don't know yet; it hasn't been measured against the real API. The
categorise function has a 120 s limit (`vercel.json`). 292 rows is 15 batches,
or 4 rounds at 4 at a time. Concurrency was only tested with a fake model, and
rate limits under 4 parallel calls are unmeasured (architecture.md section
8). PDFs have a lower ceiling: the file is sent as base64 JSON
(`src/components/FileUpload.tsx:51-55`) and Vercel caps request bodies at 4.5
MB, though the browser allows 20 MB (`FileUpload.tsx:40`); the PDF reply is
limited to 8,192 tokens (`src/app/api/parse-pdf/route.ts:88`). I'd find out
with a capped run on a synthetic 1,000-row file and one large text PDF.

### 38. How would this scale to 1,000 firms closing at month end?

Not as built. The pipeline runs in the browser and in one request, rate
limits are per instance, there's no queue, and no per-firm spend tracking.
I'd move categorisation to a background job with a queue per firm, store
batch results as they finish so a retry resumes, and add a spend ledger. I
haven't load-tested anything.

## What's weak

### 39. What's the weakest part of the engine?

The prompt's accounting policy. It sends deposits and client payments to
revenue (`src/lib/categorize.ts:40`, `:55`, `:60`) and payroll tax to an
expense (`:37`), which is wrong for a business that invoices or runs payroll
through a provider. On the synthetic data, Stripe payouts land on 4000
instead of 1100, and payroll-tax impounds on 5100 instead of 2300, sometimes
with high confidence (architecture.md section 8). Second weakest: the
evidence. One synthetic business, threshold chosen in-sample (questions 18
and 22).

### 40. Is the journal-entry balance check meaningful if every entry is built two-sided?

It mostly guards against my own bugs: split amounts that don't sum, rounding
(all math is in cents), and future multi-line entries
(`src/lib/autopilot/journalEntries.ts:157-174`). It doesn't say the entries
are right. The bank side is assumed to be one account picked by name
(`findBankAccount`, `journalEntries.ts:83`), and refunds are only flagged as
"check: possible refund" (`:253`, `:258`). There's no reconciliation of the
statement's opening and closing balances against the rows, so a missed or
duplicated row wouldn't be caught; I found no duplicate detection on upload.
Adding a balance reconciliation per statement is the next check I'd build.
