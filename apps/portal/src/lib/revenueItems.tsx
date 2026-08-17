import { apiClient, errorMessage } from '@acrev360/api';
import type { GroupedItem } from '@acrev360/ui';
import { money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

export const REVENUE_CATEGORY_ORDER = ['Rates', 'Licences and Permits', 'Fees and Charges', 'Registration and Professional Fees', 'Levies'];

export function useRevenueItems() {
  return useQuery({
    queryKey: ['revenue-items'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/revenue-items', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results.filter((i) => i.is_active);
    },
    staleTime: 60_000,
  });
}

export interface RevenueItemPickerItem extends GroupedItem {
  rateAmount: string;
}

export function toGroupedItems(items: { id: number; category_name: string; harmonised_code: string; item_name: string; current_rate: string }[]): RevenueItemPickerItem[] {
  return items.map((i) => ({
    id: i.id,
    groupLabel: i.category_name,
    searchText: `${i.harmonised_code} — ${i.item_name} (${money(i.current_rate)})`,
    render: (
      <>
        {i.harmonised_code} — {i.item_name} ({money(i.current_rate)})
      </>
    ),
    rateAmount: i.current_rate,
  }));
}
