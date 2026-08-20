import type { PaymentRecord, WorklistPayer } from '@acrev360/api';
import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Field, money2 } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import type { FieldBill } from '../lib/fieldCache';
import { cachePayerBills, getCachedPayerBills } from '../lib/fieldCache';
import { enqueue } from '../lib/offlineQueue';
import type { ReceiptResult } from './ReceiptView';

type ChannelCode = 'POS' | 'OTC' | 'IB_MB' | 'USSD' | 'FIRSTMONIE';
const PAYABLE_STATUSES = new Set(['ISSUED', 'PART_PAID', 'OVERDUE']);
const CHANNELS: { code: ChannelCode; label: string }[] = [
  { code: 'POS', label: 'POS' },
  { code: 'OTC', label: 'Cash' },
  { code: 'IB_MB', label: 'IB/MB' },
  { code: 'USSD', label: 'USSD' },
  { code: 'FIRSTMONIE', label: 'FirstMonie' },
];

export function CollectView({
  payer,
  isOnline,
  onBack,
  onReceipt,
}: {
  payer: WorklistPayer | null;
  isOnline: boolean;
  onBack: () => void;
  onReceipt: (receipt: ReceiptResult) => void;
}) {
  const [bills, setBills] = useState<FieldBill[]>([]);
  const [billsFromCache, setBillsFromCache] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [billId, setBillId] = useState<number | null>(null);
  const [channel, setChannel] = useState<ChannelCode>('OTC');
  const [amount, setAmount] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!payer) return;
    let cancelled = false;
    setLoadingBills(true);
    setError(null);

    apiClient
      .GET('/api/v1/bills', { params: { query: { payer: payer.id } } })
      .then(({ data, error: apiError }) => {
        if (cancelled) return;
        if (apiError) throw new Error(errorMessage(apiError));
        const payable = data.results.filter((b) => PAYABLE_STATUSES.has(b.status) && Number(b.balance) > 0);
        setBills(payable);
        setBillsFromCache(false);
        setBillId(payable[0]?.id ?? null);
        cachePayerBills(payer.id, payable);
      })
      .catch(() => {
        if (cancelled) return;
        const cached = getCachedPayerBills(payer.id);
        if (cached) {
          setBills(cached.bills);
          setBillsFromCache(true);
          setBillId(cached.bills[0]?.id ?? null);
        } else {
          setBills([]);
          setError('Could not load this payer\'s bills — try again when back online.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBills(false);
      });

    return () => {
      cancelled = true;
    };
  }, [payer]);

  if (!payer) {
    return <p style={{ color: 'var(--ink-40)', fontSize: 13 }}>Pick a payer from the Worklist first.</p>;
  }

  const bill = bills.find((b) => b.id === billId) ?? null;

  async function submit() {
    if (!payer || !bill) return;
    const amountNum = Number(amount);
    if (!amount || amountNum <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }
    if (amountNum > Number(bill.balance)) {
      setError(`Amount exceeds the outstanding balance of ${money2(bill.balance)}`);
      return;
    }
    setError(null);
    setSubmitting(true);

    const payload = {
      bill_id: bill.id,
      amount: amount,
      channel_code: channel,
      bank_txn_ref: bankRef || undefined,
    };

    try {
      if (!isOnline) throw new Error('offline');
      const { data, error: apiError } = await apiClient.POST('/api/v1/payments', { body: payload });
      if (apiError) throw new Error(errorMessage(apiError));
      // The schema documents this 201 as `PostPayment` (the request-echo
      // shape) but PaymentViewSet.create() actually returns a full Payment
      // — see packages/api/src/overrides.ts #1.
      const payment = data as unknown as PaymentRecord;
      onReceipt({
        queued: false,
        amount: payment.amount,
        payerName: payer.full_name,
        channel: CHANNELS.find((c) => c.code === channel)?.label ?? channel,
        receiptRef: payment.receipt_ref ?? undefined,
        qrToken: payment.qr_token ?? undefined,
        time: payment.created_at,
      });
    } catch (err) {
      // Offline, or the live POST itself failed to reach the server (not a
      // rejection from the server — that would have thrown errorMessage()'s
      // readable string above, and a genuinely rejected payment shouldn't be
      // silently queued as if it just needs to retry later). A network-level
      // failure and "offline" get the same treatment: queue it.
      const isRealRejection = err instanceof Error && err.message !== 'offline' && !(err instanceof TypeError);
      if (isRealRejection) {
        setError(err.message);
        setSubmitting(false);
        return;
      }
      enqueue('PAYMENT', payload, `${money2(amount)} — ${payer.full_name}`);
      onReceipt({
        queued: true,
        amount,
        payerName: payer.full_name,
        channel: CHANNELS.find((c) => c.code === channel)?.label ?? channel,
        time: new Date().toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack} type="button" style={{ marginBottom: 10 }}>
        ← Worklist
      </button>

      <div className="field-card">
        <b>{payer.full_name}</b>
        <div style={{ fontSize: 12, color: 'var(--ink-40)', fontFamily: 'var(--font-mono)' }}>{payer.payer_ref}</div>
      </div>

      {billsFromCache && (
        <div className="notice notice-info" style={{ marginBottom: 10, fontSize: 12 }}>
          Showing bills from your last visit — offline.
        </div>
      )}

      {loadingBills ? (
        <p style={{ color: 'var(--ink-40)', fontSize: 13 }}>Loading bills…</p>
      ) : bills.length === 0 ? (
        <p style={{ color: 'var(--ink-40)', fontSize: 13 }}>{error ?? 'No outstanding bills for this payer.'}</p>
      ) : (
        <>
          <Field label="Bill">
            <select value={billId ?? ''} onChange={(e) => setBillId(Number(e.target.value))}>
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bill_ref} — {money2(b.balance)} outstanding
                </option>
              ))}
            </select>
          </Field>

          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-60)', display: 'block', marginBottom: 5 }}>Channel</label>
          <div className="field-channel-grid">
            {CHANNELS.map((c) => (
              <button key={c.code} type="button" className={channel === c.code ? 'active' : undefined} onClick={() => setChannel(c.code)}>
                {c.label}
              </button>
            ))}
          </div>

          <Field label="Amount">
            <input type="number" min={0} max={Number(bill?.balance ?? 0)} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>

          {channel !== 'OTC' && (
            <Field label="Bank/transaction reference (optional)">
              <input value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
            </Field>
          )}

          {error != null && (
            <div className="notice notice-bad" style={{ marginBottom: 10, fontSize: 12 }}>
              {error}
            </div>
          )}

          <Button variant="primary" style={{ width: '100%' }} disabled={submitting || !bill} onClick={submit}>
            {submitting ? 'Recording…' : `Collect ${amount ? money2(amount) : ''}`}
          </Button>
        </>
      )}
    </div>
  );
}
