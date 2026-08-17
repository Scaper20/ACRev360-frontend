import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // the revenue-cycle spec creates real live data in sequence; parallel runs would race on shared state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  // These specs hit the real live backend (https://acrev360-backend.onrender.com)
  // through the dev-server's CORS proxy, not a mock — see vite.config.ts and
  // docs/SESSION_HANDOFF.md. The backend is Render free-tier and cold-starts
  // (~40s) after idling; a first-ever page load in a fresh browser context
  // also has to fetch every route module individually from Vite's dev server
  // (no bundling in dev). Measured over 2 minutes for a genuinely cold run —
  // timeouts here are generous on purpose, that's expected latency, not
  // something to chase as a bug.
  timeout: 150_000,
  expect: { timeout: 120_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
