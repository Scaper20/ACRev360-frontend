import { apiClient, errorMessage } from '@acrev360/api';
import type { MyPaymentList } from '@acrev360/api';
import type { TagVariant } from '@acrev360/ui';
import { Card, ClickableRow, KV, Modal, NumCell, Tag, TableWrap, dateTime, money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const TAG_FOR: Record<string, TagVariant> = { CONFIRMED: 'ok', FAILED: 'bad', PENDING: 'warn', REVERSED: 'neutral' };

export function PaymentsView() {
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my', 'payments'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/my/payments');
      if (error) throw new Error(errorMessage(error));
      // Documented as a paginated envelope, confirmed live: bare array —
      // see packages/api/src/overrides.ts #10.
      return data as unknown as MyPaymentList;
    },
  });

  const payment = data?.find((p) => p.id === detailId);

  return (
    <>
      <Card>
        <h3>Your Payments</h3>
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
                  <th>Bill Ref</th>
                  <th>Channel</th>
                  <th className="r">Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((p) => (
                    <ClickableRow key={p.id} onClick={() => setDetailId(p.id)}>
                      <NumCell>{p.payment_ref}</NumCell>
                      <NumCell>{p.bill_ref}</NumCell>
                      <td>{p.channel_code}</td>
                      <NumCell className="r">{money(p.amount)}</NumCell>
                      <NumCell>{dateTime(p.created_at)}</NumCell>
                      <td>
                        <Tag variant={TAG_FOR[p.txn_status] ?? 'neutral'}>{p.txn_status}</Tag>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      No payments on file yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>

      {payment != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={`Payment — ${payment.payment_ref}`}
          footer={<button className="btn btn-ghost" onClick={() => setDetailId(null)}>Close</button>}
        >
          <KV label="Bill">{payment.bill_ref}</KV>
          <KV label="Channel">{payment.channel_code}</KV>
          <KV label="Date">{dateTime(payment.created_at)}</KV>
          <KV label="Amount">
            <span className="num">{money(payment.amount)}</span>
          </KV>
          <KV label="Status">
            <Tag variant={TAG_FOR[payment.txn_status] ?? 'neutral'}>{payment.txn_status}</Tag>
          </KV>
          {payment.receipt_ref && <KV label="Receipt">{payment.receipt_ref}</KV>}

          {payment.allocations.length > 0 && (
            <>
              <h3 style={{ margin: '16px 0 8px' }}>Applied to</h3>
              {payment.allocations.map((a) => (
                <KV key={a.id} label={`${a.harmonised_code} — ${a.item_name}`}>
                  <span className="num">{money(a.amount)}</span>
                </KV>
              ))}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
