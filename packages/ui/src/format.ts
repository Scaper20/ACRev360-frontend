/** DRF returns money as decimal-safe strings (e.g. "25000.00"), never a raw
 * float — parse only for display, never do arithmetic on the parsed value in
 * the frontend; the backend is the source of truth for computed totals. */
export function money(amount: string | number | null | undefined, fractionDigits = 0): string {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

export function money2(amount: string | number | null | undefined): string {
  return money(amount, 2);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}
