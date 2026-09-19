import { Button, Field, Notice } from '@acrev360/ui';
import { apiClient, errorMessage } from '@acrev360/api';
import { useState } from 'react';
import { enqueue } from '../lib/offlineQueue';
import type { ReceiptResult } from './ReceiptView';

type PayerType = 'INDIVIDUAL' | 'BUSINESS';
type BusinessSize = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
const BUSINESS_SIZES: BusinessSize[] = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'];

export function RegisterView({
  wardId,
  isOnline,
  onReceipt,
}: {
  wardId: number | null;
  isOnline: boolean;
  onReceipt: (receipt: ReceiptResult) => void;
}) {
  const [payerType, setPayerType] = useState<PayerType>('BUSINESS');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [businessSize, setBusinessSize] = useState<BusinessSize>('MICRO');
  const [lineOfBusiness, setLineOfBusiness] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function captureGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsError('Could not get a GPS fix — try again outdoors'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function reset() {
    setFirstName('');
    setLastName('');
    setPhone('');
    setAddress('');
    setIdNumber('');
    setLineOfBusiness('');
    setGps(null);
  }

  async function submit() {
    if (!wardId) {
      setError('No ward assigned to your account — contact your consultant.');
      return;
    }
    if (!firstName.trim()) {
      setError(payerType === 'INDIVIDUAL' ? 'Enter a first name' : 'Enter a business name');
      return;
    }
    setError(null);
    setSubmitting(true);

    const payerFields = {
      payer_type: payerType,
      first_name: firstName.trim(),
      ...(payerType === 'INDIVIDUAL' && lastName.trim() ? { last_name: lastName.trim() } : {}),
      phone,
      address,
      ward: wardId,
      force: false,
      ...(payerType === 'INDIVIDUAL'
        ? { nin_bvn_hash: idNumber }
        : { tin: idNumber, business_size: businessSize, ...(lineOfBusiness.trim() ? { line_of_business: lineOfBusiness.trim() } : {}) }),
    };
    // geo isn't a CreatePayerSerializer field — Payer itself carries no geo
    // columns, EnumeratedAsset does. The online path below posts it as a
    // separate follow-up call; the offline path bundles it into this same
    // queued record instead (the queue only carries one payload per record),
    // and fieldops.services._replay_payer splits it back out server-side.
    const payload: Record<string, unknown> = { ...payerFields, ...(gps ? { geo: gps } : {}) };

    try {
      if (!isOnline) throw new Error('offline');
      const { data, error: apiError } = await apiClient.POST('/api/v1/payers', { body: payerFields });
      if (apiError) throw new Error(errorMessage(apiError));
      // The payer is already created at this point — a failure here is
      // secondary and must not be treated as the whole registration having
      // failed (that would wrongly queue a duplicate-creation retry). Audit
      // finding: this call's result used to go unchecked entirely, so a
      // failed GPS attachment looked identical to a successful one.
      let warning: string | undefined;
      if (gps) {
        const assetResult = await apiClient.POST('/api/v1/assets', {
          body: { payer: data.id, asset_type: 'PREMISES', ward: wardId, geo_lat: String(gps.lat), geo_lng: String(gps.lng) },
        });
        if (assetResult.error) warning = 'Payer registered, but the GPS location could not be saved — you can skip GPS or try again later.';
      }
      reset();
      onReceipt({
        queued: false,
        amount: '0',
        payerName: data.full_name,
        channel: 'Registration',
        receiptRef: data.payer_ref,
        time: data.created_at,
        warning,
      });
    } catch (err) {
      const isRealRejection = err instanceof Error && err.message !== 'offline' && !(err instanceof TypeError);
      if (isRealRejection) {
        setError(err.message);
        setSubmitting(false);
        return;
      }
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      enqueue('PAYER', payload, `New payer — ${displayName}`);
      reset();
      onReceipt({ queued: true, amount: '0', payerName: displayName, channel: 'Registration', time: new Date().toISOString() });
    } finally {
      setSubmitting(false);
    }
  }

  if (!wardId) {
    return <Notice variant="bad">No ward is assigned to your account yet — contact your consultant before registering payers.</Notice>;
  }

  return (
    <div>
      <div className="field-type-toggle">
        <button type="button" className={payerType === 'INDIVIDUAL' ? 'active' : undefined} onClick={() => setPayerType('INDIVIDUAL')}>
          Individual
        </button>
        <button type="button" className={payerType === 'BUSINESS' ? 'active' : undefined} onClick={() => setPayerType('BUSINESS')}>
          Business
        </button>
      </div>

      <Field label={payerType === 'INDIVIDUAL' ? 'First name' : 'Business name'}>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </Field>

      {payerType === 'INDIVIDUAL' && (
        <Field label="Last name (optional)">
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      )}

      <Field label={payerType === 'INDIVIDUAL' ? 'NIN/BVN' : 'TIN'}>
        <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
      </Field>

      {payerType === 'BUSINESS' && (
        <Field label="Business size">
          <select value={businessSize} onChange={(e) => setBusinessSize(e.target.value as BusinessSize)}>
            {BUSINESS_SIZES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
      )}

      {payerType === 'BUSINESS' && (
        <Field label="Business type (optional)">
          <input value={lineOfBusiness} onChange={(e) => setLineOfBusiness(e.target.value)} placeholder="e.g. Provision store" />
        </Field>
      )}

      <Field label="Phone">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
      </Field>

      <Field label="Address">
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>

      <div style={{ marginBottom: 14 }}>
        <button type="button" className="btn btn-ghost" onClick={captureGps}>
          {gps ? `GPS captured (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : 'Capture GPS location'}
        </button>
        {gpsError != null && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 4 }}>{gpsError}</div>}
      </div>

      {error != null && (
        <div className="notice notice-bad" style={{ margin: '12px 0', fontSize: 12 }}>
          {error}
        </div>
      )}

      <Button variant="primary" style={{ width: '100%', marginTop: 14 }} disabled={submitting} onClick={submit}>
        {submitting ? 'Registering…' : 'Register payer'}
      </Button>
    </div>
  );
}
