import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, KV, Modal, Select, money, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useWards, wardNameLookup } from '../../lib/wards';

const KYC_STATUSES = ['PENDING', 'VERIFIED', 'FLAGGED'];

export function PayerDetailModal({ payerId, onClose }: { payerId: number; onClose: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rollArrears, setRollArrears] = useState(false);

  const payerQuery = useQuery({
    queryKey: ['payers', 'detail', payerId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers/{id}', { params: { path: { id: String(payerId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const draftsQuery = useQuery({
    queryKey: ['payers', 'draft-assessments', payerId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers/{id}/draft-assessments', { params: { path: { id: String(payerId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  async function issueHarmonizedBill() {
    try {
      const { data, error } = await apiClient.POST('/api/v1/bills', { body: { payer_id: payerId, bill_all_drafts: true, roll_arrears: rollArrears } });
      if (error) throw new Error(errorMessage(error));
      toast(`Harmonized bill issued — ${data.bill_ref} (${money(data.total_amount)})` + (Number(data.arrears_amount) > 0 ? ` · ${money(data.arrears_amount)} arrears consolidated` : ''));
      setRollArrears(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payers', 'draft-assessments', payerId] }),
        queryClient.invalidateQueries({ queryKey: ['bills'] }),
      ]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not issue bill', true);
    }
  }

  async function changeKyc(status: string) {
    try {
      const { error } = await apiClient.POST('/api/v1/payers/{id}/kyc-status', {
        params: { path: { id: String(payerId) } },
        body: { kyc_status: status as components['schemas']['KycStatusEnum'] },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`KYC status set to ${status}`);
      await queryClient.invalidateQueries({ queryKey: ['payers'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change KYC status', true);
    }
  }

  async function deletePayer() {
    if (p == null) return;
    if (!window.confirm(`Delete ${p.full_name} (${p.payer_ref})? This can't be undone.`)) return;
    try {
      const { error, response } = await apiClient.DELETE('/api/v1/payers/{id}', { params: { path: { id: String(payerId) } } });
      if (error) {
        if (response.status === 409 && 'error' in error) throw new Error((error as { error: string }).error);
        throw new Error(errorMessage(error));
      }
      toast(`${p.payer_ref} deleted`);
      // Close before invalidating — otherwise this modal's own now-404ing
      // detail/drafts queries are still "active" and get swept into the
      // invalidation's refetch, which then sits out their retry/backoff
      // before onClose() ever runs.
      onClose();
      await queryClient.invalidateQueries({ queryKey: ['payers'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete payer', true);
    }
  }

  const p = payerQuery.data;
  const drafts = draftsQuery.data ?? [];
  const draftsTotal = drafts.reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <Modal
      open
      onClose={onClose}
      title={p?.full_name ?? 'Payer'}
      footer={
        <>
          {isAdmin && p != null && (
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={deletePayer}>
              Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {payerQuery.isLoading || !p ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <KV label="Payer ref">
            <span className="num">{p.payer_ref}</span>
          </KV>
          <KV label="Type">
            {p.payer_type}
            {p.business_size ? ` · ${p.business_size[0]}${p.business_size.slice(1).toLowerCase()}` : ''}
          </KV>
          <KV label="Ward">{wardName(p.ward)}</KV>
          <KV label="Phone">
            <span className="num">{p.phone || '—'}</span>
          </KV>
          {isAdmin ? (
            <Field label="KYC status">
              <Select value={p.kyc_status} onChange={(e) => changeKyc(e.target.value)}>
                {KYC_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <KV label="KYC status">{p.kyc_status}</KV>
          )}

          <h3 style={{ margin: '18px 0 8px' }}>Enumerated Revenue Items — not yet billed ({drafts.length})</h3>
          {drafts.length === 0 && (
            <div className="empty">Nothing pending — enumerate revenue items for this payer to build one up</div>
          )}
          {drafts.length > 0 && (
            <>
              {drafts.map((a) => (
                <KV key={a.id} label={`${a.harmonised_code} — ${a.item_name}`}>
                  <span className="num">{money(a.amount)}</span>
                </KV>
              ))}
              <KV label={<b>Total if billed now</b>}>
                <span className="num">{money(draftsTotal)}</span>
              </KV>
            </>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, marginTop: 10 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={rollArrears} onChange={(e) => setRollArrears(e.target.checked)} />
            Consolidate this payer&rsquo;s prior outstanding bills into this one (arrears brought forward)
          </label>
          {(drafts.length > 0 || rollArrears) && (
            <button className="btn btn-brass btn-sm" style={{ marginTop: 8 }} onClick={issueHarmonizedBill}>
              Issue Harmonized Bill
            </button>
          )}
        </>
      )}
    </Modal>
  );
}
