import { apiClient, errorMessage } from '@acrev360/api';
import { ClickableRow, KV, Modal, NumCell, TableWrap, dateTime, money2 } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function ReceiptsPage() {
  const [detail, setDetail] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/receipts', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  const receipt = data?.find((r) => r.id === detail);

  return (
    <>
      <div className="card">
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
                  <th className="r">Verified</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((r) => (
                    <ClickableRow key={r.id} onClick={() => setDetail(r.id)}>
                      <NumCell>{r.receipt_ref}</NumCell>
                      <NumCell>{r.bill_ref}</NumCell>
                      <NumCell className="r">{money2(r.amount)}</NumCell>
                      <NumCell>{dateTime(r.created_at)}</NumCell>
                      <td className="r">{r.verified_count}</td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      No receipts issued yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {receipt != null && (
        <Modal open onClose={() => setDetail(null)} title={`Receipt — ${receipt.receipt_ref}`} footer={<button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>}>
          <KV label="Bill">
            <span className="num">{receipt.bill_ref}</span>
          </KV>
          <KV label="Amount">
            <span className="num">{money2(receipt.amount)}</span>
          </KV>
          <KV label="Issued">{dateTime(receipt.created_at)}</KV>
          <KV label="Verification token">
            <span className="num">{receipt.qr_token}</span>
          </KV>
          <KV label="Times verified">{receipt.verified_count}</KV>
        </Modal>
      )}
    </>
  );
}
