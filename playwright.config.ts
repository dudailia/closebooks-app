import { defineConfig, devices } from '@playwright/test'

// End-to-end test of the core path, local only.
//
// The app runs in demo mode (no Supabase) with the fake model
// (src/lib/ai/fakeCategorizer.ts), so nothing reaches the live database or
// the Anthropic API. Values set here override .env.local: Next.js does not
// load a variable from an env file when it is already set, even to ''.
// ANTHROPIC_BASE_URL points at a closed local port, so a real API call, if one
// were ever made by mistake, fails on this machine.

const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1360, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } } }],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/dashboard`,
    timeout: 400_000,
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      NEXT_TELEMETRY_DISABLED: '1',
      DEMO_MODE: 'true',
      CLOSEBOOKS_FAKE_MODEL: '1',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_BASE_URL: 'http://127.0.0.1:9',
      STRIPE_SECRET_KEY: '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      RESEND_API_KEY: '',
      INTUIT_CLIENT_ID: '',
      INTUIT_CLIENT_SECRET: '',
      VERCEL_OIDC_TOKEN: '',
      VERCEL: '',
      VERCEL_ENV: '',
    },
  },
})
