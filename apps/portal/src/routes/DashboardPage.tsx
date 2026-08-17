import { apiClient, errorMessage } from '@acrev360/api';
import { Card, KV, Notice, StatCard } from '@acrev360/ui';
import { money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

export function DashboardPage() {
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
    <div className="grid g3" style={{ marginBottom: 16 }}>
      <StatCard label="Total Billed" value={money(data.billed)} accent="accent" />
      <StatCard label="Total Collected" value={money(data.collected)} />
      <StatCard label="Outstanding" value={money(data.outstanding)} accent="info" />
      <div style={{ gridColumn: '1 / -1' }}>
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
      </div>
    </div>
  );
}
