import { expect, test } from '@playwright/test';

// Safe to run repeatedly: reads/authenticates only, creates no data.
const USERNAME = process.env.E2E_USERNAME ?? 'admin';
const PASSWORD = process.env.E2E_PASSWORD ?? 'acrev360admin';

test('rejects bad credentials with an inline error, no navigation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('definitely-wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('logs in and lands on the dashboard with role-driven nav', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(USERNAME);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('link', { name: 'Payer Registry' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

// Regression test for a real bug found during live testing: the backend
// rotates refresh tokens on every use, and the client used to discard the
// rotated token, so a session survived exactly one silent refresh and then
// died on the next one. Two reloads in a row is the minimum needed to prove
// the fix — the first reload always worked even with the bug.
//
// The pause between reloads is deliberate, not padding: reloading a second
// time within milliseconds of the first (faster than any real user could
// click a browser's refresh button) intermittently loses the just-rotated
// sessionStorage token against the Vite dev server specifically — reproduced
// repeatedly in isolation, but never under realistic timing, and the token
// is provably stable (polled every 50ms) for as long as no second reload
// fires. Root cause wasn't pinned down (every clear()/setTokens() call site
// was instrumented and never fired), so this works around a probable
// dev-server/browser storage-commit-vs-navigation race rather than an
// application bug — see SESSION_HANDOFF.md.
test('session survives multiple reloads, not just one', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(USERNAME);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await page.waitForTimeout(1000);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});
