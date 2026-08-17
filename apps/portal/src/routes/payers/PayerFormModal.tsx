import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, GroupedChecklist, Input, Modal, Notice, Row, Select, useToast } from '@acrev360/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { sha256Hex } from '../../lib/hash';
import { REVENUE_CATEGORY_ORDER, toGroupedItems, useRevenueItems } from '../../lib/revenueItems';
import { useWards } from '../../lib/wards';

export function PayerFormModal({ payerType, onClose }: { payerType: 'INDIVIDUAL' | 'BUSINESS'; onClose: () => void }) {
  const isIndividual = payerType === 'INDIVIDUAL';
  const { data: wards } = useWards();
  const { data: revenueItems } = useRevenueItems();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNum, setIdNum] = useState('');
  const [ward, setWard] = useState<number | ''>('');
  const [address, setAddress] = useState('');
  const [businessSize, setBusinessSize] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ full_name: string; payer_ref: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const groupedItems = revenueItems ? toGroupedItems(revenueItems) : [];

  async function submit(force = false) {
    if (!fullName.trim()) {
      setError("Enter the payer's name");
      return;
    }
    if (ward === '') {
      setError('Choose a ward');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body: components['schemas']['CreatePayerRequest'] = {
        full_name: fullName.trim(),
        payer_type: payerType,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        ward: ward as number,
        revenue_item_ids: [...selected],
        force,
        ...(idNum.trim() ? (isIndividual ? { nin_bvn_hash: await sha256Hex(idNum.trim()) } : { tin: idNum.trim() }) : {}),
        ...(!isIndividual && businessSize ? { business_size: businessSize as components['schemas']['BusinessSizeEnum'] } : {}),
      };

      const { data, error, response } = await apiClient.POST('/api/v1/payers', { body });
      if (error) {
        if (response.status === 409 && 'duplicate_of' in error) {
          setDuplicate((error as { duplicate_of: { full_name: string; payer_ref: string } }).duplicate_of);
          return;
        }
        throw new Error(errorMessage(error));
      }
      toast(`${isIndividual ? 'Individual' : 'Business'} registered — ${data.payer_ref}${data.draft_assessments_created ? ` (${data.draft_assessments_created} item(s) enumerated)` : ''}`);
      await queryClient.invalidateQueries({ queryKey: ['payers'] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isIndividual ? 'Register Individual' : 'Register Business'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => submit(false)} disabled={submitting}>
            Register
          </button>
        </>
      }
    >
      <Row>
        <Field label={isIndividual ? 'Full name' : 'Business name'}>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={isIndividual ? 'NIN / BVN' : 'TIN'}>
          <Input
            value={idNum}
            onChange={(e) => setIdNum(e.target.value)}
            placeholder={isIndividual ? 'National Identity / Bank Verification Number' : 'Tax Identification Number'}
          />
        </Field>
        {!isIndividual && (
          <Field label="Business size">
            <Select value={businessSize} onChange={(e) => setBusinessSize(e.target.value)}>
              <option value="">— Unclassified —</option>
              <option value="MICRO">Micro</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="LARGE">Large</option>
            </Select>
          </Field>
        )}
      </Row>
      <Row>
        <Field label="Ward">
          <Select value={ward} onChange={(e) => setWard(Number(e.target.value))}>
            <option value="">—</option>
            {wards?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.ward_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Address">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
      </Row>
      <Field label="Revenue items liable (optional — enumerate what applies now)">
        <GroupedChecklist
          items={groupedItems}
          groupOrder={REVENUE_CATEGORY_ORDER}
          selected={selected}
          onToggle={(id) =>
            setSelected((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })
          }
        />
      </Field>
      {error != null && <Notice variant="bad">{error}</Notice>}
      {duplicate != null && (
        <Notice variant="bad">
          A payer with this phone number already exists — {duplicate.full_name} ({duplicate.payer_ref}).
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-brass btn-sm" onClick={() => submit(true)}>
              Register anyway
            </button>
          </div>
        </Notice>
      )}
    </Modal>
  );
}
