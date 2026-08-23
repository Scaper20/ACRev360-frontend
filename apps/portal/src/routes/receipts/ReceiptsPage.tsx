import { apiClient, errorMessage } from '@acrev360/api';
import { ClickableRow, KV, Modal, NumCell, Pagination, TableWrap, dateTime, money2, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function ReceiptsPage() {
  const [detail, setDetail] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['receipts', q, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/receipts', { params: { query: { q: q || undefined, page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  const receipt = data?.results.find((r) => r.id === detail);

  // GET /api/v1/verify/{qr_token} is a public endpoint — anyone with the
  // token (e.g. off a printed receipt's QR/SMS code) can confirm it's real.
  // This button exercises that same check from the admin side, matching
  // what a bank or auditor could independently do.
  async function verify(qrToken: string) {
    const { data, error } = await apiClient.GET('/api/v1/verify/{qr_token}', { params: { path: { qr_token: qrToken } } });
    if (error) {
      toast(errorMessage(error), true);
      return;
    }
    toast(`Valid — ${data.receipt_ref} · ${money2(data.amount)} · ${data.payer_name}`);
    await queryClient.invalidateQueries({ queryKey: ['receipts'] });
  }

  async function sendReceipt(id: number) {
    setSending(true);
    try {
      const { data, error } = await apiClient.POST('/api/v1/receipts/{id}/send', { params: { path: { id: String(id) } } });
      if (error) {
        toast(errorMessage(error), true);
        return;
      }
      const parts: string[] = [];
      parts.push(data.email.attempted ? (data.email.sent ? 'Email sent' : `Email failed: ${data.email.error}`) : `Email skipped — ${data.email.reason}`);
      parts.push(data.sms.attempted ? (data.sms.sent ? 'SMS sent' : `SMS failed: ${data.sms.error}`) : `SMS skipped — ${data.sms.reason}`);
      const failed = (data.email.attempted && !data.email.sent) || (data.sms.attempted && !data.sms.sent);
      toast(parts.join(' · '), failed);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by receipt ref, bill ref or payer…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
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
                  <th>Payer</th>
                  <th>Bill</th>
                  <th className="r">Amount</th>
                  <th>Issued</th>
                  <th className="r">Verified</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((r) => (
                    <ClickableRow key={r.id} onClick={() => setDetail(r.id)}>
                      <NumCell>{r.receipt_ref}</NumCell>
                      <td>{r.full_name}</td>
                      <NumCell>{r.bill_ref}</NumCell>
                      <NumCell className="r">{money2(r.amount)}</NumCell>
                      <NumCell>{dateTime(r.created_at)}</NumCell>
                      <td className="r">{r.verified_count}</td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      {q ? 'No receipts match' : 'No receipts issued yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {receipt != null && (
        <Modal
          open
          onClose={() => setDetail(null)}
          title={`Receipt — ${receipt.receipt_ref}`}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => sendReceipt(receipt.id)} disabled={sending}>
                {sending ? 'Sending…' : 'Send Receipt'}
              </button>
              <button className="btn btn-brass" onClick={() => verify(receipt.qr_token)}>
                Verify
              </button>
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>
                Close
              </button>
            </>
          }
        >
          <KV label="Payer">{receipt.full_name}</KV>
          <KV label="Bill">
            <span className="num">{receipt.bill_ref}</span>
          </KV>
          <KV label="Amount">
            <span className="num">{money2(receipt.amount)}</span>
          </KV>
          <KV label="Issued">{dateTime(receipt.created_at)}</KV>

          <h3 style={{ margin: '14px 0 6px' }}>Paid For</h3>
          {receipt.lines.map((l) => (
            <KV key={l.id} label={l.item_name + (l.band_label ? ` (${l.band_label}${l.tier_label ? ` — ${l.tier_label}` : ''})` : '')}>
              <span className="num">{money2(l.line_amount)}</span>
            </KV>
          ))}
          <KV label="Verification token">
            <span className="num">{receipt.qr_token}</span>
          </KV>
          <KV label="Times verified">{receipt.verified_count}</KV>
        </Modal>
      )}
    </>
  );
}
