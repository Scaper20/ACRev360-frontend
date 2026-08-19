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

interface GroupableRevenueItem {
  id: number;
  category_name: string;
  harmonised_code: string;
  item_name: string;
  current_rate: string;
  rate_bands?: { id: number }[];
}

/** A banded item's own current_rate is a stale leftover from before it was
 * banded (replace_rate_bands never touches the plain RateSchedule row) — it
 * no longer reflects what the item actually costs, so showing it here would
 * be actively misleading. Show the band count instead; the picker that
 * consumes this (RevenueItemLinePicker) resolves the real price once a band
 * is chosen. */
export function toGroupedItems(items: GroupableRevenueItem[]): RevenueItemPickerItem[] {
  return items.map((i) => {
    const bandCount = i.rate_bands?.length ?? 0;
    const priceLabel = bandCount > 0 ? `${bandCount} band${bandCount === 1 ? '' : 's'}` : money(i.current_rate);
    return {
      id: i.id,
      groupLabel: i.category_name,
      searchText: `${i.harmonised_code} — ${i.item_name} (${priceLabel})`,
      render: (
        <>
          {i.harmonised_code} — {i.item_name} ({priceLabel})
        </>
      ),
      rateAmount: i.current_rate,
    };
  });
}
