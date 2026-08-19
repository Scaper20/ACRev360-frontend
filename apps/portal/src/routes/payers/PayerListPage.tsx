import { apiClient, errorMessage } from '@acrev360/api';
import { Button, ClickableRow, NumCell, Pagination, TableWrap } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useWards, wardNameLookup } from '../../lib/wards';
import { PayerDetailModal } from './PayerDetailModal';
import { PayerFormModal } from './PayerFormModal';

/**
 * Live-filters as you type — TanStack Query keys the request on `q` and
 * handles request cancellation/staleness itself (this is exactly the bug
 * class the prototype's hand-rolled version once shipped: a debounced input
 * whose staleness guard compared a string against `undefined` and got stuck
 * showing nothing. Query makes that structurally hard to reintroduce.)
 */
export function PayerListPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [registerType, setRegisterType] = useState<'INDIVIDUAL' | 'BUSINESS' | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);

  const { data, error, isLoading } = useQuery({
    queryKey: ['payers', q, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers', { params: { query: { q: q || undefined, page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by name, payer ref or phone…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
        <Button onClick={() => setRegisterType('INDIVIDUAL')}>Register Individual</Button>
        <Button variant="primary" onClick={() => setRegisterType('BUSINESS')}>
          Register Business
        </Button>
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load payers'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Payer Ref</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Ward</th>
                  <th>Phone</th>
                  <th>KYC</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((p) => (
                    <ClickableRow key={p.id} onClick={() => setDetailId(p.id)}>
                      <NumCell>{p.payer_ref}</NumCell>
                      <td>{p.full_name}</td>
                      <td>{p.payer_type}</td>
                      <td>{wardName(p.ward)}</td>
                      <NumCell>{p.phone || '—'}</NumCell>
                      <td>
                        <span className={`tag tag-${p.kyc_status === 'VERIFIED' ? 'ok' : p.kyc_status === 'FLAGGED' ? 'bad' : 'warn'}`}>{p.kyc_status}</span>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      No payers match
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {registerType != null && <PayerFormModal payerType={registerType} onClose={() => setRegisterType(null)} />}
      {detailId != null && <PayerDetailModal payerId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
