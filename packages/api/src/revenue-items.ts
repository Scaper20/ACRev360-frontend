/** Shared between apps/portal and apps/field — both show a revenue-item
 * checklist grouped by category, and both need the same banded-item
 * exclusion-from-flat-display rule (a banded item's own current_rate is a
 * stale leftover from before it was banded — see toGroupedItems below). Pure
 * data shaping only; each app wires its own fetching (portal via TanStack
 * Query, field via a plain apiClient call — see each app's own lib). */
export const REVENUE_CATEGORY_ORDER = ['Rates', 'Licences and Permits', 'Fees and Charges', 'Registration and Professional Fees', 'Levies'];

export interface GroupableRevenueItem {
  id: number;
  category_name: string;
  harmonised_code: string;
  item_name: string;
  current_rate: string;
  rate_bands?: { id: number }[];
}

export interface RevenueItemPickerItem {
  id: number;
  groupLabel: string;
  searchText: string;
  harmonisedCode: string;
  itemName: string;
  priceLabel: string;
  isBanded: boolean;
}

/** A banded item's own current_rate is a stale leftover from before it was
 * banded (replace_rate_bands never touches the plain RateSchedule row) — it
 * no longer reflects what the item actually costs, so showing it as a flat
 * price would be actively misleading. Marks isBanded so callers that can
 * only take a flat rate (a simple checklist, not a full bill screen) can
 * exclude these rather than mis-price them. */
export function toGroupedItems(items: GroupableRevenueItem[]): RevenueItemPickerItem[] {
  return items.map((i) => {
    const bandCount = i.rate_bands?.length ?? 0;
    const isBanded = bandCount > 0;
    const priceLabel = isBanded ? `${bandCount} band${bandCount === 1 ? '' : 's'}` : i.current_rate;
    return {
      id: i.id,
      groupLabel: i.category_name,
      searchText: `${i.harmonised_code} — ${i.item_name}`,
      harmonisedCode: i.harmonised_code,
      itemName: i.item_name,
      priceLabel,
      isBanded,
    };
  });
}
