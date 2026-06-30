# Skeptical buyer critique — CloseBooks

**Persona:** the owner of a 6-person CPA firm in Boston, evaluating CloseBooks cold for the first time. Burned before by software that overpromised; manages real client financial data under professional liability; values security and reliability over slick design; moderately tech-comfortable, not an engineer.

**Conducted:** 2026-06-30 (filename dated 2026-06-26 per request). **Read-only — no code changed, no fixes applied.**

**Method (stated plainly):**
- The **live marketing site** (`https://closebooks-app.vercel.app`) was directly fetched — homepage, `/pricing`, `/security`, `/demo`, `/signup`, `/privacy`, etc.
- The **gated dashboard, demo internals, autopilot, and settings could not be exercised live** — there is no password for `i.i.duda@icloud.com` and no interactive browser to log in or click through client-side flows. Those surfaces were **ground-truthed against the actual source code** plus `SESSION_LOG.md` / `CLAUDE.md`, which is more reliable for the key task: telling apart "this is genuinely broken / not wired" from "this is seeded demo data that would simply be empty for a real new signup."
- Gathered via a parallel evidence sweep (live site, dashboard code, revenue/infra readiness, security). The dedicated *security* investigator hit a tooling error and returned nothing, but the security substance was fully captured by the live-site and infra ground-truth streams, so Section 5 is intact.

---

I'm writing this as the buyer — my honest assessment after an hour with CloseBooks. No software-vendor charity here.

---

# 1. First 10 seconds — gut reaction to the homepage

I'll give them this: it doesn't look like a hobbyist project. The homepage renders clean and fast — dark, near-black with a sharp neon-green accent, the kind of Linear-meets-Vercel aesthetic that signals "we hired someone who knows what they're doing." The hero line, "Month-end close, on autopilot," is crisp, and the subcopy actually tells me what the thing does instead of drowning me in adjectives: learns how my firm categorizes, runs an AI close workflow, helps my team review exceptions, exports to QuickBooks. That's a real workflow sentence. Good.

But here's where my 30 years of being lied to by software vendors kicks in. Within the first glance I'm scanning for one thing: **who else trusts these people with their clients' books?** And I find nothing. The row right under the hero where every B2B company in existence puts a "trusted by" logo wall — CloseBooks put a scrolling band of *feature names* there. "CSV import," "COA validation," "Confidence scores," "Stripe billing," dressed up as pill chips. At a glance it mimics a customer-logo marquee, and the moment I realize those aren't firms but a list of the product's own features, my read flips from "established" to "dressed to look established." That's a small deception, but it's the exact kind of thing a burned buyer notices and files away.

So: do I trust them with client financial data within the first glance? No. I trust that they can build a nice website. The polish buys them a click, not my QuickBooks credentials. And honestly, a slightly-too-polished site from a company I've never heard of, in a category full of overpromisers, makes me *more* suspicious, not less. Pretty is cheap now.

# 2. The pitch — do I understand it, and where's the fluff?

The core pitch is legible and credible: upload a statement, AI proposes categories with confidence scores, low-confidence items stay in a review queue, a human approves, then export to QuickBooks. That maps exactly to how my staff already work — they just do the categorizing by hand. "CloseBooks learns how your firm categorizes" is the real hook, because the painful part of onboarding any tool is teaching it our chart of accounts and our quirks. If that learning is real, that's a switch-worthy reason. I get it. I can explain it to my partners in one sentence.

Where it falls apart is the **scope creep in the marketing**. The product breadth they advertise is enormous — Autopilot, Advisory memos, **Audit defense ("IRS response packages built in minutes")**, **TaxDraft ("complete tax return preparation from close data")**, client portal, 1099, consolidation — and all of it casually listed as "also included in every plan" on a $49–$349/month product. I carry professional liability. The idea that an AI tool reliably generates an *IRS-defensible audit response* or a *complete tax return* is not a feature I get excited about; it's a feature that makes my malpractice carrier nervous. Real bookkeeping software earns trust by being narrow and reliable. A young product claiming to do close, advisory, audit defense, AND tax prep reads as a roadmap wishlist printed as present-tense capability. That's the fluff, and it's dangerous fluff because it's in domains where being wrong has consequences for *me*, not them.

The ROI math is the other tell: "~83 hours saved per month," "85–95% auto-approval rate," "under 60 seconds for 500 transactions." Stated as fact, zero methodology, no footnote, no "based on." For a category I've been burned in, unsourced performance numbers are noise. I discount them entirely.

