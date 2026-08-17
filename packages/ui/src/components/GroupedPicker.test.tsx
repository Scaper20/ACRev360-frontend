import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupedChecklist, type GroupedItem } from './GroupedPicker';

const items: GroupedItem[] = [
  { id: 1, groupLabel: 'Levies', searchText: 'Community and Development Levy', render: 'Community and Development Levy' },
  { id: 2, groupLabel: 'Rates', searchText: 'Tenement Rate Collection', render: 'Tenement Rate Collection' },
  { id: 3, groupLabel: 'Rates', searchText: 'Ground Rent', render: 'Ground Rent' },
];

describe('GroupedChecklist', () => {
  it('orders groups per groupOrder, not alphabetically', () => {
    // Alphabetically "Levies" < "Rates"; groupOrder says otherwise.
    render(<GroupedChecklist items={items} groupOrder={['Rates', 'Levies']} selected={new Set<number>()} onToggle={vi.fn()} />);
    const labels = screen.getAllByText(/Rates|Levies/).map((el) => el.textContent);
    expect(labels).toEqual(['Rates', 'Levies']);
  });

  it('filters items by searchText across all groups', () => {
    render(<GroupedChecklist items={items} selected={new Set<number>()} onToggle={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by name or code…'), { target: { value: 'ground' } });
    expect(screen.getByText('Ground Rent')).toBeTruthy();
    expect(screen.queryByText('Tenement Rate Collection')).toBeNull();
    expect(screen.queryByText('Community and Development Levy')).toBeNull();
  });

  it('omits a group entirely once the filter clears every item in it', () => {
    render(<GroupedChecklist items={items} selected={new Set<number>()} onToggle={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by name or code…'), { target: { value: 'ground' } });
    expect(screen.queryByText('Levies')).toBeNull();
  });

  it('reflects the selected set as checked and calls onToggle with the item id', () => {
    const onToggle = vi.fn();
    render(<GroupedChecklist items={items} selected={new Set([2])} onToggle={onToggle} />);
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const tenementBox = checkboxes.find((cb) => cb.closest('label')?.textContent?.includes('Tenement'))!;
    expect(tenementBox.checked).toBe(true);

    const groundBox = checkboxes.find((cb) => cb.closest('label')?.textContent?.includes('Ground'))!;
    expect(groundBox.checked).toBe(false);
    fireEvent.click(groundBox);
    expect(onToggle).toHaveBeenCalledWith(3);
  });
});
