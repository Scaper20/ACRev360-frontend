import { apiClient, errorMessage } from '@acrev360/api';
import type { TagVariant } from '@acrev360/ui';
import { ClickableRow, KV, Modal, NumCell, Pagination, Tag, TableWrap, dateTime, money2, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'REVERSED'];
const CHANNELS = [
  { code: 'POS', label: 'POS' },
  { code: 'OTC', label: 'Branch Teller' },
  { code: 'IB_MB', label: 'Bank Transfer' },
  { code: 'USSD', label: 'USSD' },
  { code: 'FIRSTMONIE', label: 'Agent Banking' },
];
const TAG_FOR: Record<string, TagVariant> = { CONFIRMED: 'ok', FAILED: 'bad', PENDING: 'warn', REVERSED: 'neutral' };

export function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', q, status, channel, dateFrom, dateTo, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payments', {
        params: { query: { q: q || undefined, status: status || undefined, channel: channel || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, page } },
      });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  // Fetched independently by id (rather than found on the current page of
  // list results) so the detail modal survives a reversal even when the
  // active status filter would otherwise drop the row from `data.results`.
  const detailQuery = useQuery({
    queryKey: ['payments', 'detail', detailId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payments/{id}', { params: { path: { id: String(detailId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
    enabled: detailId != null,
  });

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  async function reverse(id: number) {
    const reason = window.prompt('Reason for reversal (optional):', '');
    if (reason === null) return;
    try {
      const { error } = await apiClient.POST('/api/v1/payments/{id}/reverse', { params: { path: { id: String(id) } }, body: { reason } });
      if (error) throw new Error(errorMessage(error));
      toast('Payment reversed');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['bills'] }),
      ]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not reverse payment', true);
    }
  }

  const payment = detailQuery.data;

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by payment ref, bill ref or payer…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 150 }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 170 }}
        >
          <option value="">All channels</option>
          {CHANNELS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 150 }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 150 }}
        />
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load payments'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Payment Ref</th>
                  <th>Payer</th>
                  <th>Bill</th>
                  <th>Channel</th>
                  <th className="r">Amount</th>
                  <th>Status</th>
                  <th>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((p) => (
                    <ClickableRow key={p.id} onClick={() => setDetailId(p.id)}>
                      <NumCell>{p.payment_ref}</NumCell>
                      <td>
                        {p.full_name} <span className="num">({p.payer_ref})</span>
                      </td>
                      <NumCell>{p.bill_ref}</NumCell>
                      <td>{p.channel_code}</td>
                      <NumCell className="r">{money2(p.amount)}</NumCell>
                      <td>
                        <Tag variant={TAG_FOR[p.txn_status] ?? 'neutral'}>{p.txn_status}</Tag>
                      </td>
                      <NumCell>{dateTime(p.created_at)}</NumCell>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      No payments match
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {detailId != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={payment ? `Payment — ${payment.payment_ref}` : 'Payment'}
          footer={
            <>
              {isAdmin && payment?.txn_status === 'CONFIRMED' && (
                <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => reverse(payment.id)}>
                  Reverse
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Close
              </button>
            </>
          }
        >
          {detailQuery.isLoading || !payment ? (
            <div className="empty">Loading…</div>
          ) : (
            <>
              <KV label="Payer">
                {payment.full_name} <span className="num">({payment.payer_ref})</span>
              </KV>
              <KV label="Bill">
                <span className="num">{payment.bill_ref}</span>
              </KV>
              <KV label="Channel">{CHANNELS.find((c) => c.code === payment.channel_code)?.label ?? payment.channel_code}</KV>
              <KV label="Amount">
                <span className="num">{money2(payment.amount)}</span>
              </KV>
              <KV label="Status">
                <Tag variant={TAG_FOR[payment.txn_status] ?? 'neutral'}>{payment.txn_status}</Tag>
              </KV>
              <KV label="Terminal">{payment.terminal_code || '—'}</KV>
              <KV label="Posted by">{payment.posted_by_name || '—'}</KV>
              <KV label="Bank / transaction ref">{payment.bank_txn_ref || '—'}</KV>
              <KV label="Paid at">{dateTime(payment.created_at)}</KV>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
