import type { components } from '@acrev360/api';
import { Field, GroupedSelect, Input, money } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import { REVENUE_CATEGORY_ORDER, toGroupedItems } from '../../lib/revenueItems';

type CouncilRevenueItem = components['schemas']['CouncilRevenueItem'];

export interface LineToAdd {
  revenueItemId: number;
  label: string;
  quantity: number;
  /** unit rate × quantity — for local draft-list display only; the server
   * recomputes and validates the authoritative amount from rateBandId/
   * rateTierId/amountOverride, never trusts this number. */
  amount: number;
  rateBandId?: number;
  rateTierId?: number;
  amountOverride?: string;
}

/** Revenue-item picker used by both New Bill and Bill Detail's "Add line" —
 * item first, then (only if the item has open rate bands) a band picker,
 * then whatever that band needs: nothing more for FLAT, a bounded amount
 * input for RANGE, a tier picker for TIERED. An item with no bands behaves
 * exactly like the old flat-rate-only picker. */
export function RevenueItemLinePicker({ items, onAdd }: { items: CouncilRevenueItem[]; onAdd: (line: LineToAdd) => void }) {
  const groupedItems = toGroupedItems(items);
  const [itemId, setItemId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [bandId, setBandId] = useState<number | ''>('');
  const [tierId, setTierId] = useState<number | ''>('');
  const [rangeAmount, setRangeAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const item = items.find((i) => i.id === itemId);
  const bands = item?.rate_bands ?? [];
  const band = bands.find((b) => b.id === bandId);

  // Auto-select the item's first band the moment one becomes selectable —
  // same fix as GroupedSelect's own auto-select, applied here for the same
  // reason: an unselected band with items already loaded would otherwise
  // leave "Add line" silently unable to submit.
  useEffect(() => {
    setBandId(bands[0]?.id ?? '');
    setTierId('');
    setRangeAmount('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    setTierId(band?.tiers[0]?.id ?? '');
    setRangeAmount('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandId]);

  function reset() {
    setItemId('');
    setQty(1);
    setBandId('');
    setTierId('');
    setRangeAmount('');
    setError(null);
  }

  function handleAdd() {
    if (!item) return;
    setError(null);

    if (bands.length === 0) {
      onAdd({ revenueItemId: item.id, label: item.item_name, quantity: qty, amount: Number(item.current_rate) * qty });
      reset();
      return;
    }

    if (!band) {
      setError('Select a rate band');
      return;
    }

    if (band.rate_mode === 'FLAT') {
      onAdd({
        revenueItemId: item.id,
        label: `${item.item_name} — ${band.label || 'default'}`,
        quantity: qty,
        amount: Number(band.flat_amount) * qty,
        rateBandId: band.id,
      });
      reset();
    } else if (band.rate_mode === 'RANGE') {
      const amount = Number(rangeAmount);
      const min = Number(band.min_amount);
      const max = Number(band.max_amount);
      if (!rangeAmount || amount < min || amount > max) {
        setError(`Enter an amount between ${money(band.min_amount)} and ${money(band.max_amount)}`);
        return;
      }
      onAdd({
        revenueItemId: item.id,
        label: `${item.item_name} — ${band.label || 'default'}`,
        quantity: qty,
        amount: amount * qty,
        rateBandId: band.id,
        amountOverride: rangeAmount,
      });
      reset();
    } else {
      const tier = band.tiers.find((t) => t.id === tierId);
      if (!tier) {
        setError('Select a tier');
        return;
      }
      onAdd({
        revenueItemId: item.id,
        label: `${item.item_name} — ${band.label || 'default'} (${tier.label})`,
        quantity: qty,
        amount: Number(tier.amount) * qty,
        rateBandId: band.id,
        rateTierId: tier.id,
      });
      reset();
    }
  }

  return (
    <div>
      <div className="row">
        <Field label="Revenue item">
          <GroupedSelect items={groupedItems} groupOrder={REVENUE_CATEGORY_ORDER} value={itemId} onChange={setItemId} />
        </Field>
        {bands.length > 0 && (
          <Field label="Band">
            <select value={bandId} onChange={(e) => setBandId(Number(e.target.value))}>
              {bands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label || '(default)'}
                </option>
              ))}
            </select>
          </Field>
        )}
        {band?.rate_mode === 'RANGE' && (
          <Field label={`Amount (${money(band.min_amount)}–${money(band.max_amount)})`}>
            <Input
              type="number"
              min={Number(band.min_amount)}
              max={Number(band.max_amount)}
              value={rangeAmount}
              onChange={(e) => setRangeAmount(e.target.value)}
              style={{ maxWidth: 140 }}
            />
          </Field>
        )}
        {band?.rate_mode === 'TIERED' && (
          <Field label="Tier">
            <select value={tierId} onChange={(e) => setTierId(Number(e.target.value))}>
              {band.tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({money(t.amount)})
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Qty">
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} style={{ maxWidth: 90 }} />
        </Field>
        <button className="btn btn-ghost" onClick={handleAdd} type="button">
          Add line
        </button>
      </div>
      {error != null && (
        <div className="notice notice-bad" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
