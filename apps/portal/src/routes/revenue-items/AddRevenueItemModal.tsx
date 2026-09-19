import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, Input, Modal, Select, useToast } from '@acrev360/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type RevenueCategory = components['schemas']['RevenueCategory'];
type Department = components['schemas']['Department'];
type PricingType = 'FLAT' | 'BANDED';
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

/** POST /api/v1/revenue-items — always creates a council-local item
 * (template stays null server-side); a global RevenueItemTemplate is a
 * separate, unrelated concept this form doesn't touch. The create endpoint
 * itself always requires a flat rate_amount (even for a banded item — see
 * RateBandsEditor's own note on this), so a banded item is created in two
 * calls: POST /revenue-items with a nominal flat rate, then immediately
 * POST /revenue-items/{id}/rate-bands with the drafted bands — the same
 * band shape/validation RateBandsEditor uses for editing an existing item. */
export function AddRevenueItemModal({
  categories,
  departments,
  onClose,
}: {
  categories: RevenueCategory[] | undefined;
  departments: Department[] | undefined;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('FLAT');
  const [rate, setRate] = useState('');
  const [bands, setBands] = useState<DraftBand[]>([blankBand()]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [byeLawRef, setByeLawRef] = useState('');
  const [byeLawDesc, setByeLawDesc] = useState('');
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

  async function save() {
    if (!code.trim() || !name.trim() || !categoryId || !unit.trim()) {
      toast('Code, item name, category and unit of charge are all required', true);
      return;
    }
    if (pricingType === 'FLAT' && !rate) {
      toast('Enter a rate', true);
      return;
    }
    if (pricingType === 'BANDED' && bands.length === 0) {
      toast('Add at least one band, or switch pricing to Flat', true);
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await apiClient.POST('/api/v1/revenue-items', {
        body: {
          harmonised_code: code.trim(),
          item_name: name.trim(),
          category_id: categoryId,
          unit_of_charge: unit.trim(),
          // The create endpoint always requires a flat rate_amount, even for
          // an item that's about to get bands layered on — a banded item's
          // flat rate stops applying the moment the rate-bands call below
          // succeeds, so 0 here is just a placeholder, never actually billed.
          rate_amount: pricingType === 'FLAT' ? rate : '0',
          department_id: departmentId === '' ? undefined : departmentId,
          bye_law_reference: byeLawRef.trim() || undefined,
          bye_law_description: byeLawDesc.trim() || undefined,
        },
      });
      if (error) throw new Error(errorMessage(error));

      if (pricingType === 'BANDED') {
        const { error: bandsError } = await apiClient.POST('/api/v1/revenue-items/{id}/rate-bands', {
          params: { path: { id: String(data.id) } },
          body: {
            bands: bands.map((b) => ({
              label: b.label.trim(),
              rate_mode: b.rateMode,
              flat_amount: b.rateMode === 'FLAT' ? b.flatAmount : undefined,
              min_amount: b.rateMode === 'RANGE' ? b.minAmount : undefined,
              max_amount: b.rateMode === 'RANGE' ? b.maxAmount : undefined,
              tiers: b.rateMode === 'TIERED' ? b.tiers.map((t) => ({ label: t.label.trim(), amount: t.amount })) : [],
            })),
          },
        });
        if (bandsError) throw new Error(`Item created, but bands could not be saved: ${errorMessage(bandsError)}`);
      }

      toast(`${name.trim()} added`);
      await queryClient.invalidateQueries({ queryKey: ['revenue-items'] });
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add revenue item', true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Revenue Item"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Adding…' : 'Add Item'}
          </button>
        </>
      }
    >
      <div className="row">
        <Field label="Harmonised code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 30010077" />
        </Field>
        <Field label="Category">
          <Select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || '')}>
            <option value="">— Select —</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Item name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Unit of charge">
        <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Per Annum" />
      </Field>

      <Field label="Pricing">
        <Select value={pricingType} onChange={(e) => setPricingType(e.target.value as PricingType)}>
          <option value="FLAT">Flat rate</option>
          <option value="BANDED">Banded (min/max or small/medium/large)</option>
        </Select>
      </Field>

      {pricingType === 'FLAT' ? (
        <Field label="Rate (₦)">
          <Input type="number" min={0} step={0.01} value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      ) : (
        <div style={{ marginBottom: 14 }}>
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
                {bands.length > 1 && (
                  <div className="field" style={{ flex: '0 0 auto', alignSelf: 'end' }}>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeBand(band.key)}>
                      Remove band
                    </button>
                  </div>
                )}
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
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBands((prev) => [...prev, blankBand()])}>
            Add band
          </button>
        </div>
      )}

      <Field label="Department (optional)">
        <Select value={departmentId} onChange={(e) => setDepartmentId(Number(e.target.value) || '')}>
          <option value="">— None —</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.department_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bye-law reference (optional)">
        <Input value={byeLawRef} onChange={(e) => setByeLawRef(e.target.value)} placeholder="e.g. Part IX, S2(ii)" />
      </Field>
      <Field label="Bye-law description (optional)">
        <Input value={byeLawDesc} onChange={(e) => setByeLawDesc(e.target.value)} />
      </Field>
    </Modal>
  );
}
