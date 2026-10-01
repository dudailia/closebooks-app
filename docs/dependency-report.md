# Dependency report

Date: 2026-10-01. Branch: `overnight`. Source: `npm audit` (npm's advisory
database on that date), `npm ls`, and `git grep` over `src/` and `eval/` for
the features each advisory needs.

## Summary

| | Before | After |
|---|---:|---:|
| Packages flagged by `npm audit` | 9 (1 critical, 5 high, 3 moderate) | 8 (1 critical, 4 high, 3 moderate) |

**Applied:** one fix, `npm audit fix` without `--force`. It moved
`brace-expansion` (three copies, all pulled in by ESLint) to 1.1.21, 2.1.7 and
5.0.12, inside the ranges their parents already allow. Only
`package-lock.json` changed. After it: `npm test` 168 passing, `npm run
typecheck` clean, `npm run build` passes, `npm run e2e` passes.

**Not applied:** every other fix needs a major version (`npm audit` marks each
as `isSemVerMajor`). They are listed below as proposals.

"Core path" below means what the demo build runs: the 13 API routes in
`VISIBLE_API_ROUTES` (`src/lib/features.ts`), the dashboard, upload and review
pages, and the Vercel deployment. Tooling means code that only runs on a
developer machine or in the build.

## Each finding

### `next` 14.2.35 (critical; 23 advisories), direct dependency

14.2.35 is the last 14.x release (`npm view next@14 version`), so there is no
patch. Fixes start at 15.5.x; `npm audit` proposes 16.3.8.

| Advisory group | Needs | Used by this app? | Affects the core path? |
|---|---|---|---|
| Image Optimization API: RCE with AVIF (GHSA-2xp9-vwfh-vxw4), DoS (GHSA-h64f-5h5j-jqjh, GHSA-9g9p-9gw9-jx7f), disk cache growth (GHSA-3x4c-7xq6-9pq8) | the `/_next/image` endpoint | No `next/image` import in `src/`, no `images` config. The endpoint exists by default. On Vercel it is served by Vercel's image service, not the app's server; I have not verified whether that service is affected. | Probably not on Vercel. Unverified. |
| React Server Components DoS (GHSA-h25m-26qc-wcjf, GHSA-q4gf-8mx6-v5v3, GHSA-8h8q-6873-q5fj) | App Router | Yes, every page is App Router. | **Yes.** Denial of service, not data access. |
| RSC cache poisoning and cache confusion (GHSA-vfv6-92ff-j949, GHSA-wfc6-r584-vfw7, GHSA-68g3-v927-f742, GHSA-4633-3j49-mh5q) | App Router responses behind a cache | Yes, App Router on Vercel's CDN. | **Possibly.** Depends on what Vercel caches; not tested. |
| Server Actions DoS, SSRF, payload size, endpoint disclosure (GHSA-m99w-x7hq-7vfj, GHSA-89xv-2m56-2m9x, GHSA-4c39-4ccg-62r3, GHSA-955p-x3mx-jcvp) | `'use server'` functions | None in `src/`. SSRF one also needs a custom server (not used). | No. |
| Rewrites: request smuggling, SSRF (GHSA-ggv3-7p47-pfv8, GHSA-p9j2-gv94-2wf4) | `rewrites` in config | None in `next.config.mjs` or `vercel.json`. | No. |
| Middleware/proxy bypass with i18n (GHSA-36qx-fr4f-26g5), redirect cache poisoning (GHSA-3g8h-86w9-wvmq) | Pages Router with i18n; middleware redirects | No Pages Router, no i18n. `src/middleware.ts` does redirect and return 404s. | Bypass: no. Redirect cache poisoning: possibly (low severity). |
| XSS with CSP nonces (GHSA-ffhc-5mcf-pf4q), `beforeInteractive` scripts (GHSA-gx5p-jg67-6x7h) | CSP nonces; `<Script strategy="beforeInteractive">` | Neither found in `src/`. | No. |
| SSRF with WebSocket upgrades (GHSA-c4j6-fc7j-m34r) | WebSocket upgrades | None. | No. |
| RCE on Windows-hosted servers (GHSA-p293-qw3h-jr36) | Windows hosting | Vercel runs Linux. | No. |
| `postcss` 8.4.31 bundled inside `next` (4 advisories, source map file read, `</style>` XSS) | attacker-controlled CSS at build time | Only this repo's own CSS is processed. The top-level `postcss` is 8.5.26, past every fixed version. | No. |

**Proposal (major):** upgrade to Next 15.5.24 or later (or 16.x). It changes
async request APIs (`cookies()`, `headers()`, `params` become promises), React
19, and caching defaults. A branch `chore/next-16-upgrade` exists on the
remote and was not reviewed. Estimated work: a day or two, with the e2e test
as the check. **This is the only finding that touches the core path.**

### `eslint-config-next` 14.2.35, `@next/eslint-plugin-next`, `glob` 10.3.10 (high), dev only

The `glob` advisory (GHSA-5j98-mcp5-4vw2) is command injection through the
`glob` **command-line tool's** `-c/--cmd` flag. This repo uses `glob` only as
a library inside ESLint; nothing runs the `glob` CLI (`package.json` scripts
checked). Not in the deployed app. **Affects the core path: no.**

**Proposal (major):** move to `eslint-config-next` matching the Next version
chosen above (with ESLint 9 flat config). Do it together with the Next upgrade.

### `vitest` 3.2.7 and `@vitest/mocker` (moderate), dev only

GHSA-82fw-gwwq-j7x9: path traversal through a redirected mock in the vitest
mocker. It needs a malicious test or mock file. Tests are run locally and
are not deployed. **Affects the core path: no.**

**Proposal (major):** vitest 4.1.11 or later (5.x is current). 3.2.7 is the
last 3.x. Low urgency.

### `@anthropic-ai/sdk` 0.82.0 (moderate), direct dependency

GHSA-p7fg-763f-g4gf: insecure default file permissions in the SDK's **local
filesystem memory tool** helper. Nothing in `src/` or `eval/` imports a
memory-tool helper; the app calls `messages.create` only. **Affects the core
path: no.**

**Proposal:** upgrade to 0.91.1 or later (0.131.0 is current). Under npm's
rules a 0.x minor bump is a breaking change (`^0.82.0` does not allow
0.91), so I didn't apply it overnight. The categorisation code uses
`messages.create`, reply `content` blocks and `usage`; the upgrade is likely
small, and `src/lib/__tests__/categorize.test.ts` plus `eval/run.ts --fake`
would show breakage.

### `brace-expansion` (high), dev only: fixed

DoS on crafted brace patterns (GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p,
GHSA-q2hr-2g5m-vwhr). Used by ESLint's `minimatch`, on this repo's own file
patterns. **Affects the core path: no.** Fixed by `npm audit fix`.

## Added overnight

Two dev dependencies, neither in the deployed app: `@playwright/test` 1.63
(e2e test) and `@electric-sql/pglite` (migration tests). `npm audit` reports
nothing for either.

## Order I'd do the major upgrades in

1. `@anthropic-ai/sdk` to the current release: smallest, and it is the
   engine's only runtime dependency on the model.
2. Next 15.5.24+ (or 16) with `eslint-config-next`: the only one with
   findings on the core path (RSC DoS, possible cache poisoning).
3. vitest 4 or 5: dev only.
