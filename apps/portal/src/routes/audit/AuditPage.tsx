import { apiClient, errorMessage } from '@acrev360/api';
import { NumCell, Pagination, TableWrap, dateTime } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function AuditPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', q, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/audit', { params: { query: { q: q || undefined, page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by user, action or entity type…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
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
                {data && data.results.length > 0 ? (
                  data.results.map((a) => (
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
                      {q ? 'No audit events match' : 'No audit events yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>
    </>
  );
}
