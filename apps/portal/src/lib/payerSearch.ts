import { apiClient, errorMessage } from '@acrev360/api';

export async function searchPayers(q: string) {
  const { data, error } = await apiClient.GET('/api/v1/payers', { params: { query: { q } } });
  if (error) throw new Error(errorMessage(error));
  return data.results;
}
