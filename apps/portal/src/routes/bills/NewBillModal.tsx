import { apiClient, errorMessage } from '@acrev360/api';
import { Field, GroupedSelect, Input, Modal, Notice, TypeaheadPicker, money, useToast } from '@acrev360/ui';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { searchPayers } from '../../lib/payerSearch';
import { REVENUE_CATEGORY_ORDER, toGroupedItems, useRevenueItems } from '../../lib/revenueItems';

interface DraftLine {
  revenueItemId: number;
  label: string;
  quantity: number;
  amount: number;
}

type PayerHit = Awaited<ReturnType<typeof searchPayers>>[number];

// A <button> styled to read as an inline text link, not href="javascript:void(0)"
// — React 19 actively blocks javascript: URLs as an XSS hardening measure
// (throws "React has blocked a javascript: URL as a security precaution."
// on every click, confirmed live), so that old pattern is a real bug now,
// not just dated style.
const LINK_BUTTON_STYLE: CSSProperties = { background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--danger)', marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' };

export function NewBillModal({ onClose, onCreated }: { onClose: () => void; onCreated: (billId: number) => void }) {
  const { data: revenueItems } = useRevenueItems();
  const toast = useToast();
  const groupedItems = revenueItems ? toGroupedItems(revenueItems) : [];

  const [payer, setPayer] = useState<PayerHit | null>(null);
  const [itemId, setItemId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [rollArrears, setRollArrears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addLine() {
    const item = revenueItems?.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => [...prev, { revenueItemId: item.id, label: item.item_name, quantity: qty, amount: Number(item.current_rate) * qty }]);
  }

  async function submit() {
    if (!payer) {
      setError('Search and select a payer first');
      return;
    }
    if (lines.length === 0 && !rollArrears) {
      setError('Add at least one revenue item, or consolidate prior arrears');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { data, error } = await apiClient.POST('/api/v1/bills', {
        body: {
          payer_id: payer.id,
          lines: lines.map((l) => ({ revenue_item_id: l.revenueItemId, quantity: String(l.quantity) })),
          bill_all_drafts: false,
          roll_arrears: rollArrears,
        },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`Bill issued — ${data.bill_ref} (${money(data.total_amount)})` + (Number(data.arrears_amount) > 0 ? ` · ${money(data.arrears_amount)} arrears consolidated` : ''));
      onCreated(data.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not issue bill');
    } finally {
      setSubmitting(false);
    }
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);

  return (
    <Modal
      open
      onClose={onClose}
      title="New Bill"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            Issue Bill
          </button>
        </>
      }
    >
      <Field label="Payer">
        <TypeaheadPicker
          placeholder="Search by name, payer ref or phone"
          search={searchPayers}
          renderHit={(p) => p.full_name}
          renderRef={(p) => `${p.payer_ref}${p.phone ? ' · ' + p.phone : ''}`}
          onPick={(p) => setPayer(p)}
        />
      </Field>
      {payer != null && (
        <div className="notice notice-info">
          Selected: {payer.full_name} · {payer.payer_ref}
        </div>
      )}

      <div className="row">
        <Field label="Revenue item">
          <GroupedSelect items={groupedItems} groupOrder={REVENUE_CATEGORY_ORDER} value={itemId} onChange={setItemId} />
        </Field>
        <Field label="Qty">
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} style={{ maxWidth: 90 }} />
        </Field>
        <button className="btn btn-ghost" onClick={addLine} type="button">
          Add line
        </button>
      </div>

      {lines.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {lines.map((l, i) => (
            <div className="kv" key={i}>
              <span>
                {l.label} × {l.quantity}
              </span>
              <b className="num">
                {money(l.amount)}{' '}
                <button type="button" style={LINK_BUTTON_STYLE} onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>
                  remove
                </button>
              </b>
            </div>
          ))}
          <div className="kv">
            <span>
              <b>Total</b>
            </span>
            <b className="num">{money(total)}</b>
          </div>
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, marginTop: 10 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={rollArrears} onChange={(e) => setRollArrears(e.target.checked)} />
        Consolidate this payer&rsquo;s prior outstanding bills into this one (arrears brought forward)
      </label>

      {error != null && <Notice variant="bad">{error}</Notice>}
    </Modal>
  );
}