To their credit, the *pricing* is the least fluffy thing on the site — real dollar figures, real client/seat limits, "no per-transaction fees," annual discount shown openly. No "contact us for a quote" wall except Enterprise. That's the honesty I want, and it's frustrating that the same company that's transparent about price is so loose about capability.

# 3. The demo — convincing or staged?

This is where they shot themselves in the foot, and it's the single most damaging thing I encountered.

The demo is a genuinely *interactive* four-step sandbox — upload a CSV, watch it "categorize," review and approve, export to QuickBooks — and it actually downloads a real QuickBooks-format CSV file at the end. No signup wall. As a piece of product tour, it's well-built and I respect that you can poke at it.

But it's headlined **"Watch CloseBooks close books — live"** and **"Real AI. Real transactions. No signup required."** And it is not real AI. It replays 20 hardcoded transactions ("Sunrise Advisory LLC") with pre-baked confidence scores. The "Sending to CloseBooks AI engine" progress ring counting to 20 is pure theater — there's no model call. The categorizations come out identical on every run, which is exactly how I'd catch it: run it twice, see the same confidences, and now I *know* I'm watching a scripted animation labeled "Real AI."

Here's why this is worse than just a white lie. The thing I am evaluating is **whether the AI categorization is actually good**. The demo is the one place that's supposed to prove it. Instead they staged the proof and slapped "Real AI" on it. So now the demo proves the opposite of what they intended: it tells me this company will label something "real" when it isn't, in the exact dimension I most need to verify. Everything else on the site — even the genuinely-real engineering — now gets read through that lens. Did I really categorize my data, or am I watching another animation?

The buried, fabricated testimonial inside that same demo seals it: *"We closed 18 clients in the time it used to take us to close 6… paid for itself in the first week." — Sarah K., CPA, 12-person firm.* No firm name, no photo, no LinkedIn, nothing verifiable. One initial and a generic descriptor. That's invented, and on a demo page that already lied about "Real AI," I'm now certain it's invented. For a buyer in my seat, that's not a yellow flag, it's a red one.

# 4. Signing up & exploring the dashboard

Two separate problems here, and I want to be fair about which is which.

First, the **empty dashboard is not a problem**. If I sign up and see no clients, no jobs, clean "No closes yet" empty states — that's correct. The Meridian / Sunrise / Riverdale / Acme data is the founder's own seed data, and I'd expect a fresh account to be blank. I won't penalize that; that's how every SaaS works on day one. Fine.

Second — and this is the real concern — **can I even get into the dashboard?** Signup runs through Supabase and lands me on a "Check your email" confirmation screen. But the email confirmation depends on a separately-configured mail provider that, by the team's own notes, isn't reliably wired. If that confirmation email never sends, I'm a paying-intent customer stuck at the front door on minute one. There's even a forgot-password screen that ships a canned message — *"Our email service is not yet configured… contact us and we'll reset your password immediately."* That's a tell. When your own app has a pre-written apology for email not working, email doesn't work. For a tool managing financial data, an account-recovery path that routes through "email us and we'll do it manually" is not acceptable.

It gets worse under the hood: the firm + trial record only gets created if signup returns an immediate session. If email confirmation is required (the default), that record isn't created at that moment, and the confirmation callback doesn't create it either — so a confirmed user can reportedly land on the dashboard with no trial row and get bounced to the pricing page. That's the difference between "empty by design" and "broken": this is a path where a real new user does everything right and still can't get in.

The other "is this real or a mockup" landmines:
- **"Pull from Bank" is a dead end.** The upload wizard and client pages dangle bank-connect, but the bank integration has no credentials configured — every entry point returns "not configured." The code is apparently real and ready, but as a buyer, a feature I can click that does nothing is worse than a feature you didn't advertise. And there's a *second*, entirely fake bank-connect elsewhere in the app that's just a 1.5-second timer flipping to "connected" with no network call. A simulated "Connected to Chase Bank …4821" with no actual connection is precisely the kind of mockup-masquerading-as-feature that destroys trust.
- The dashboard's **"client portal link"** generator builds a link by slugifying the firm name, but the real portal needs a random token — so the preview link likely lands on an invalid page.
- The **"Autopilot ON" master toggle** only writes a local preference; flipping it doesn't actually run anything autonomously. The name promises autonomy the switch doesn't deliver.

To be fair, the *signed-in core loop is reportedly real* — the actual upload→categorize flow does call a real model, client CRUD persists, the autopilot pipeline computes a real double-entry trial balance. I couldn't verify it live behind the auth gate, but the engineering appears genuine. The problem is everything *around* that real core is salted with placeholders and fakes that I'll hit before I ever get to the good part.

# 5. Trust & security — more or less confident?

