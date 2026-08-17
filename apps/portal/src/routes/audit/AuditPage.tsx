import { apiClient, errorMessage } from '@acrev360/api';
import { NumCell, TableWrap, dateTime } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

export function AuditPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/audit', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  return (
    <div className="card">
      <TableWrap>
        {isLoading ? (
          <div className="empty">Loading…</div>
        ) : error ? (
          <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load the audit log'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((a) => (
                  <tr key={a.id}>
                    <NumCell>{dateTime(a.created_at)}</NumCell>
                    <td>{a.actor_username || '—'}</td>
                    <td>
                      <span className="tag tag-brass">{a.action}</span>
                    </td>
                    <NumCell>
                      {a.entity_type} #{a.entity_id}
                    </NumCell>
                    <NumCell>{a.actor_ip || '—'}</NumCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty">
                    No audit events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableWrap>
    </div>
  );
}
