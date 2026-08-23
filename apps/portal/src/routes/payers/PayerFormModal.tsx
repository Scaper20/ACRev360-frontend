import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, GroupedChecklist, Input, Modal, Notice, Row, Select, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { sha256Hex } from '../../lib/hash';
import { REVENUE_CATEGORY_ORDER, toGroupedItems, useRevenueItems } from '../../lib/revenueItems';
import { useWards } from '../../lib/wards';

export function PayerFormModal({ payerType, onClose }: { payerType: 'INDIVIDUAL' | 'BUSINESS'; onClose: () => void }) {
  const isIndividual = payerType === 'INDIVIDUAL';
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const { data: wards } = useWards();
  const { data: revenueItems } = useRevenueItems();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Only an admin registering on a consultant's behalf needs this — a
  // consultant/agent registering their own payer is enumerated_by
  // themselves automatically, same as it always was.
  const { data: consultants } = useQuery({
    queryKey: ['consultants'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNum, setIdNum] = useState('');
  const [ward, setWard] = useState<number | ''>('');
  const [address, setAddress] = useState('');
  const [businessSize, setBusinessSize] = useState('');
  const [assignedConsultantId, setAssignedConsultantId] = useState<number | ''>('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ full_name: string; payer_ref: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const flatRateItems = revenueItems?.filter((i) => (i.rate_bands?.length ?? 0) === 0) ?? [];
  const bandedItemCount = (revenueItems?.length ?? 0) - flatRateItems.length;
  const groupedItems = toGroupedItems(flatRateItems);

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
        ...(isAdmin && assignedConsultantId ? { assigned_consultant_id: assignedConsultantId } : {}),
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
      {isAdmin && (
        <Field label="Assign to consultant (optional)">
          <Select value={assignedConsultantId} onChange={(e) => setAssignedConsultantId(Number(e.target.value) || '')}>
            <option value="">— Council direct —</option>
            {/* Same reasoning as AgentsPage's onboard form — a consultant
                defaults to PENDING until activated; the backend only accepts
                an ACTIVE one for this assignment. */}
            {consultants
              ?.filter((c) => c.status === 'ACTIVE')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.consultant_name}
                </option>
              ))}
          </Select>
        </Field>
      )}
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
      {bandedItemCount > 0 && (
        <Notice variant="info">
          {bandedItemCount} item{bandedItemCount === 1 ? '' : 's'} priced by band or tier (e.g. shop size, business turnover) aren&rsquo;t listed above — register the payer first, then add
          {bandedItemCount === 1 ? ' it' : ' those'} from the bill screen, where the correct band can be selected.
        </Notice>
      )}
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
