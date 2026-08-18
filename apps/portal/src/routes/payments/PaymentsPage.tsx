import { apiClient, errorMessage } from '@acrev360/api';
import { NumCell, TableWrap, dateTime, money2 } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

export function PaymentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payments', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  return (
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
              {data && data.length > 0 ? (
                data.map((p) => (
                  <tr key={p.id}>
                    <NumCell>{p.payment_ref}</NumCell>
                    <td>
                      {p.full_name} <span className="num">({p.payer_ref})</span>
                    </td>
                    <NumCell>{p.bill_ref}</NumCell>
                    <td>{p.channel_code}</td>
                    <NumCell className="r">{money2(p.amount)}</NumCell>
                    <td>
                      <span className={`tag tag-${p.txn_status === 'CONFIRMED' ? 'ok' : p.txn_status === 'FAILED' ? 'bad' : 'warn'}`}>{p.txn_status}</span>
                    </td>
                    <NumCell>{dateTime(p.created_at)}</NumCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty">
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableWrap>
    </div>
  );
}
