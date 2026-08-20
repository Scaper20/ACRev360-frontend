import type { GroupableRevenueItem } from '@acrev360/api';
import { apiClient, errorMessage, REVENUE_CATEGORY_ORDER, toGroupedItems as toGroupedItemsData } from '@acrev360/api';
import type { GroupedItem } from '@acrev360/ui';
import { money } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';

export { REVENUE_CATEGORY_ORDER };

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
  isBanded: boolean;
}

/** Thin JSX wrapper around the shared, pure @acrev360/api helper — money()
 * formatting and the GroupedItem render shape are portal/UI concerns, so
 * they stay here rather than in the shared package (which has no UI
 * dependency). See toGroupedItemsData's docstring for the banded-item
 * reasoning itself. */
export function toGroupedItems(items: GroupableRevenueItem[]): RevenueItemPickerItem[] {
  return toGroupedItemsData(items).map((i) => {
    const priceLabel = i.isBanded ? i.priceLabel : money(i.priceLabel);
    return {
      id: i.id,
      groupLabel: i.groupLabel,
      searchText: `${i.searchText} (${priceLabel})`,
      render: (
        <>
          {i.harmonisedCode} — {i.itemName} ({priceLabel})
        </>
      ),
      isBanded: i.isBanded,
    };
  });
}
