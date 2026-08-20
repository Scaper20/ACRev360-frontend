import type { GroupableRevenueItem } from '@acrev360/api';
import { apiClient, errorMessage, REVENUE_CATEGORY_ORDER, toGroupedItems } from '@acrev360/api';
import type { GroupedItem } from '@acrev360/ui';
import { Button, Field, GroupedChecklist, Notice } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import { enqueue } from '../lib/offlineQueue';
import type { ReceiptResult } from './ReceiptView';

type PayerType = 'INDIVIDUAL' | 'BUSINESS';
type BusinessSize = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
const BUSINESS_SIZES: BusinessSize[] = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'];

interface FlatItem extends GroupedItem {
  itemName: string;
}

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
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [businessSize, setBusinessSize] = useState<BusinessSize>('MICRO');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [items, setItems] = useState<GroupableRevenueItem[]>([]);
  const [itemsUnavailable, setItemsUnavailable] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .GET('/api/v1/revenue-items', { params: { query: {} } })
      .then(({ data, error: apiError }) => {
        if (apiError) {
          setItemsUnavailable(true);
          return;
        }
        setItems(data.results.filter((i) => i.is_active));
      })
      .catch(() => {
        // No cache fallback here deliberately — the checklist is only
        // meaningful while online enough to have fetched it at least once
        // this session; registering with zero items liable is still valid
        // (a payer can be enumerated before any specific charge is known).
        // Audit finding: this used to fail silently, leaving an empty
        // checklist with no explanation — now flagged so the agent knows
        // *why* it's empty instead of assuming the payer just owes nothing.
        setItemsUnavailable(true);
      });
  }, []);

  const grouped = toGroupedItems(items);
  const flatOnly = grouped.filter((i) => !i.isBanded);
  const bandedCount = grouped.length - flatOnly.length;
  const pickerItems: FlatItem[] = flatOnly.map((i) => ({
    id: i.id,
    groupLabel: i.groupLabel,
    searchText: i.searchText,
    itemName: i.itemName,
    render: <>{i.searchText}</>,
  }));

  function toggleItem(id: number) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
    setFullName('');
    setPhone('');
    setAddress('');
    setIdNumber('');
    setGps(null);
    setSelectedItemIds(new Set());
  }

  async function submit() {
    if (!wardId) {
      setError('No ward assigned to your account — contact your consultant.');
      return;
    }
    if (!fullName.trim()) {
      setError('Enter a name');
      return;
    }
    setError(null);
    setSubmitting(true);

    const payerFields = {
      payer_type: payerType,
      full_name: fullName.trim(),
      phone,
      address,
      ward: wardId,
      revenue_item_ids: [...selectedItemIds],
      force: false,
      ...(payerType === 'INDIVIDUAL' ? { nin_bvn_hash: idNumber } : { tin: idNumber, business_size: businessSize }),
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
      enqueue('PAYER', payload, `New payer — ${fullName.trim()}`);
      reset();
      onReceipt({ queued: true, amount: '0', payerName: fullName.trim(), channel: 'Registration', time: new Date().toISOString() });
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

      <Field label="Full name">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>

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

      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-60)', display: 'block', marginBottom: 5 }}>
        Revenue items liable {bandedCount > 0 && <span style={{ fontWeight: 400 }}>({bandedCount} banded item{bandedCount === 1 ? '' : 's'} not shown — add via a bill instead)</span>}
      </label>
      {itemsUnavailable ? (
        <Notice variant="info">Revenue items couldn't be loaded — you're likely offline. You can still register this payer; add what they're liable for once back online.</Notice>
      ) : (
        <GroupedChecklist items={pickerItems} groupOrder={REVENUE_CATEGORY_ORDER} selected={selectedItemIds} onToggle={toggleItem} />
      )}

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
