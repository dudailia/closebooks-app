# AGENTS.md

Durable architecture and workflow guidance lives in `CLAUDE.md`; the current point-in-time handoff lives in `SESSION_LOG.md`. Read both before starting non-trivial work.

## Cursor Cloud specific instructions

CloseBooks is a single Next.js 14 (App Router) app. There is only one service to run.

- **Runtime:** Node 22 / npm (lockfile is `package-lock.json`). Dependencies are refreshed automatically by the startup update script (`npm install`); no manual install needed.
- **Run (dev):** `npm run dev` → http://localhost:3000. No environment variables are required — with no Supabase config the app boots in **demo mode**: data lives in an in-memory cache, there is no auth, and routes fall through to `/dashboard`. This is enough to exercise core flows (e.g. creating a client) end-to-end.
- **Optional secrets** (set in `.env.local`, all degrade gracefully — see `.env.example` / `README.md` / `CLAUDE.md`): `ANTHROPIC_API_KEY` unlocks AI categorization/features; Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) enables real auth + persistence; Stripe/Resend/Plaid/Intuit vars enable those integrations. Without `ANTHROPIC_API_KEY` any AI-dependent action will fail, but the rest of the UI works.
- **Correctness gate:** `npm run build` (there is no test suite). Note `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`, so `next build` does **not** run `tsc` or ESLint — type/lint errors will not fail the build. Run `npm run lint` separately to see them.
- **`npm run lint` exits non-zero (1)** due to pre-existing unused-var / unescaped-entity errors that predate this setup. Only treat *newly introduced* lint errors as failures.
- The **`⚠ Failed to patch lockfile` / `Cannot read properties of undefined (reading 'os')`** warning printed by `next dev`/`next build` is pre-existing and non-fatal; the server still reports `✓ Ready` and the build still completes (`✓ Compiled successfully`).
