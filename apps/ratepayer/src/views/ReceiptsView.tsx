import { apiClient, errorMessage } from '@acrev360/api';
import type { MyReceiptList } from '@acrev360/api';
import { Card, ClickableRow, KV, Modal, NumCell, TableWrap, dateTime, money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function ReceiptsView() {
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my', 'receipts'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/my/receipts');
      if (error) throw new Error(errorMessage(error));
      // Documented as a paginated envelope, confirmed live: bare array —
      // see packages/api/src/overrides.ts #11.
      return data as unknown as MyReceiptList;
    },
  });

  const receipt = data?.find((r) => r.id === detailId);

  return (
    <>
      <Card>
        <h3>Your Receipts</h3>
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load receipts'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Receipt Ref</th>
                  <th>Bill</th>
                  <th className="r">Amount</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((r) => (
                    <ClickableRow key={r.id} onClick={() => setDetailId(r.id)}>
                      <NumCell>{r.receipt_ref}</NumCell>
                      <NumCell>{r.bill_ref}</NumCell>
                      <NumCell className="r">{money(r.amount)}</NumCell>
                      <NumCell>{dateTime(r.created_at)}</NumCell>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      No receipts issued yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>

      {receipt != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={`Receipt — ${receipt.receipt_ref}`}
          footer={<button className="btn btn-ghost" onClick={() => setDetailId(null)}>Close</button>}
        >
          <KV label="Bill">{receipt.bill_ref}</KV>
          <KV label="Issued">{dateTime(receipt.created_at)}</KV>
          <KV label={<b>Amount paid</b>}>
            <span className="num">{money(receipt.amount)}</span>
          </KV>

          <h3 style={{ margin: '16px 0 8px' }}>What this covered</h3>
          {receipt.allocations.length > 0 ? (
            receipt.allocations.map((a) => (
              <KV key={a.id} label={`${a.harmonised_code} — ${a.item_name}`}>
                <span className="num">{money(a.amount)}</span>
              </KV>
            ))
          ) : (
            <div className="empty">No allocation detail on file for this receipt</div>
          )}
        </Modal>
      )}
    </>
  );
}
