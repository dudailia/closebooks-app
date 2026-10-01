import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

// Same environment as playwright.config.ts (demo mode, fake model, no keys),
// but against `next dev`, where React reports render-time warnings.
const PORT = 3101

export default defineConfig({
  ...base,
  testDir: './e2e-dev',
  timeout: 240_000,
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium-dev', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } } }],
  webServer: {
    ...(Array.isArray(base.webServer) ? base.webServer[0] : base.webServer!),
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/dashboard`,
    timeout: 240_000,
  },
})
