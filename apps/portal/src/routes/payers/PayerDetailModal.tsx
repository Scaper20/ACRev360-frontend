import { apiClient, errorMessage } from '@acrev360/api';
import { KV, Modal, money, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWards, wardNameLookup } from '../../lib/wards';

export function PayerDetailModal({ payerId, onClose }: { payerId: number; onClose: () => void }) {
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);
  const toast = useToast();
  const queryClient = useQueryClient();

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
      const { data, error } = await apiClient.POST('/api/v1/bills', { body: { payer_id: payerId, bill_all_drafts: true, roll_arrears: false } });
      if (error) throw new Error(errorMessage(error));
      toast(`Harmonized bill issued — ${data.bill_ref} (${money(data.total_amount)})`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payers', 'draft-assessments', payerId] }),
        queryClient.invalidateQueries({ queryKey: ['bills'] }),
      ]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not issue bill', true);
    }
  }

  const p = payerQuery.data;
  const drafts = draftsQuery.data ?? [];
  const draftsTotal = drafts.reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <Modal open onClose={onClose} title={p?.full_name ?? 'Payer'} footer={<button className="btn btn-ghost" onClick={onClose}>Close</button>}>
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
          <KV label="KYC status">{p.kyc_status}</KV>

          <h3 style={{ margin: '18px 0 8px' }}>Enumerated Revenue Items — not yet billed ({drafts.length})</h3>
          {drafts.length === 0 ? (
            <div className="empty">Nothing pending — enumerate revenue items for this payer to build one up</div>
          ) : (
            <>
              {drafts.map((a) => (
                <KV key={a.id} label={`${a.harmonised_code} — ${a.item_name}`}>
                  <span className="num">{money(a.amount)}</span>
                </KV>
              ))}
              <KV label={<b>Total if billed now</b>}>
                <span className="num">{money(draftsTotal)}</span>
              </KV>
              <button className="btn btn-brass btn-sm" style={{ marginTop: 8 }} onClick={issueHarmonizedBill}>
                Issue Harmonized Bill
              </button>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
