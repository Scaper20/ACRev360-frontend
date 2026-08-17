import { apiClient, errorMessage } from '@acrev360/api';
import { useQuery } from '@tanstack/react-query';

export function useWards() {
  return useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/wards', { params: { query: { page: undefined } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
    staleTime: 5 * 60_000, // wards change rarely
  });
}

export function wardNameLookup(wards: { id: number; ward_name: string }[] | undefined) {
  const map = new Map<number, string>();
  wards?.forEach((w) => map.set(w.id, w.ward_name));
  return (id: number | null | undefined) => (id != null ? (map.get(id) ?? `Ward #${id}`) : '—');
}
