import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, Input, Modal, Select, useToast } from '@acrev360/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type RevenueCategory = components['schemas']['RevenueCategory'];
type Department = components['schemas']['Department'];

/** POST /api/v1/revenue-items — always creates a council-local item
 * (template stays null server-side); a global RevenueItemTemplate is a
 * separate, unrelated concept this form doesn't touch. Banding, if the item
 * needs it, is added afterward from the item's own detail modal via
 * RateBandsEditor — this form only sets the initial flat rate, matching
 * what the create endpoint itself requires (rate_amount is mandatory even
 * for an item that will immediately get bands layered on top). */
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
  const [rate, setRate] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [byeLawRef, setByeLawRef] = useState('');
  const [byeLawDesc, setByeLawDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!code.trim() || !name.trim() || !categoryId || !unit.trim() || !rate) {
      toast('Code, item name, category, unit of charge and rate are all required', true);
      return;
    }
    setSaving(true);
    try {
      const { error } = await apiClient.POST('/api/v1/revenue-items', {
        body: {
          harmonised_code: code.trim(),
          item_name: name.trim(),
          category_id: categoryId,
          unit_of_charge: unit.trim(),
          rate_amount: rate,
          department_id: departmentId === '' ? undefined : departmentId,
          bye_law_reference: byeLawRef.trim() || undefined,
          bye_law_description: byeLawDesc.trim() || undefined,
        },
      });
      if (error) throw new Error(errorMessage(error));
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
      <div className="row">
        <Field label="Unit of charge">
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Per Annum" />
        </Field>
        <Field label="Rate (₦)">
          <Input type="number" min={0} step={0.01} value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </div>
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
