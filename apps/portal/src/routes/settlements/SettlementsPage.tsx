import { apiClient, errorMessage } from '@acrev360/api';
import type { TagVariant } from '@acrev360/ui';
import { Button, ClickableRow, Field, KV, Modal, NumCell, Pagination, Tag, money2, shortDate, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const LADDER = ['COMPUTED', 'APPROVED', 'SETTLED'] as const;
const TAG_FOR: Record<string, TagVariant> = { COMPUTED: 'brass', APPROVED: 'warn', SETTLED: 'ok', DISPUTED: 'bad' };

export function SettlementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [computeOpen, setComputeOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['settlements', page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/settlements', { params: { query: { page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  async function compute() {
    if (!periodEnd) {
      toast('Choose a period end date', true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/settlements/compute', { body: { period_start: periodStart || undefined, period_end: periodEnd } });
      if (error) throw new Error(errorMessage(error));
      toast('Settlements computed');
      setComputeOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['settlements'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not compute settlements', true);
    }
  }

  async function advance(id: number, current: string) {
    const idx = LADDER.indexOf(current as (typeof LADDER)[number]);
    const next = LADDER[Math.min(idx + 1, LADDER.length - 1)];
    try {
      const { error } = await apiClient.POST('/api/v1/settlements/{id}/status_change', { params: { path: { id: String(id) } }, body: { status: next } });
      if (error) throw new Error(errorMessage(error));
      toast(`Advanced to ${next}`);
      await queryClient.invalidateQueries({ queryKey: ['settlements'] });
      setDetailId(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not advance status', true);
    }
  }

  const settlement = data?.results.find((s) => s.id === detailId);

  return (
    <>
      {isAdmin && (
        <div className="toolbar">
          <div className="grow" />
          <Button variant="primary" onClick={() => setComputeOpen(true)}>
            Compute Settlements
          </Button>
        </div>
      )}
      <div className="card">
        <div className="table-wrap">
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load settlements'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Consultant</th>
                  <th>Period</th>
                  <th className="r">Gross Collections</th>
                  <th className="r">Rate</th>
                  <th className="r">Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((s) => (
                    <ClickableRow key={s.id} onClick={() => setDetailId(s.id)}>
                      <td>{s.consultant_name}</td>
                      <NumCell>
                        {shortDate(s.period_start)} – {shortDate(s.period_end)}
                      </NumCell>
                      <NumCell className="r">{money2(s.gross_collections)}</NumCell>
                      <NumCell className="r">{s.commission_rate}%</NumCell>
                      <NumCell className="r">{money2(s.commission_amount)}</NumCell>
                      <td>
                        <Tag variant={TAG_FOR[s.status] ?? 'neutral'}>{s.status}</Tag>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      No settlements computed yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {computeOpen && (
        <Modal
          open
          onClose={() => setComputeOpen(false)}
          title="Compute Settlements"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setComputeOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={compute}>
                Compute
              </button>
            </>
          }
        >
          <Field label="Period start (optional)">
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </Field>
          <Field label="Period end">
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </Field>
        </Modal>
      )}

      {settlement != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={settlement.consultant_name}
          footer={
            <>
              {isAdmin && settlement.status !== 'SETTLED' && settlement.status !== 'DISPUTED' && (
                <button className="btn btn-brass" onClick={() => advance(settlement.id, settlement.status)}>
                  Advance to {LADDER[Math.min(LADDER.indexOf(settlement.status as (typeof LADDER)[number]) + 1, LADDER.length - 1)]}
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Close
              </button>
            </>
          }
        >
          <KV label="Period">
            {shortDate(settlement.period_start)} – {shortDate(settlement.period_end)}
          </KV>
          <KV label="Gross collections">
            <span className="num">{money2(settlement.gross_collections)}</span>
          </KV>
          <KV label="Commission rate">{settlement.commission_rate}%</KV>
          <KV label="Commission amount">
            <span className="num">{money2(settlement.commission_amount)}</span>
          </KV>
          <KV label="Status">
            <Tag variant={TAG_FOR[settlement.status] ?? 'neutral'}>{settlement.status}</Tag>
          </KV>
        </Modal>
      )}
    </>
  );
}
