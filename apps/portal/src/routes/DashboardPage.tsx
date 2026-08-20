import { apiClient, errorMessage } from '@acrev360/api';
import type { TagVariant } from '@acrev360/ui';
import { BarList, Card, FlowChart, KV, Notice, StatCard, Tag, TrendChart, money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';

const CONSULTANT_STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', SUSPENDED: 'bad', EXITED: 'neutral', PENDING: 'warn' };

// Reconciled against the real design tokens (packages/ui/src/tokens.css) —
// POS/OTC/IB_MB already matched --green-700/--brass/--teal exactly; USSD and
// FIRSTMONIE previously pointed at leftover mobile-palette hex that isn't in
// this system's palette at all. Using --green-900 and --ink-60 instead keeps
// every channel color inside the verified token set.
const CHANNEL_COLORS: Record<string, string> = {
  POS: 'var(--green-700)',
  OTC: 'var(--brass)',
  IB_MB: 'var(--teal)',
  USSD: 'var(--green-900)',
  FIRSTMONIE: 'var(--ink-60)',
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/dashboard/summary');
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  if (isLoading) return <div className="empty">Loading…</div>;
  if (error) return <Notice variant="bad">{error instanceof Error ? error.message : 'Failed to load dashboard'}</Notice>;
  if (!data) return null;

  return (
    <>
      {user?.access_level === 'CONSULTANT' && user.consultant_name != null && (
        <Card style={{ marginBottom: 16 }}>
          <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>{user.consultant_name}</h3>
              <div style={{ color: 'var(--ink-60)', fontSize: 13, marginTop: 2 }}>
                {user.consultant_commission_rate}% commission — the figures below are your own portfolio only
              </div>
            </div>
            {user.consultant_status != null && (
              <Tag variant={CONSULTANT_STATUS_TAG[user.consultant_status] ?? 'neutral'}>{user.consultant_status}</Tag>
            )}
          </div>
        </Card>
      )}
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <StatCard label="Total Billed" value={money(data.billed)} delta={`${data.bills} bills issued`} />
        <StatCard
          label="Total Collected"
          value={money(data.collected)}
          delta={`${Number(data.billed) ? Math.round((Number(data.collected) / Number(data.billed)) * 100) : 0}% of billed`}
          accent="accent"
        />
        <StatCard label="Outstanding" value={money(data.outstanding)} delta={`${data.assessments} assessments`} accent="info" />
        <StatCard label="Registered Payers" value={data.payers.toLocaleString()} delta={`${data.active_agents} active field agents`} />
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <Card>
          <h3>Collections by e-Channel</h3>
          <FlowChart
            emptyLabel="No confirmed payments yet"
            segments={data.by_channel.map((c) => ({
              key: c.code,
              label: c.label,
              amount: Number(c.amount),
              color: CHANNEL_COLORS[c.code] ?? 'var(--ink-40)',
            }))}
          />
        </Card>
        <Card>
          <h3>Collections — last 14 days</h3>
          <TrendChart points={data.trend.map((t) => ({ date: t.d, amount: Number(t.amount) }))} />
        </Card>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <h3>Top Revenue Items by Amount Billed</h3>
        <BarList
          emptyLabel="No billing activity yet"
          rows={data.by_item.map((i, idx) => ({ key: idx, label: i.item_name, value: Number(i.billed) }))}
        />
      </Card>
      <Card>
        <h3>Bills by Status</h3>
        {data.bills_by_status.length === 0 ? (
          <div className="empty">No bills issued yet</div>
        ) : (
          data.bills_by_status.map((row) => (
            <KV key={row.status} label={row.status}>
              {row.count}
            </KV>
          ))
        )}
      </Card>
    </>
  );
}
