import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Button, ClickableRow, Field, Input, KV, Modal, Notice, NumCell, Pagination, Tag, money, money2, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const LADDER = ['NONE', 'FIRST_NOTICE', 'FINAL_NOTICE', 'ENFORCEMENT', 'LEGAL', 'CLOSED'] as const;

export function DebtPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const canPay = isAdmin || user?.access_level === 'CONSULTANT';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [channel, setChannel] = useState('POS');
  const [bankRef, setBankRef] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['debt', q, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/debt', { params: { query: { q: q || undefined, page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  async function refreshAgeing() {
    try {
      const { data, error } = await apiClient.POST('/api/v1/debt/refresh');
      if (error) throw new Error(errorMessage(error));
      toast(`${data.opened} case(s) opened, ${data.updated} updated`);
      await queryClient.invalidateQueries({ queryKey: ['debt'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not refresh ageing', true);
    }
  }

  async function escalate(id: number) {
    try {
      const { error } = await apiClient.POST('/api/v1/debt/{id}/escalate', { params: { path: { id: String(id) } } });
      if (error) throw new Error(errorMessage(error));
      toast('Escalated');
      await queryClient.invalidateQueries({ queryKey: ['debt'] });
      setDetailId(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not escalate', true);
    }
  }

  function closeDetail() {
    setDetailId(null);
    setPayAmount('');
    setBankRef('');
    setPayError(null);
  }

  async function recordPayment(billId: number) {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Enter a valid amount');
      return;
    }
    setPayError(null);
    try {
      const { data, error } = await apiClient.POST('/api/v1/payments', {
        body: { bill_id: billId, amount: String(amount), channel_code: channel as components['schemas']['ChannelCodeEnum'], bank_txn_ref: bankRef || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`Payment recorded — ${money(data.amount)}`);
      setPayAmount('');
      setBankRef('');
      await queryClient.invalidateQueries({ queryKey: ['debt'] });
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Could not record payment');
    }
  }

  const debtCase = data?.results.find((d) => d.id === detailId);

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by bill reference or payer…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
        {isAdmin && <Button onClick={refreshAgeing}>Refresh Ageing</Button>}
      </div>
      <div className="card">
        <div className="table-wrap">
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load debt cases'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Payer</th>
                  <th className="r">Balance</th>
                  <th>Ageing</th>
                  <th>Stage</th>
                  <th className="r">Reminders</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((d) => (
                    <ClickableRow key={d.id} onClick={() => setDetailId(d.id)}>
                      <NumCell>{d.bill_ref}</NumCell>
                      <td>{d.full_name}</td>
                      <NumCell className="r">{money2(d.balance)}</NumCell>
                      <td>
                        <Tag variant={d.ageing_bucket === 'OVER_90' ? 'bad' : d.ageing_bucket === '0_30' ? 'ok' : 'warn'}>{d.ageing_bucket.replace('_', '–')}</Tag>
                      </td>
                      <td>{d.enforcement_stage.replace('_', ' ')}</td>
                      <td className="r">{d.reminder_count}</td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      {q ? 'No debt cases match' : 'No open debt cases'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {debtCase != null && (
        <Modal
          open
          onClose={closeDetail}
          title={`Debt Case — ${debtCase.bill_ref}`}
          footer={
            <>
              {isAdmin && debtCase.enforcement_stage !== 'CLOSED' && (
                <button className="btn btn-brass" onClick={() => escalate(debtCase.id)}>
                  Escalate to {LADDER[Math.min(LADDER.indexOf(debtCase.enforcement_stage as (typeof LADDER)[number]) + 1, LADDER.length - 1)].replace('_', ' ')}
                </button>
              )}
              <button className="btn btn-ghost" onClick={closeDetail}>
                Close
              </button>
            </>
          }
        >
          <KV label="Payer">{debtCase.full_name}</KV>
          <KV label="Balance">
            <span className="num">{money2(debtCase.balance)}</span>
          </KV>
          <KV label="Ageing">{debtCase.ageing_bucket.replace('_', '–')}</KV>
          <KV label="Enforcement stage">{debtCase.enforcement_stage.replace('_', ' ')}</KV>
          <KV label="Reminders sent">{debtCase.reminder_count}</KV>

          {canPay && Number(debtCase.balance) > 0 && (
            <div className="row" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14, alignItems: 'end' }}>
              <Field label="Record payment — Amount">
                <Input type="number" min={0.01} step={0.01} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ maxWidth: 130 }} placeholder={debtCase.balance} />
              </Field>
              <Field label="Channel">
                <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ maxWidth: 160 }}>
                  <option value="POS">POS</option>
                  <option value="OTC">Branch Teller</option>
                  <option value="IB_MB">Bank Transfer</option>
                  <option value="USSD">USSD</option>
                  <option value="FIRSTMONIE">Agent Banking</option>
                </select>
              </Field>
              <Field label="Bank / transaction ref (optional)">
                <Input value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder="e.g. teller slip no." />
              </Field>
              <button className="btn btn-primary" onClick={() => recordPayment(debtCase.bill)} style={{ maxWidth: 150 }}>
                Record Payment
              </button>
            </div>
          )}
          {payError != null && <Notice variant="bad">{payError}</Notice>}
        </Modal>
      )}
    </>
  );
}
