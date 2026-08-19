import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { DocViewer, Field, Input, KV, Modal, Notice, money, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRevenueItems } from '../../lib/revenueItems';
import type { LineToAdd } from './RevenueItemLinePicker';
import { RevenueItemLinePicker } from './RevenueItemLinePicker';

const PAYABLE_STATUSES = new Set(['ISSUED', 'PART_PAID', 'OVERDUE']);
const TAG_FOR: Record<string, string> = { PAID: 'ok', OVERDUE: 'bad', PART_PAID: 'warn', CANCELLED: 'neutral', SUPERSEDED: 'neutral' };

export function BillDetailModal({ billId, onClose }: { billId: number; onClose: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: revenueItems } = useRevenueItems();

  const detailQuery = useQuery({
    queryKey: ['bills', 'detail', billId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bills/{id}/detail', { params: { path: { id: String(billId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const [payAmount, setPayAmount] = useState('');
  const [channel, setChannel] = useState('POS');
  const [bankRef, setBankRef] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<'notice' | 'bill' | null>(null);

  const bill = detailQuery.data;

  function refresh() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bills', 'detail', billId] }),
      queryClient.invalidateQueries({ queryKey: ['bills'] }),
    ]);
  }

  async function addLine(line: LineToAdd) {
    try {
      const { error } = await apiClient.POST('/api/v1/bills/{id}/lines', {
        params: { path: { id: String(billId) } },
        body: {
          revenue_item_id: line.revenueItemId,
          quantity: String(line.quantity),
          rate_band_id: line.rateBandId,
          rate_tier_id: line.rateTierId,
          amount_override: line.amountOverride,
        },
      });
      if (error) throw new Error(errorMessage(error));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add line');
    }
  }

  async function removeLine(lineId: number) {
    try {
      const { error } = await apiClient.DELETE('/api/v1/bills/{id}/lines/{line_id}', { params: { path: { id: String(billId), line_id: lineId } } });
      if (error) throw new Error(errorMessage(error));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove line');
    }
  }

  async function deleteBill() {
    if (bill == null) return;
    if (!window.confirm(`Delete bill ${bill.bill_ref}? This can't be undone.`)) return;
    try {
      const { error, response } = await apiClient.DELETE('/api/v1/bills/{id}', { params: { path: { id: String(billId) } } });
      if (error) {
        if (response.status === 409 && 'error' in error) throw new Error((error as { error: string }).error);
        throw new Error(errorMessage(error));
      }
      toast(`${bill.bill_ref} deleted`);
      // Close before invalidating — otherwise this modal's own now-404ing
      // detail query is still "active" and gets swept into the
      // invalidation's refetch, which then sits out its retry/backoff
      // before onClose() ever runs.
      onClose();
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete bill');
    }
  }

  async function recordPayment() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setError(null);
    try {
      const { data, error } = await apiClient.POST('/api/v1/payments', {
        body: { bill_id: billId, amount: String(amount), channel_code: channel as components['schemas']['ChannelCodeEnum'], bank_txn_ref: bankRef || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`Payment recorded — ${money(data.amount)}`);
      setPayAmount('');
      setBankRef('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record payment');
    }
  }

  const canPay = bill != null && PAYABLE_STATUSES.has(bill.status) && (isAdmin || user?.access_level === 'CONSULTANT');

  return (
    <>
    <Modal
      open
      onClose={onClose}
      title={bill ? `Bill — ${bill.bill_ref}` : 'Bill'}
      footer={
        <>
          {bill != null && (
            <>
              <button className="btn btn-ghost" onClick={() => setPrintDoc('notice')}>
                Print Notice
              </button>
              <button className="btn btn-ghost" onClick={() => setPrintDoc('bill')}>
                Print Bill
              </button>
              {isAdmin && (
                <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={deleteBill}>
                  Delete
                </button>
              )}
            </>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {detailQuery.isLoading || !bill ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <KV label="Payer">
            {bill.full_name} ({bill.payer_ref})
          </KV>
          <KV label="Status">
            <span className={`tag tag-${TAG_FOR[bill.status] ?? 'brass'}`}>{bill.status.replace('_', ' ')}</span>
          </KV>
          <KV label="Paid so far">
            <span className="num">{money(bill.amount_paid)}</span>
          </KV>

          <h3 style={{ margin: '16px 0 8px' }}>Line Items</h3>
          {bill.lines.map((l) => {
            const bandNote = l.band_label != null ? ` (${l.band_label}${l.tier_label != null ? ` — ${l.tier_label}` : ''})` : '';
            return isAdmin ? (
              <div className="row" key={l.id} style={{ alignItems: 'center', marginBottom: 8 }}>
                <div style={{ flex: 2, minWidth: 180 }}>
                  {l.harmonised_code} — {l.item_name}
                  {bandNote}
                </div>
                <div style={{ maxWidth: 130 }} className="num">
                  {money(l.line_amount)}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeLine(l.id)}>
                  Remove
                </button>
              </div>
            ) : (
              <KV key={l.id} label={`${l.harmonised_code} — ${l.item_name}${bandNote}`}>
                <span className="num">{money(l.line_amount)}</span>
              </KV>
            );
          })}
          {Number(bill.arrears_amount) > 0 && (
            <KV label="Arrears — brought forward from prior bills">
              <span className="num">{money(bill.arrears_amount)}</span>
            </KV>
          )}
          <KV label={<b>Total</b>}>
            <span className="num">{money(bill.total_amount)}</span>
          </KV>
          <KV label={<b>Balance</b>}>
            <span className="num">{money(bill.balance)}</span>
          </KV>

          {canPay && (
            <div className="row" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14, alignItems: 'end' }}>
              <Field label="Record payment — Amount">
                <Input type="number" min={0.01} step={0.01} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ maxWidth: 130 }} placeholder={bill.balance} />
              </Field>
              <Field label="Channel">
                <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ maxWidth: 160 }}>
                  <option value="POS">POS</option>
                  <option value="OTC">Branch Teller</option>
                  <option value="IB_MB">Bank Transfer</option>
                  <option value="USSD">USSD</option>
                  <option value="FIRSTMONIE">Agent Banking</option>
                </select>
              </Field>
              <Field label="Bank / transaction ref (optional)">
                <Input value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder="e.g. teller slip no." />
              </Field>
              <button className="btn btn-primary" onClick={recordPayment} style={{ maxWidth: 150 }}>
                Record Payment
              </button>
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <RevenueItemLinePicker items={revenueItems ?? []} onAdd={addLine} />
            </div>
          )}

          {error != null && <Notice variant="bad">{error}</Notice>}
        </>
      )}
    </Modal>
    {bill != null && (
      <DocViewer
        open={printDoc != null}
        onClose={() => setPrintDoc(null)}
        title={printDoc === 'notice' ? 'Print Preview — Demand Notice' : 'Print Preview — Demand Bill'}
        src={printDoc != null ? `/print/demand-${printDoc}?bill=${encodeURIComponent(bill.bill_ref)}` : null}
      />
    )}
    </>
  );
}
