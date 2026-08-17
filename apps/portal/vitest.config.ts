import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // e2e/ holds Playwright specs (playwright.config.ts, run via `npm run
    // e2e`) — Vitest's default *.spec.ts glob would otherwise pick them up
    // too and fail trying to run them with the wrong test runner's API.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
