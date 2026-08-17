import { expect, test } from '@playwright/test';

/**
 * Exercises the full write path (register → enumerate → bill → collect)
 * against the real live backend — there is no test/staging environment for
 * this project yet, and no delete/cancel endpoint for payers or bills, so
 * every run of this spec leaves a permanent record on the one live council
 * dataset that exists. This mirrors a manual live-verification pass done
 * from the browser; it's automated here so the same path gets re-checked on
 * demand instead of by hand every time.
 *
 * Each run uses a timestamp-unique name/phone so repeat runs never collide
 * with the app's own duplicate-phone detection (a 409 with a "register
 * anyway" override, tested manually but not exercised here).
 *
 * Before running this in a shared/CI context: get a disposable council to
 * point it at, or accept the live-data growth — see SESSION_HANDOFF.md §8.
 */

const USERNAME = process.env.E2E_USERNAME ?? 'admin';
const PASSWORD = process.env.E2E_PASSWORD ?? 'acrev360admin';

test('register a payer, issue a bill, record a payment, and confirm it reaches PAID', async ({ page }) => {
  const unique = Date.now().toString().slice(-8);
  const payerName = `ZZ-E2E ${unique}`;
  const phone = `070${unique}`;

  await page.goto('/login');
  await page.getByLabel('Username').fill(USERNAME);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await page.getByRole('link', { name: 'Payer Registry' }).click();
  await page.getByRole('button', { name: 'Register Individual' }).click();

  // Button/field names collide across the page ("Register" is a substring
  // of "Register Individual"/"Register Business" too) — scope to the open
  // dialog rather than exact-matching every locator individually.
  const registerDialog = page.getByRole('dialog');
  await registerDialog.getByLabel('Full name').fill(payerName);
  await registerDialog.getByLabel('Phone').fill(phone);
  await registerDialog.getByLabel('Ward').selectOption({ label: 'Kuje' });
  await registerDialog.getByLabel('Address').fill('Playwright E2E — safe to ignore');

  await registerDialog.getByPlaceholder('Filter by name or code…').fill('Community and Development Levy');
  await registerDialog.getByLabel(/Community and Development Levy/).check();
  await registerDialog.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByText(payerName)).toBeVisible();

  await page.getByText(payerName).click();
  const payerDialog = page.getByRole('dialog');
  await expect(payerDialog.getByText('Enumerated Revenue Items')).toBeVisible();
  await payerDialog.getByRole('button', { name: 'Issue Harmonized Bill' }).click();
  await expect(payerDialog.getByText('Enumerated Revenue Items — not yet billed (0)')).toBeVisible();
  await payerDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('link', { name: 'Assessment & e-Billing' }).click();
  await expect(page.getByText(payerName)).toBeVisible();
  // Bill rows are ClickableRow (packages/ui/src/components/Table.tsx), which
  // sets role="button" on the <tr> itself — not the native "row" role.
  await page.getByRole('button', { name: new RegExp(payerName) }).click();

  const billDialog = page.getByRole('dialog');
  await expect(billDialog.getByText('ISSUED', { exact: true })).toBeVisible();
  // The amount field shows the balance as a placeholder only — it's not a
  // real bound value (starts as useState('')), so it must be filled
  // explicitly or "Record Payment" silently no-ops on client-side validation.
  await billDialog.getByLabel('Record payment — Amount').fill('5000');
  await billDialog.getByRole('button', { name: 'Record Payment', exact: true }).click();

  await expect(billDialog.getByText('PAID', { exact: true })).toBeVisible();
  await expect(billDialog.getByText('Balance')).toBeVisible();
  await expect(billDialog.getByText('₦0')).toBeVisible();
  // The Record Payment section only renders for payable statuses (ISSUED/
  // PART_PAID/OVERDUE) — once PAID, it must be gone. This is the same
  // terminal-status gate that keeps a SUPERSEDED/CANCELLED bill from
  // accepting a payment.
  await expect(billDialog.getByRole('button', { name: 'Record Payment', exact: true })).toHaveCount(0);
});
