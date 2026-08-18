import { apiClient, errorMessage } from '@acrev360/api';
import { Card, NumCell, Notice, Tag, TableWrap, money } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

const STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', SUSPENDED: 'bad', EXITED: 'neutral', PENDING: 'warn' };

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
    <>
      <Card style={{ marginBottom: 16 }}>
        <h3>Sub-Consultant Performance</h3>
        <TableWrap>
          {data.by_consultant.length === 0 ? (
            <div className="empty">No consultants</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Consultant</th>
                  <th className="r">Billed</th>
                  <th className="r">Collected</th>
                  <th className="r">Collection Rate</th>
                  <th className="r">Commission Accrued</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.by_consultant.map((c) => (
                  <tr key={c.consultant_name}>
                    <td>{c.consultant_name}</td>
                    <NumCell className="r">{money(c.billed)}</NumCell>
                    <NumCell className="r">{money(c.collected)}</NumCell>
                    <NumCell className="r">{c.collection_rate != null ? `${c.collection_rate}%` : '—'}</NumCell>
                    <NumCell className="r">{money(c.commission_accrued)}</NumCell>
                    <td>{c.status != null ? <Tag variant={STATUS_TAG[c.status] ?? 'neutral'}>{c.status}</Tag> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>
      <Card>
        <h3>Collections by Ward</h3>
        <TableWrap>
          {data.by_ward.length === 0 ? (
            <div className="empty">No ward data</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ward</th>
                  <th className="r">Payers</th>
                  <th className="r">Collected</th>
                </tr>
              </thead>
              <tbody>
                {data.by_ward.map((w) => (
                  <tr key={w.ward_name}>
                    <td>{w.ward_name}</td>
                    <NumCell className="r">{w.payers}</NumCell>
                    <NumCell className="r">{money(w.collected)}</NumCell>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>
    </>
  );
}
