import { apiClient, errorMessage } from '@acrev360/api';
import { Card, KV, Notice, money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

export function GlobalPerformancePage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard', 'global'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/dashboard/global');
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  if (isLoading) return <div className="empty">Loading…</div>;
  if (error) return <Notice variant="bad">{error instanceof Error ? error.message : 'Failed to load global performance'}</Notice>;
  if (!data) return null;

  return (
    <div className="grid g2">
      <Card>
        <h3>Collections by Sub-Consultant</h3>
        {data.by_consultant.length === 0 ? (
          <div className="empty">No collections yet</div>
        ) : (
          data.by_consultant.map((row) => (
            <KV key={row.consultant_name} label={row.consultant_name}>
              <span className="num">{money(row.collected)}</span>
            </KV>
          ))
        )}
      </Card>
      <Card>
        <h3>Collections by Ward</h3>
        {data.by_ward.length === 0 ? (
          <div className="empty">No collections yet</div>
        ) : (
          data.by_ward.map((row) => (
            <KV key={row.ward_name} label={row.ward_name}>
              <span className="num">{money(row.collected)}</span>
            </KV>
          ))
        )}
      </Card>
    </div>
  );
}
