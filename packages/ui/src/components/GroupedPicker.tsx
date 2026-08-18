import { useEffect, useMemo, useState } from 'react';
import './GroupedPicker.css';

export interface GroupedItem {
  id: number;
  groupLabel: string;
  searchText: string;
  render: React.ReactNode;
}

function groupAndOrder<T extends GroupedItem>(items: T[], groupOrder?: string[]): [string, T[]][] {
  const byGroup = new Map<string, T[]>();
  for (const item of items) {
    const list = byGroup.get(item.groupLabel) ?? [];
    list.push(item);
    byGroup.set(item.groupLabel, list);
  }
  const groups = [...byGroup.keys()].sort((a, b) => {
    const ia = groupOrder?.indexOf(a) ?? -1;
    const ib = groupOrder?.indexOf(b) ?? -1;
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return groups.map((g) => [g, byGroup.get(g)!]);
}

export interface GroupedChecklistProps<T extends GroupedItem> {
  items: T[];
  groupOrder?: string[];
  selected: Set<T['id']>;
  onToggle: (id: T['id']) => void;
  filterPlaceholder?: string;
}

/** Grouped, filterable checklist — the pattern used for enumeration's
 * "revenue items liable" picker. Grouping by category with a live filter
 * instead of one flat list is a deliberate fix carried forward from the
 * prototype's own UX audit (finding a single item in ~40 unrelated ones was
 * the original complaint). */
export function GroupedChecklist<T extends GroupedItem>({
  items,
  groupOrder,
  selected,
  onToggle,
  filterPlaceholder = 'Filter by name or code…',
}: GroupedChecklistProps<T>) {
  const [filter, setFilter] = useState('');
  const groups = useMemo(() => groupAndOrder(items, groupOrder), [items, groupOrder]);
  const q = filter.trim().toLowerCase();

  return (
    <div>
      <input className="grouped-picker-filter" placeholder={filterPlaceholder} value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="grouped-picker-box">
        {groups.map(([group, groupItems]) => {
          const visible = q ? groupItems.filter((it) => it.searchText.toLowerCase().includes(q)) : groupItems;
          if (visible.length === 0) return null;
          return (
            <div key={group}>
              <div className="item-group-label">{group}</div>
              {visible.map((item) => (
                <label key={item.id} className="grouped-picker-row">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id)} />
                  {item.render}
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface GroupedSelectProps<T extends GroupedItem> {
  items: T[];
  groupOrder?: string[];
  value: number | '';
  onChange: (id: number) => void;
}

/** Same grouping as GroupedChecklist, expressed as native <optgroup>s — used
 * where a single selection makes more sense than a checklist (e.g. adding
 * one line to a bill). */
export function GroupedSelect<T extends GroupedItem>({ items, groupOrder, value, onChange }: GroupedSelectProps<T>) {
  const groups = useMemo(() => groupAndOrder(items, groupOrder), [items, groupOrder]);

  // A <select> with no option matching its `value` falls back to displaying
  // the first option anyway (native browser behavior) — but the caller's
  // state stays at '' since nothing ever fired onChange. That silently
  // desyncs "what's shown" from "what Add will actually submit", which
  // surfaced live as an Add button stuck disabled despite an item visibly
  // showing selected. Auto-select the first real item as soon as one's
  // available, so the two can never drift apart.
  useEffect(() => {
    if (value === '' && items.length > 0) onChange(items[0].id);
  }, [value, items, onChange]);

  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {groups.map(([group, groupItems]) => (
        <optgroup key={group} label={group}>
          {groupItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.searchText}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
