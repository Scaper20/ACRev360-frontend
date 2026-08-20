import { apiClient, errorMessage } from '@acrev360/api';
import { Button, ClickableRow, NumCell, Pagination, TableWrap, money, shortDate } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BillDetailModal } from './BillDetailModal';
import { NewBillModal } from './NewBillModal';

const STATUSES = ['ISSUED', 'PART_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'SUPERSEDED'];

const TAG_FOR: Record<string, string> = {
  PAID: 'ok',
  OVERDUE: 'bad',
  PART_PAID: 'warn',
  CANCELLED: 'neutral',
  SUPERSEDED: 'neutral',
};

export function BillListPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['bills', q, status, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bills', { params: { query: { q: q || undefined, status: status || undefined, page } } });
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
        <input className="grow" autoComplete="off" placeholder="Search by bill reference or payer…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
        <select
          style={{ maxWidth: 220 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <div className="grow" />
        <Button variant="primary" onClick={() => setOpenNew(true)}>
          New Bill
        </Button>
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load bills'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill Ref</th>
                  <th>Payer</th>
                  <th>Consultant</th>
                  <th className="r">Total</th>
                  <th className="r">Balance</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((b) => (
                    <ClickableRow key={b.id} onClick={() => setDetailId(b.id)}>
                      <NumCell>{b.bill_ref}</NumCell>
                      <td>{b.full_name}</td>
                      <td>{b.consultant_name ?? 'Council Direct'}</td>
                      <NumCell className="r">{money(b.total_amount)}</NumCell>
                      <NumCell className="r">{money(b.balance)}</NumCell>
                      <NumCell>{shortDate(b.due_date)}</NumCell>
                      <td>
                        <span className={`tag tag-${TAG_FOR[b.status] ?? 'brass'}`}>{b.status.replace('_', ' ')}</span>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      No bills match
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {openNew && <NewBillModal onClose={() => setOpenNew(false)} onCreated={(id) => setDetailId(id)} />}
      {detailId != null && <BillDetailModal billId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
