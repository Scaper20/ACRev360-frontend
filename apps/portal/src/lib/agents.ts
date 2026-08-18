import { apiClient, errorMessage } from '@acrev360/api';
import { useQuery } from '@tanstack/react-query';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/agents', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });
}

export function agentCodeLookup(agents: { id: number; agent_code: string }[] | undefined) {
  const map = new Map<number, string>();
  agents?.forEach((a) => map.set(a.id, a.agent_code));
  return (id: number | null | undefined) => (id != null ? (map.get(id) ?? `Agent #${id}`) : '—');
}
