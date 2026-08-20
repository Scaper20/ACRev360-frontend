import type { components } from '@acrev360/api';

export type WorklistPayer = components['schemas']['WorklistPayer'];
export type FieldBill = components['schemas']['Bill'];

const WORKLIST_KEY = 'acrev360_field_worklist_cache';
const BILLS_KEY_PREFIX = 'acrev360_field_bills_cache_';

/** Last-fetched worklist, cached to localStorage so the Worklist view has
 * something to render on a cold start with no network — matching the old
 * prototype's own S.payers caching. Overwritten wholesale on every
 * successful live fetch; never merged, since the server's ordering/balance
 * figures are always the source of truth when reachable. */
export function cacheWorklist(payers: WorklistPayer[]): void {
  localStorage.setItem(WORKLIST_KEY, JSON.stringify({ payers, cached_at: new Date().toISOString() }));
}

export function getCachedWorklist(): { payers: WorklistPayer[]; cached_at: string } | null {
  try {
    const raw = localStorage.getItem(WORKLIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Per-payer bill cache — an agent who looked at a payer's bills earlier
 * while online can still open Collect for them later with zero connectivity
 * for the rest of the visit. Deliberately per-payer (not folded into the
 * worklist cache) since the worklist never carries bill-level detail. */
export function cachePayerBills(payerId: number, bills: FieldBill[]): void {
  localStorage.setItem(`${BILLS_KEY_PREFIX}${payerId}`, JSON.stringify({ bills, cached_at: new Date().toISOString() }));
}

export function getCachedPayerBills(payerId: number): { bills: FieldBill[]; cached_at: string } | null {
  try {
    const raw = localStorage.getItem(`${BILLS_KEY_PREFIX}${payerId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
