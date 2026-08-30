import { apiClient, errorMessage } from '@acrev360/api';
import { Field, Modal, Notice, TypeaheadPicker, money, useToast } from '@acrev360/ui';
import { useQueryClient } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { searchPayers } from '../../lib/payerSearch';
import { useRevenueItems } from '../../lib/revenueItems';
import type { LineToAdd } from './RevenueItemLinePicker';
import { RevenueItemLinePicker } from './RevenueItemLinePicker';

type DraftLine = LineToAdd;

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
  const queryClient = useQueryClient();

  const [payer, setPayer] = useState<PayerHit | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [rollArrears, setRollArrears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addLine(line: DraftLine) {
    setLines((prev) => {
      // A RANGE band's amount is manually chosen per addition and can
      // legitimately differ between two additions of the same band (e.g.
      // two different dealers assessed at different points in the same
      // range) — never pre-merge those here, since collapsing to one
      // quantity×override would silently change the total the moment two
      // overrides differ. The backend still merges them correctly on
      // submit (billing.services' identical fix), since it sums each
      // line's own already-computed amount rather than re-deriving one
      // from a single stored override.
      if (line.amountOverride == null) {
        const idx = prev.findIndex((l) => l.revenueItemId === line.revenueItemId && l.rateBandId === line.rateBandId && l.rateTierId === line.rateTierId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + line.quantity, amount: next[idx].amount + line.amount };
          return next;
        }
      }
      return [...prev, line];
    });
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
          lines: lines.map((l) => ({
            revenue_item_id: l.revenueItemId,
            quantity: String(l.quantity),
            rate_band_id: l.rateBandId,
            rate_tier_id: l.rateTierId,
            amount_override: l.amountOverride,
          })),
          bill_all_drafts: false,
          roll_arrears: rollArrears,
        },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`Bill issued — ${data.bill_ref} (${money(data.total_amount)})` + (Number(data.arrears_amount) > 0 ? ` · ${money(data.arrears_amount)} arrears consolidated` : ''));
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
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

      <RevenueItemLinePicker items={revenueItems ?? []} onAdd={addLine} />

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
