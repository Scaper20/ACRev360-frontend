import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Card, ClickableRow, Field, KV, Modal, NumCell, Pagination, Select, StatCard, TableWrap, Tag, dateTime, money2, shortDate, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const CHANNELS = ['POS', 'OTC', 'IB_MB', 'USSD', 'FIRSTMONIE', 'CASH'];
// Always-on view (Article 8) — refreshes on load, on this interval, and on
// the manual button; distinct from the per-channel/per-date "Run" below,
// which stays exactly as-is for auditing a specific past day.
const LIVE_REFRESH_MS = 60_000;

// Reconciliation is "full access" for COUNCIL_IGR_HEAD and COUNCIL_TREASURY
// too, not just COUNCIL_ADMIN — see FRONTEND_HANDOFF_RBAC's role table.
const CAN_RUN_RECONCILIATION = new Set(['COUNCIL_ADMIN', 'COUNCIL_IGR_HEAD', 'COUNCIL_TREASURY']);

export function ReconciliationPage() {
  const { user } = useAuth();
  const isAdmin = user != null && CAN_RUN_RECONCILIATION.has(user.access_level);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runDate, setRunDate] = useState('');
  const [runChannel, setRunChannel] = useState(CHANNELS[0]);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reconciliation', page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/reconciliation', { params: { query: { page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  // Always-current view (Article 8) — computed live on every call, no manual
  // "Run" needed. Refreshes on load, every LIVE_REFRESH_MS, and on demand.
  const liveQuery = useQuery({
    queryKey: ['reconciliation', 'live-summary'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/reconciliation/live-summary');
      if (error) throw new Error(errorMessage(error));
      return data;
    },
    refetchInterval: LIVE_REFRESH_MS,
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

  const run = data?.results.find((r) => r.id === detailId);

  return (
    <>
      <div className="toolbar">
        <h3 style={{ marginBottom: 0, flex: 1 }}>Live Position</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => liveQuery.refetch()} disabled={liveQuery.isFetching}>
          {liveQuery.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {liveQuery.error ? (
        <div className="notice notice-bad" style={{ marginBottom: 16 }}>
          {liveQuery.error instanceof Error ? liveQuery.error.message : 'Failed to load live reconciliation summary'}
        </div>
      ) : (
        <div className="row" style={{ marginBottom: 16 }}>
          <StatCard label="Confirmed payments (platform)" value={liveQuery.data ? money2(liveQuery.data.total_platform) : '—'} />
          <StatCard label="Bank-reported credits" value={liveQuery.data ? money2(liveQuery.data.total_bank) : '—'} />
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <h3>Unmatched Bank Credits</h3>
        <TableWrap>
          {liveQuery.isLoading ? (
            <div className="empty">Loading…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bank Ref</th>
                  <th>Channel</th>
                  <th>Received</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {liveQuery.data && liveQuery.data.unmatched_credits.length > 0 ? (
                  liveQuery.data.unmatched_credits.map((c) => (
                    <tr key={c.id}>
                      <NumCell>{c.bank_txn_ref}</NumCell>
                      <td>{c.channel_code}</td>
                      <NumCell>{dateTime(c.received_at)}</NumCell>
                      <NumCell className="r">{money2(c.amount)}</NumCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      Nothing unmatched — all clean
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>

      {isAdmin && (
        <div className="toolbar">
          <div className="grow" />
          <Button variant="primary" onClick={() => setRunOpen(true)}>
            Run Reconciliation
          </Button>
        </div>
      )}
      <Card style={{ marginBottom: 16 }}>
        <h3>Recent Runs</h3>
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
                {data && data.results.length > 0 ? (
                  data.results.map((r) => (
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
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </Card>

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
