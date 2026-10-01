# Demo script: 5 minutes on the live app

For a call with a CTO who wants to see the engine, not the UI. Each step says
what to click and what to say. The sentences in quotes are written to be said
out loud.

## Which version you are showing

The live app at https://closebooks-app.vercel.app deploys from `main`. The
newer engine work is on `eval-harness` (and `overnight`), which is **not
deployed**. Say this at the start, because the numbers you quote for the new
setting were not measured on the build on screen.

| | Live app (`main`) | Branch (`eval-harness`, not deployed) |
|---|---|---|
| Categorisation model | Claude Sonnet 4.6 (`const MODEL`, `src/lib/categorize.ts:5` on `main`) | Claude Sonnet 5.5 (`CATEGORIZE_MODEL`, `src/lib/ai/models.ts`) |
| Auto-approve threshold | 0.85 (`src/lib/categorize.ts:9` on `main`) | 0.93 |
| Batches of 20 rows | one at a time | 4 at a time |
| Firm rules | applied when the review page opens | applied before the AI call at upload; matched rows skip the AI |
| Vendor keys for rules | older normaliser | strips dates, IDs, card digits, phones (`src/lib/review/vendor.ts`) |
| Prompt text fields | as uploaded | one line, escaped, labelled as data (`src/lib/promptSanitize.ts`) |
| Hidden features' API routes | still served | 404 (`src/middleware.ts`) |

Measured numbers for both settings (synthetic data only, `docs/facts.md`):

| Setting | Wrong among auto-approved | Review rows per 97-row statement | Source |
|---|---:|---:|---|
| Sonnet 4.6 at 0.85 (live) | 27 of 468 (5.8%) | 19.3 | `eval/results/threshold-sweep.md` |
| Sonnet 5.5 at 0.93 (branch) | 1 of 274 (0.4%) | 50.5 | `eval/results/threshold-sweep.md` |

Cost per 97-row statement, categorisation call only: $0.160 for Sonnet 4.6,
$0.111 for Sonnet 5.5 (`eval/results/comparison.md`, from each run's
`summary.json`).

## Before the call (10 minutes)

1. **Make a 60-row file.** The full synthetic file has 292 rows. On `main`
   batches run one at a time, and Sonnet 4.6 measured a median 1.15 s per
   transaction (`docs/facts.md`, Latency). By that figure 292 rows would take
   about 5.6 minutes, past the 120 s limit on `/api/categorize`
   (`vercel.json`). 60 rows is 3 batches, about 70 s by the same arithmetic.
   This is an estimate from the measured median, not a timed run.

   ```
   head -61 eval/data/synthetic_upload.csv > ~/Desktop/brightline-june-60.csv
   ```

   The first 60 rows include Stripe transfers, a Gusto payroll-tax impound and
   an IRS payment, which are the rows worth talking about.
2. **Sign in** to the live app with a demo account made beforehand. Email
   confirmation is off for the demo (a Supabase dashboard setting). The free
   tier allows 5 closes (`FREE_CLOSES`, `src/lib/freeTrial.ts:8` on `main`);
   check the account has one left.
3. **Delete any old "Brightline Studio LLC" client.** Jobs are linked to
   clients by name (`src/app/dashboard/review/[jobId]/page.tsx:962`), so two
   clients with the same name get mixed up.
4. **Allow pop-ups** for the site. The Report button opens the report in a new
   tab after a network call, and some browsers block that.
5. Open these in other tabs: `docs/technical-overview.md`,
   `eval/results/threshold-sweep.md`, `docs/engine/journal-entries.md`.

## The walkthrough

### 0:00 to 0:30. Framing

Click nothing. Dashboard is on screen.

> "This is CloseBooks. It takes a bank statement, suggests an account from the
> client's chart for every line, a person reviews it, and it produces balanced
> journal entries and a close report."
>
> "Two things up front. First, there are no customers and no real client data.
> The file I'm uploading is synthetic: a fictional design studio called
> Brightline Studio. Second, this live build runs Sonnet 4.6 with an
> auto-approve threshold of 0.85. The branch I'm working on uses Sonnet 5.5 at
> 0.93. That isn't deployed yet, and I'll say which numbers belong to which."

### 0:30 to 1:00. Client

1. Sidebar: **Clients**, then **Add Client**.
2. Business Name: `Brightline Studio LLC`. Industry: Professional Services.
   Click **Add Client**.
3. Open the client, click **New Close**. This fills in the client name.

> "A close is one statement for one client. Today the job stores the client's
> name, not an id. That's a known weakness and it's on my fix list."

### 1:00 to 1:30. Chart of accounts

1. Step **Client** ("Who is this close for?") shows the name. Click
   **Continue →**.
2. Step **Accounts**: **Standard Small Business** is selected
   ("34 accounts · all types"). Scroll the table briefly.
3. Click **Use these 34 accounts →**.

> "The model can only pick from this chart. The whole chart, code, name and
> type, goes into every prompt. If the model names an account that isn't in
> the chart, the row is flagged and its confidence is capped at 0.55, so it
> can't be auto-approved. This 34-account chart is the one I evaluated on."

### 1:30 to 2:30. Upload and categorise

1. Step **Statement**: drop `brightline-june-60.csv` on "Drop your bank
   statement here".
2. The preview shows the parsed rows. Click **Continue with 60 transactions →**.
3. Step **Categorize**: the summary shows 60 transactions, 34 accounts,
   3 AI batches. Click **✦ Categorize with AI**.

While the progress bar runs (about a minute):

