import { apiClient, errorMessage } from '@acrev360/api';
import { NumCell, Pagination, TableWrap, Tag, money } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { agentCodeLookup, useAgents } from '../../lib/agents';
import { useWards, wardNameLookup } from '../../lib/wards';

const STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', FAULTY: 'bad', RETIRED: 'neutral' };

export function TerminalsPage() {
  const [page, setPage] = useState(1);
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);
  const { data: agents } = useAgents();
  const agentCode = agentCodeLookup(agents);
  const { data, isLoading, error } = useQuery({
    queryKey: ['terminals', page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/terminals', { params: { query: { page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  return (
    <div className="card">
      <TableWrap>
        {isLoading ? (
          <div className="empty">Loading…</div>
        ) : error ? (
          <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load terminals'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Terminal ID</th>
                <th>Bank TID</th>
                <th>Agent</th>
                <th>Ward</th>
                <th className="r">Collected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data && data.results.length > 0 ? (
                data.results.map((t) => (
                  <tr key={t.id}>
                    <NumCell>{t.terminal_id}</NumCell>
                    <NumCell>{t.bank_terminal_id || '—'}</NumCell>
                    <NumCell>{agentCode(t.agent)}</NumCell>
                    <td>{wardName(t.ward)}</td>
                    <NumCell className="r">{money(t.collected)}</NumCell>
                    <td>
                      <Tag variant={STATUS_TAG[t.status] ?? 'neutral'}>{t.status}</Tag>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
                    No terminals deployed
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableWrap>
      {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
    </div>
  );
}
