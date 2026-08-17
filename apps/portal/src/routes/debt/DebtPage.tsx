import { apiClient, errorMessage } from '@acrev360/api';
import { Button, ClickableRow, KV, Modal, NumCell, Tag, money2, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const LADDER = ['NONE', 'FIRST_NOTICE', 'FINAL_NOTICE', 'ENFORCEMENT', 'LEGAL', 'CLOSED'] as const;

export function DebtPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['debt'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/debt', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

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

  const debtCase = data?.find((d) => d.id === detailId);

  return (
    <>
      {isAdmin && (
        <div className="toolbar">
          <div className="grow" />
          <Button onClick={refreshAgeing}>Refresh Ageing</Button>
        </div>
      )}
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
                {data && data.length > 0 ? (
                  data.map((d) => (
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
                      No open debt cases
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {debtCase != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={`Debt Case — ${debtCase.bill_ref}`}
          footer={
            <>
              {isAdmin && debtCase.enforcement_stage !== 'CLOSED' && (
                <button className="btn btn-brass" onClick={() => escalate(debtCase.id)}>
                  Escalate to {LADDER[Math.min(LADDER.indexOf(debtCase.enforcement_stage as (typeof LADDER)[number]) + 1, LADDER.length - 1)].replace('_', ' ')}
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
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
        </Modal>
      )}
    </>
  );
}
