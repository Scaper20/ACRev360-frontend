import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Notice, money, useToast } from '@acrev360/ui';
import { useState } from 'react';

type RateBand = components['schemas']['RateBand'];
type RateMode = 'FLAT' | 'RANGE' | 'TIERED';

interface DraftTier {
  key: string;
  label: string;
  amount: string;
}

interface DraftBand {
  key: string;
  label: string;
  rateMode: RateMode;
  flatAmount: string;
  minAmount: string;
  maxAmount: string;
  tiers: DraftTier[];
}

let nextKey = 1;
const newKey = () => String(nextKey++);

function fromExisting(bands: RateBand[]): DraftBand[] {
  return bands.map((b) => ({
    key: newKey(),
    label: b.label,
    rateMode: b.rate_mode as RateMode,
    flatAmount: b.flat_amount ?? '',
    minAmount: b.min_amount ?? '',
    maxAmount: b.max_amount ?? '',
    tiers: b.tiers.map((t) => ({ key: newKey(), label: t.label, amount: t.amount })),
  }));
}

function blankBand(): DraftBand {
  return {
    key: newKey(),
    label: '',
    rateMode: 'RANGE',
    flatAmount: '',
    minAmount: '',
    maxAmount: '',
    tiers: [
      { key: newKey(), label: '', amount: '' },
      { key: newKey(), label: '', amount: '' },
    ],
  };
}

/** Admin editor for a revenue item's rate bands — the gazette's sub-classified
 * min/max and small/medium/large structures (see docs/BACKEND_HANDOFF.md-era
 * notes on KAC Gazette.xlsx). An item with zero bands here still prices from
 * the plain flat rate above; saving one or more bands here means the flat
 * rate stops applying and every assessment must pick a band. */
