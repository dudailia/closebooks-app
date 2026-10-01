# Demo script: 5 minutes on the live app

For a call with a CTO who wants to see the engine, not the UI. Each step says
what to click and what to say. The sentences in quotes are written to be said
out loud.

**This script is for the live app after `eval-harness` and `overnight` are
merged to `main`.** The deployed app then runs Claude Sonnet 5.5
(`CATEGORIZE_MODEL`, `src/lib/ai/models.ts`) with auto-approve at 0.93, sends
4 batches of 20 rows at once, applies saved firm rules before the model, and
links each close to a client by id. Until the merge, the live app is the older
build; use backup plan B.

## Before the call (10 minutes)

1. **Files.** Both are synthetic:
   - `eval/data/synthetic_upload.csv`: 292 rows, June to August 2026, the
     fictional Brightline Studio LLC. On the overnight preview it took about
     40 s to categorise (stopwatch, one run, 2026-10-01; `docs/facts.md`).
   - `e2e/fixtures/us-dates-8.csv`: 8 rows with US dates (MM/DD/YYYY),
     including a Stripe payout. Used for the second close.
2. **Sign in** with a demo account made beforehand. Email confirmation is off
   for the demo (a Supabase dashboard setting). The free tier allows 5 closes
   (`FREE_CLOSES`, `src/lib/freeTrial.ts:8`); this script uses 2.
3. **Use a fresh account**, so no rule from an earlier rehearsal is already
   saved. Rules are per firm; an existing Stripe rule would apply in close 1
   and spoil step 3:30.
4. **Allow pop-ups** for the site. The Report button opens the report in a new
   tab after a network call, and some browsers block that.
5. Open these in other tabs: `docs/technical-overview.md`,
   `eval/results/threshold-sweep.md`, `eval/results/strict-errors.md`,
   `docs/engine/journal-entries.md`.

## The walkthrough

### 0:00 to 0:30. Framing

Click nothing. Dashboard is on screen (close the welcome dialog if it shows).

> "This is CloseBooks. It takes a bank statement, suggests an account from the
> client's chart for every line, a person reviews it, and it produces balanced
> journal entries and a close report."
>
> "Up front: there are no customers and no real client data. The file I'm
> uploading is synthetic, a fictional design studio called Brightline Studio,
> and every accuracy number I quote was measured on that kind of data."

### 0:30 to 1:00. Client and chart

1. Sidebar: **New Close**. Step **Client** ("Who is this close for?"): click
   **+ Create new client**, type `Brightline Studio LLC`, click **Create
   client**, then **Continue with Brightline Studio LLC →**.

> "The close is linked to this client's id, so two clients with the same name
> stay separate. Next time I'd pick it from this list."