This is, surprisingly, the strongest part of the evaluation, and the only section that *raised* my confidence.

The security page is the most honest thing on the site. It says, in plain language, **"CloseBooks is not currently claiming SOC 2, ISO 27001, HIPAA, or similar third-party certification. Formal compliance programs are part of the roadmap."** That is exactly what a burned-before buyer wants to hear — not a fake trust badge, not a vague "bank-level encryption" hand-wave, but a straight admission of where they are. Refreshing. The legal docs back it up: a real privacy policy with a date, a named contact, and actual sub-processors disclosed (the infrastructure, AI, and payment vendors), plus a real terms page and a data-processing addendum. That's diligence-grade material, not lorem ipsum. The AI-processing section even warns me not to upload unauthorized data and explains what gets sent to the model. The "human review before export" posture is genuinely the right control stance for someone in my chair.

So what makes me *less* confident, despite the candor?

The honesty cuts both ways. They've told me, truthfully, that they have **no SOC 2, no ISO, no HIPAA, and — read between the lines — no production firms yet.** I appreciate being told. But what they're honestly telling me is that they are not yet ready for a firm under professional liability to hand over client data. "No certification, it's on the roadmap" is the correct disclosure *and* a correct reason for me to wait. Candor doesn't manufacture a SOC 2 report, and my insurer and my clients don't care how transparent the vendor was about lacking one.

And the candor on the security page sits in jarring contradiction with the *marketing's* overclaiming — "Real AI" on a canned demo, a fabricated testimonial, "IRS audit defense in minutes." A company that's scrupulously honest about compliance but loose about capability is a company whose honesty is selective. That inconsistency actually undermines the security page's credibility for me. Which CloseBooks am I dealing with — the one that wrote the security page, or the one that wrote the demo?

Two more things erode confidence: there's apparently **no automated test suite at all** — the correctness gate is "the build compiled and someone clicked around" — and the production build is configured to *suppress* TypeScript and lint errors, which their own notes blame for letting type-detectable bugs reach production. For most software I'd shrug. For software touching client financial records under my liability, "no tests, errors silenced in the build" is a real reliability tell, not a nitpick.

# 6. The moment of truth — would I start a trial? Give a card?

Would I click "Start free trial"? Maybe — it says no credit card required, and the interactive demo earned a tire-kick. But "start a trial" and "give them a credit card and route a real client's books through them" are very different acts, and I'm nowhere near the second.

Here's the kill shot, and it's the thing they can't paper over with design: **I cannot actually buy this product today.** The payment system is in test mode, the piece that's supposed to grant me access after I pay was never registered, and by the company's own internal notes there have been *zero* confirmed transactions, ever. So even if I were sold — even if I pulled out the firm card and clicked "Subscribe" — the most likely outcome is that I get charged and *don't* get a working paid account, because the post-payment step that's supposed to unlock the dashboard doesn't fire. A buy button that takes money and doesn't deliver access is not a feature, it's a liability. And the cherry on top: the billing page inside the app literally displays a developer to-do note — "Configure Stripe webhooks for checkout.session.completed…" — leaking their own unfinished setup into the customer UI. That tells me everything about how close to ready this is.

So stacking it up: I can't reliably create an account (email confirmation may not send, trial row may not get created), I can't connect a bank, I can't trust the demo I was shown, there's no proof a single other firm uses this, no certifications, and I can't actually complete a purchase. None of that is fatal *individually* for an early-stage product — but together they say "pre-revenue, not production-hardened," and I'm being asked to be their guinea pig with my clients' financial data and my license on the line.

---

## Bottom line

CloseBooks is the rare AI-bookkeeping product where the *engineering under the hood looks genuinely real* — a true Claude-powered categorize-and-review loop, persistence that works, an honest security page that refuses to fake certifications. That's more than most of the vaporware in this space can say, and it's why I'd kick the tires rather than close the tab. But the go-to-market surface is dressed to look more proven and more "plugged in" than it is: a "Real AI" demo that's canned, an invented testimonial, a feature-name wall posing as customer logos, bank-connect that dead-ends, and heavy claims (IRS audit defense, full tax prep) that a liability-conscious CPA reads as red flags, not selling points. It's promising and not fraudulent — but it's pre-revenue and not ready for a firm like mine to entrust with client data.

**The single biggest blocker:** I cannot actually pay and get access. The payment flow is in test mode with the post-purchase access step unregistered and zero confirmed transactions to date — so a willing buyer who clicks Subscribe gets charged with no working account. Until I can hand over a card, complete a purchase, and reliably land in a functioning, access-granted dashboard, there is no paid trial to start — everything else is moot.
