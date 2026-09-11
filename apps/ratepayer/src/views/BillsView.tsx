import { apiClient, errorMessage } from '@acrev360/api';
import type { MyBillList } from '@acrev360/api';
import type { TagVariant } from '@acrev360/ui';
import { Card, ClickableRow, KV, Modal, NumCell, Tag, TableWrap, money, shortDate } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const TAG_FOR: Record<string, TagVariant> = { PAID: 'ok', OVERDUE: 'bad', PART_PAID: 'warn', ISSUED: 'neutral', CANCELLED: 'neutral', SUPERSEDED: 'neutral' };

export function BillsView() {
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my', 'bills'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/my/bills');
      if (error) throw new Error(errorMessage(error));
      // Documented as a paginated envelope, confirmed live: bare array —
      // see packages/api/src/overrides.ts #9.
      return data as unknown as MyBillList;
    },
  });

  const bill = data?.find((b) => b.id === detailId);

  return (
    <>
      <Card>
        <h3>Your Bills</h3>
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
                  <th className="r">Total</th>
                  <th className="r">Balance</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((b) => (
                    <ClickableRow key={b.id} onClick={() => setDetailId(b.id)}>
                      <NumCell>{b.bill_ref}</NumCell>
                      <NumCell className="r">{money(b.total_amount)}</NumCell>
                      <NumCell className="r">{money(b.balance)}</NumCell>
                      <NumCell>{shortDate(b.due_date)}</NumCell>
                      <td>
                        <Tag variant={TAG_FOR[b.status] ?? 'neutral'}>{b.status.replace('_', ' ')}</Tag>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      No bills on file yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>

      {bill != null && (
        <Modal open onClose={() => setDetailId(null)} title={`Bill — ${bill.bill_ref}`} footer={<button className="btn btn-ghost" onClick={() => setDetailId(null)}>Close</button>}>
          <KV label="Status">
            <Tag variant={TAG_FOR[bill.status] ?? 'neutral'}>{bill.status.replace('_', ' ')}</Tag>
          </KV>
          <KV label="Due date">{shortDate(bill.due_date)}</KV>
          <KV label="Total">
            <span className="num">{money(bill.total_amount)}</span>
          </KV>
          <KV label="Paid so far">
            <span className="num">{money(bill.amount_paid)}</span>
          </KV>
          {Number(bill.arrears_amount) > 0 && (
            <KV label="Arrears brought forward">
              <span className="num">{money(bill.arrears_amount)}</span>
            </KV>
          )}
          <KV label={<b>Balance</b>}>
            <span className="num">{money(bill.balance)}</span>
          </KV>
        </Modal>
      )}
    </>
  );
}