> "The CSV is parsed in the browser. Amounts are stored unsigned, and the
> direction, money in or money out, is kept as a separate field."
>
> "On the server, rows go to Claude in batches of 20. Each request has a
> system prompt with bookkeeping rules and a confidence scale, then the chart,
> up to 10 of the firm's recent corrections as hints, and the rows numbered 0
> to 19. The client's name is not sent to the model. The reply is a JSON array
> with an account, a confidence and a one-line reason per row."
>
> "If a reply can't be read, the batch is retried once. If it still fails,
> those 20 rows are flagged for a person and the rest of the upload carries on."

If it fails: the button changes to **↺ Try again**. Click it once. If it fails
again, go to the backup plan.

### 2:30 to 3:30. Review

The review page opens with Total, Approved, Pending and Flagged counts.

1. Point at the counts.

> "Rows at 0.85 or higher with no validation flag were approved without a
> person. On my synthetic set, at this setting, 27 of 468 auto-approved rows
> had the wrong account, 5.8%. That's why I moved the branch to 0.93, where it
> was 1 of 274. The price is review load: about 19 of 97 rows per statement go
> to a person today, about 50 of 97 at the new setting."

2. Click the **Pending** tab. Click a row to expand it. Show **AI Reasoning**,
   the confidence, and any "Review required:" flags.

> "Confidence is the model's number, then adjusted: small amounts and very
> short descriptions are marked down, and the chart check can cap it."

3. Find a `STRIPE TRANSFER` row (search box, press `/`, type `stripe`).
   Expand it, and in **Category** choose `[1100] Accounts Receivable`.

> "This is a real error pattern. The prompt tells the model that deposits are
> revenue, so Stripe payouts go to a revenue account. For a business that
> invoices, the payout clears receivables. I've changed it by hand."

4. A toast asks **Always categorize ... as Accounts Receivable?** Click
   **Save rule**.

> "That saves a rule: a vendor key, the account, and whether money went in or
> out. If other pending rows match, it applies to them now. On the branch,
> rules also run before the AI at the next upload, so those rows never reach
> the model. I measured that only as a projection on saved predictions: rules
> from June's corrections caught 5 of 188 July and August rows, all correct."

Source for the rules figure: `eval/results/learn-plan.md` (projected from
Sonnet 4.6 run 1's saved predictions, not a live run).

If the toast says it matched 0 other rows, say so: the other Stripe rows may
already be approved, or the live build's older vendor key keeps the transfer
ID, which the branch strips.

### 3:30 to 4:15. Approve and export

1. Click **Approve N high-confidence**, then **Approve N** in the dialog.
2. Click **Export**, then **Journal entries CSV**. Open the file.

> "Each approved row becomes one two-sided entry: the approved account and the
> bank account, both from the chart. Direction comes from the money-in or
> money-out field. The Source column says whether a person, a rule or the AI
> chose the account. Everything is in whole cents, and the export refuses to
> produce a file if any entry, or the whole journal, doesn't balance."

### 4:15 to 5:00. Report and close

1. Back on the review page, click **Report**. A new tab opens.
2. Scroll to **Journal entries**. Point at "Balanced", then **Not posted**
   (pending and flagged rows, each with a reason) and **To check** (money in
   to an expense account, or money out to a revenue account).

> "Rows that aren't approved, or that post to an account not in the chart,
> don't become entries. They're listed with the reason."
>
> "To be clear about the limits: every accuracy number I've quoted is from one
> synthetic business, one chart and one checking account, with two runs per
> model. Nothing has been measured on real books. The next step is a real
> labelled set from two or three firms, and re-checking the threshold on it."

## Backup plan

Decide fast. If the live app fails twice, move to the next option instead of
debugging on the call.

### A. Categorise fails or times out on the live app

Click **↺ Try again** once. If it fails again, say: "The live build runs
batches one at a time and has a 120-second limit. The branch runs 4 at a time.
Let me show you that locally." Go to B.

### B. Run the branch locally in demo mode

Demo mode: no Supabase, so no sign-in and nothing reaches the live database.
Data is held in memory and lost on reload. Run this before the call and leave
it running:

```
cd ~/code/closebooks-app-fresh
git checkout overnight
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run dev
```

Empty values in the shell take precedence over `.env.local`, which is how
Next.js loads env files. Open http://localhost:3000/dashboard and follow the
same steps. This uses the real Anthropic key from `.env.local`, so it calls
Claude Sonnet 5.5 and costs about $0.111 per 97 rows
(`eval/results/comparison.md`). On this version the full 292-row file can be
used.

Check `docs/overnight-log.md` for whether a fake-model switch was added
overnight for end-to-end tests. If it was, it can run the flow with no API
call, but its categories are not Claude's and must not be presented as
results.

### C. No network, or nothing runs

Show the screenshots in `docs/screenshots/` (made by the end-to-end test, if
it was completed overnight; check that the folder exists). Say that they were
made with a fake model in demo mode, so the categories on them show the flow,
not accuracy.

### D. Talk through the engine from documents

These carry the call without the app:

- `docs/technical-overview.md`: architecture, prompt, threshold, rules,
  journal entries, weaknesses.
- `eval/results/threshold-sweep.md`: the table behind 0.93.
- `eval/results/comparison.md`: accuracy, calibration and cost per model.
- `eval/results/learn-plan.md`: the rules projection.
- `docs/engine/journal-entries.md`: how entries are built and checked.
- `docs/engine/rls-audit.md`: the security audit and what is still open.

### E. Sign-in fails on the live app

The public page https://closebooks-app.vercel.app/demo needs no account. It
runs the same categorisation code on up to 25 rows with its own 29-account
demo chart (`src/lib/demoData.ts`), which is not the chart I evaluated on.
Use it only to show a categorised table, and say that.
