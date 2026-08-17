import { apiClient, errorMessage } from '@acrev360/api';
import { Button, ClickableRow, Field, KV, Modal, NumCell, Select, TableWrap, Tag, money2, shortDate, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const CHANNELS = ['POS', 'OTC', 'IB_MB', 'USSD', 'FIRSTMONIE'];

export function ReconciliationPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runDate, setRunDate] = useState('');
  const [runChannel, setRunChannel] = useState(CHANNELS[0]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/reconciliation', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  async function runNow() {
    try {
      const { error } = await apiClient.POST('/api/v1/reconciliation/run', { body: { channel_code: runChannel, date: runDate || undefined } });
      if (error) throw new Error(errorMessage(error));
      toast('Reconciliation run complete');
      setRunOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Reconciliation run failed', true);
    }
  }

  const run = data?.find((r) => r.id === detailId);

  return (
    <>
      {isAdmin && (
        <div className="toolbar">
          <div className="grow" />
          <Button variant="primary" onClick={() => setRunOpen(true)}>
            Run Reconciliation
          </Button>
        </div>
      )}
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load reconciliation runs'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Date</th>
                  <th className="r">Platform</th>
                  <th className="r">Bank</th>
                  <th>Status</th>
                  <th className="r">Exceptions</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((r) => (
                    <ClickableRow key={r.id} onClick={() => setDetailId(r.id)}>
                      <td>{r.channel_code}</td>
                      <NumCell>{shortDate(r.run_date)}</NumCell>
                      <NumCell className="r">{money2(r.total_platform)}</NumCell>
                      <NumCell className="r">{money2(r.total_bank)}</NumCell>
                      <td>
                        <Tag variant={r.status === 'BALANCED' ? 'ok' : r.status === 'EXCEPTIONS' ? 'bad' : 'neutral'}>{r.status}</Tag>
                      </td>
                      <td className="r">{r.exceptions.length}</td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      No reconciliation runs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {runOpen && (
        <Modal
          open
          onClose={() => setRunOpen(false)}
          title="Run Reconciliation"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRunOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={runNow}>
                Run
              </button>
            </>
          }
        >
          <Field label="Channel">
            <Select value={runChannel} onChange={(e) => setRunChannel(e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date (defaults to today)">
            <input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
          </Field>
        </Modal>
      )}

      {run != null && (
        <Modal open onClose={() => setDetailId(null)} title={`Reconciliation — ${run.channel_code} · ${shortDate(run.run_date)}`} footer={<button className="btn btn-ghost" onClick={() => setDetailId(null)}>Close</button>}>
          <KV label="Platform total">
            <span className="num">{money2(run.total_platform)}</span>
          </KV>
          <KV label="Bank total">
            <span className="num">{money2(run.total_bank)}</span>
          </KV>
          <KV label="Status">
            <Tag variant={run.status === 'BALANCED' ? 'ok' : run.status === 'EXCEPTIONS' ? 'bad' : 'neutral'}>{run.status}</Tag>
          </KV>
          <h3 style={{ margin: '16px 0 8px' }}>Exceptions ({run.exceptions.length})</h3>
          {run.exceptions.length === 0 ? (
            <div className="empty">Nothing outstanding — every transaction matched</div>
          ) : (
            run.exceptions.map((ex) => (
              <KV key={ex.id} label={ex.bank_txn_ref}>
                <span className="num">{money2(ex.amount)}</span>
              </KV>
            ))
          )}
        </Modal>
      )}
    </>
  );
}