2. Step **Accounts**: **Standard Small Business** is selected ("34 accounts ·
   all types"). Click **Use these 34 accounts →**.

> "The model can only pick from this chart. The whole chart goes into every
> prompt. If the model names an account that isn't in the chart, the row is
> flagged and its confidence is capped at 0.55. This 34-account chart is the
> one I evaluated on."

### 1:00 to 2:00. Upload and categorise

1. Step **Statement**: drop `synthetic_upload.csv`. The preview shows the
   parsed rows. Click **Continue with 292 transactions →**.
2. Step **Categorize**: 292 transactions, 34 accounts, 15 AI batches. Click
   **✦ Categorize with AI**.

While it runs (about 40 s on the preview, one timed run):

> "Firm rules run first. Any row that matches a saved rule takes the rule's
> account and never goes to the model. The rest go to Claude Sonnet 5.5 in
> batches of 20, four batches at a time. Each request has the system prompt,
> the chart, up to 10 of the firm's recent corrections as hints, and the rows.
> The client's name isn't sent. The bank text is kept to one line, escaped,
> and labelled as data, not instructions."
>
> "If a reply can't be read, the batch is retried once. If it still fails,
> those 20 rows are flagged for a person and the rest carries on."

If it fails: the button changes to **↺ Try again**. Click it once. If it fails
again, go to the backup plan.

### 2:00 to 2:45. Review

1. Point at the counts. On the preview run: 128 of 292 auto-approved (43.8%),
   164 pending, 0 flagged (`docs/facts.md`).

> "A row is approved without a person only if its confidence is 0.93 or
> higher and the chart check raised no flag. I chose 0.93 from a sweep on my
> synthetic set: there, 1 of 274 auto-approved rows was a real mistake. Counted
> strictly it's 20 of 274, but 19 of those are client payments booked to
> revenue instead of receivables, which some firms accept. The price is review
> load: about half of every statement goes to a person."

Sources: `docs/facts.md` ("Threshold sweep", "What the strict errors are").
The 0.93 choice was made and measured on the same synthetic rows; no
held-out set.

2. Click the **Pending** tab and expand a row. Show **AI Reasoning**, the
   confidence and any "Review required:" flags.

### 2:45 to 3:30. Correct a row and save the rule

1. Search (press `/`) for `stripe transfer st`. Expand a `STRIPE TRANSFER
   ST-...` row (not the `STRIPE DES:TRANSFER` format: that is a different
   vendor key, and the second close's file uses `STRIPE TRANSFER ST-`) and, in
   **Category**, choose `[1100] Accounts Receivable`.

> "This is a real error pattern. The prompt says deposits are revenue, so
> Stripe payouts go to a revenue account. For a business that invoices, the
> payout clears receivables. I've changed it by hand."

2. The prompt **Always categorize stripe transfer st as Accounts
   Receivable?** appears at the bottom of the screen, with how many other
   pending rows it will fix. It appears whenever you change a row's account,
   before or after approving it. Click **Save rule**.

> "That saves a rule: a vendor key with dates and IDs stripped, the account,
> and money in or out. It applies now to the matching pending rows, approved
> and credited to the rule, and at the next upload those rows skip the model."

### 3:30 to 4:15. Second close: the rule at upload

1. **New Close**, pick **Brightline Studio LLC** from the list, same chart,
   drop `us-dates-8.csv`, **Categorize with AI** (a few seconds).
2. The Stripe row already shows Accounts Receivable, status **Approved**.

> "That row matched the saved rule before the model ran: it's approved, and
> the journal will say the account came from a rule. The other seven rows went
> to the model."

### 4:15 to 5:00. Journal entries and report

1. Approve what you've checked: tick the rows, then **Approve** in the bar.
   Rows the AI or the rule already approved keep that label.
2. **Export** → **Journal entries CSV**. Open it: the Stripe line is on 1100
   with Source `rule`.

> "Each approved row is one two-sided entry, the approved account against the
> bank account, both from the chart. Everything is in whole cents, and the
> export refuses to produce a file if any entry or the whole journal doesn't
> balance. Pending rows aren't posted; they're listed with the reason."

3. **Report** opens in a new tab. Point at the approval breakdown (AI, rule,
   reviewer) and "Balanced".

> "The limits: every accuracy number I've quoted is from one synthetic
> business, one chart, one checking account, two runs per model. Nothing has
> been measured on real books. The next step is a real labelled set from two
> or three firms, and re-checking the threshold on it."

## Backup plan

Decide fast. If the live app fails twice, move to the next option instead of
debugging on the call.

### A. Categorise fails or times out on the live app

Click **↺ Try again** once. If it fails again, say: "Let me show you the same
build locally." Go to B.

### B. Run the branch locally in demo mode

Demo mode: no Supabase, so no sign-in and nothing reaches the live database.
Data is held in memory and lost on reload. Run this before the call and leave
it running:

```
cd ~/code/closebooks-app-fresh
git checkout main   # or overnight, before the merge
DEMO_MODE=true NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run dev
```

Empty values in the shell take precedence over `.env.local`, which is how
Next.js loads env files. `DEMO_MODE=true` is needed: without Supabase,
`/api/categorize` otherwise answers 503 (`src/lib/routeSubscription.ts`). Open http://localhost:3000/dashboard and follow the
same steps. This uses the real Anthropic key from `.env.local`, so it calls
Claude Sonnet 5.5 and costs about $0.111 per 97 rows
(`eval/results/comparison.md`), so about $0.33 for the 292-row file.

To run the same flow with no API call at all, add `CLOSEBOOKS_FAKE_MODEL=1
ANTHROPIC_API_KEY=` to that command (`src/lib/ai/fakeCategorizer.ts`, added
overnight for the end-to-end test). Its categories come from keyword rules,
not Claude, and must not be presented as results.

### C. No network, or nothing runs

Show the screenshots in `docs/screenshots/` (made by `npm run e2e`;
`docs/screenshots/README.md` lists them). Say that they were made with a fake
model in demo mode, so the categories on them show the flow, not accuracy.

### D. Talk through the engine from documents

These carry the call without the app:

- `docs/technical-overview.md`: architecture, prompt, threshold, rules,
  journal entries, weaknesses.
- `eval/results/threshold-sweep.md`: the table behind 0.93.
- `eval/results/strict-errors.md`: what the strict errors at 0.93 are.
- `eval/results/comparison.md`: accuracy, calibration and cost per model.
- `eval/results/learn-plan.md`: the rules projection.
- `docs/engine/journal-entries.md`: how entries are built and checked.
- `docs/engine/rls-audit.md`: the security audit and what is still open.

### E. Sign-in fails on the live app

The public page https://closebooks-app.vercel.app/demo needs no account. It
runs the same categorisation code on up to 25 rows with its own 29-account
demo chart (`src/lib/demoData.ts`), which is not the chart I evaluated on.
Use it only to show a categorised table, and say that.
