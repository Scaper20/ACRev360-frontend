import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, Input, Modal, Notice, Row, Select, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { sha256Hex } from '../../lib/hash';
import { useWards } from '../../lib/wards';

export function PayerFormModal({ payerType, onClose }: { payerType: 'INDIVIDUAL' | 'BUSINESS'; onClose: () => void }) {
  const isIndividual = payerType === 'INDIVIDUAL';
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const { data: wards } = useWards();
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

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idNum, setIdNum] = useState('');
  const [ward, setWard] = useState<number | ''>('');
  const [address, setAddress] = useState('');
  const [businessSize, setBusinessSize] = useState('');
  const [assignedConsultantId, setAssignedConsultantId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ full_name: string; payer_ref: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(force = false) {
    if (!firstName.trim()) {
      setError(isIndividual ? 'Enter the payer’s first name' : "Enter the business name");
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
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        payer_type: payerType,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        ward: ward as number,
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
      toast(`${isIndividual ? 'Individual' : 'Business'} registered — ${data.payer_ref}`);
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
      {isIndividual ? (
        <Row>
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Middle name (optional)">
            <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </Row>
      ) : (
        <Row>
          <Field label="Business name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
        </Row>
      )}
      <Row>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Email (optional — for sending receipts)">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