export function RateBandsEditor({
  itemId,
  existingBands,
  onSaved,
}: {
  itemId: number;
  existingBands: RateBand[];
  onSaved: () => void;
}) {
  const toast = useToast();
  const [bands, setBands] = useState<DraftBand[]>(() => fromExisting(existingBands));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateBand(key: string, patch: Partial<DraftBand>) {
    setBands((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  function updateTier(bandKey: string, tierKey: string, patch: Partial<DraftTier>) {
    setBands((prev) =>
      prev.map((b) => (b.key !== bandKey ? b : { ...b, tiers: b.tiers.map((t) => (t.key === tierKey ? { ...t, ...patch } : t)) })),
    );
  }

  function addTier(bandKey: string) {
    setBands((prev) => prev.map((b) => (b.key !== bandKey ? b : { ...b, tiers: [...b.tiers, { key: newKey(), label: '', amount: '' }] })));
  }

  function removeTier(bandKey: string, tierKey: string) {
    setBands((prev) => prev.map((b) => (b.key !== bandKey ? b : { ...b, tiers: b.tiers.filter((t) => t.key !== tierKey) })));
  }

  function removeBand(key: string) {
    setBands((prev) => prev.filter((b) => b.key !== key));
  }

  async function save(bandsToSave: DraftBand[]) {
    setError(null);
    setSaving(true);
    try {
      const { error } = await apiClient.POST('/api/v1/revenue-items/{id}/rate-bands', {
        params: { path: { id: String(itemId) } },
        body: {
          bands: bandsToSave.map((b) => ({
            label: b.label.trim(),
            rate_mode: b.rateMode,
            flat_amount: b.rateMode === 'FLAT' ? b.flatAmount : undefined,
            min_amount: b.rateMode === 'RANGE' ? b.minAmount : undefined,
            max_amount: b.rateMode === 'RANGE' ? b.maxAmount : undefined,
            tiers: b.rateMode === 'TIERED' ? b.tiers.map((t) => ({ label: t.label.trim(), amount: t.amount })) : [],
          })),
        },
      });
      if (error) throw new Error(errorMessage(error));
      toast(bandsToSave.length === 0 ? 'Bands cleared — item reverted to flat rate' : 'Rate bands saved');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save rate bands');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
      <h3 style={{ margin: '0 0 6px' }}>Rate Bands</h3>
      <p style={{ fontSize: 12.5, color: 'var(--ink-60)', marginBottom: 12 }}>
        Sub-classifications with their own min/max or small/medium/large rates, per the gazette. Saving one or more bands here means the
        flat rate above stops applying — every assessment against this item must pick a band instead.
      </p>

      {bands.map((band) => (
        <div key={band.key} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 10 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="field" style={{ flex: 2 }}>
              <label>Label</label>
              <input
                value={band.label}
                placeholder="e.g. Beer Parlor (blank if this is the item's only band)"
                onChange={(e) => updateBand(band.key, { label: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Rate mode</label>
              <select value={band.rateMode} onChange={(e) => updateBand(band.key, { rateMode: e.target.value as RateMode })}>
                <option value="RANGE">Range (min/max)</option>
                <option value="TIERED">Tiered (small/medium/large, etc.)</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>
            <div className="field" style={{ flex: '0 0 auto', alignSelf: 'end' }}>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeBand(band.key)}>
                Remove band
              </button>
            </div>
          </div>

          {band.rateMode === 'FLAT' && (
            <div className="field" style={{ maxWidth: 200 }}>
              <label>Amount (₦)</label>
              <input type="number" min={0} value={band.flatAmount} onChange={(e) => updateBand(band.key, { flatAmount: e.target.value })} />
            </div>
          )}

          {band.rateMode === 'RANGE' && (
            <div className="row">
              <div className="field" style={{ maxWidth: 200 }}>
                <label>Minimum (₦)</label>
                <input type="number" min={0} value={band.minAmount} onChange={(e) => updateBand(band.key, { minAmount: e.target.value })} />
              </div>
              <div className="field" style={{ maxWidth: 200 }}>
                <label>Maximum (₦)</label>
                <input type="number" min={0} value={band.maxAmount} onChange={(e) => updateBand(band.key, { maxAmount: e.target.value })} />
              </div>
            </div>
          )}

          {band.rateMode === 'TIERED' && (
            <div>
              {band.tiers.map((tier) => (
                <div className="row" key={tier.key} style={{ alignItems: 'end', marginBottom: 6 }}>
                  <div className="field" style={{ maxWidth: 200 }}>
                    <label>Tier label</label>
                    <input placeholder="e.g. Small" value={tier.label} onChange={(e) => updateTier(band.key, tier.key, { label: e.target.value })} />
                  </div>
                  <div className="field" style={{ maxWidth: 160 }}>
                    <label>Amount (₦)</label>
                    <input type="number" min={0} value={tier.amount} onChange={(e) => updateTier(band.key, tier.key, { amount: e.target.value })} />
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeTier(band.key, tier.key)}>
                    Remove tier
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addTier(band.key)}>
                Add tier
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="row" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setBands((prev) => [...prev, blankBand()])}>
          Add band
        </button>
        <div className="grow" />
        {existingBands.length > 0 && (
          <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} disabled={saving} onClick={() => save([])}>
            Clear all bands
          </button>
        )}
        <button type="button" className="btn btn-primary" disabled={saving || bands.length === 0} onClick={() => save(bands)}>
          Save Bands
        </button>
      </div>

      {existingBands.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink-60)' }}>
          Currently active: {existingBands.map((b) => b.label || '(unlabeled)').join(', ')} — showing{' '}
          {existingBands
            .map((b) =>
              b.rate_mode === 'FLAT'
                ? money(b.flat_amount ?? '0')
                : b.rate_mode === 'RANGE'
                  ? `${money(b.min_amount ?? '0')}–${money(b.max_amount ?? '0')}`
                  : b.tiers.map((t) => `${t.label} ${money(t.amount)}`).join(' / '),
            )
            .join('; ')}
        </div>
      )}

      {error != null && <Notice variant="bad">{error}</Notice>}
    </div>
  );
}
