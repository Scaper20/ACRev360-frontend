import { apiClient, errorMessage, REVENUE_CATEGORY_ORDER } from '@acrev360/api';
import { ClickableRow, Field, Input, Modal, NumCell, Tag, TableWrap, money, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRevenueItems } from '../../lib/revenueItems';
import { RateBandsEditor } from './RateBandsEditor';

type SortKey = 'name' | 'code' | 'category' | 'rate';
const PRICING_OPTIONS = [
  { value: '', label: 'All pricing' },
  { value: 'flat', label: 'Flat' },
  { value: 'banded', label: 'Banded' },
];

export function RevenueItemsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const { data, isLoading, error } = useRevenueItems();
  const [rateItemId, setRateItemId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const toast = useToast();
  const queryClient = useQueryClient();

  // All ~100 items load in one shot (useRevenueItems has no pagination) so
  // search/sort/filter run client-side over the already-fetched list rather
  // than round-tripping to the server per keystroke, unlike the paginated
  // list pages (Bills, Payers) that filter via query params.
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('category');

  const filteredSorted = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const filtered = data.filter((i) => {
      if (needle && !i.item_name.toLowerCase().includes(needle) && !i.harmonised_code.toLowerCase().includes(needle)) return false;
      if (categoryFilter && i.category_name !== categoryFilter) return false;
      if (pricingFilter === 'flat' && i.rate_bands.length > 0) return false;
      if (pricingFilter === 'banded' && i.rate_bands.length === 0) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.item_name.localeCompare(b.item_name);
        case 'code':
          return a.harmonised_code.localeCompare(b.harmonised_code);
        case 'rate':
          return Number(a.current_rate) - Number(b.current_rate);
        case 'category':
        default: {
          const ai = REVENUE_CATEGORY_ORDER.indexOf(a.category_name);
          const bi = REVENUE_CATEGORY_ORDER.indexOf(b.category_name);
          return (ai === -1 ? REVENUE_CATEGORY_ORDER.length : ai) - (bi === -1 ? REVENUE_CATEGORY_ORDER.length : bi) || a.item_name.localeCompare(b.item_name);
        }
      }
    });
    return sorted;
  }, [data, q, categoryFilter, pricingFilter, sortKey]);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/departments', { params: { query: { page: undefined } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  const item = data?.find((i) => i.id === rateItemId);

  // Re-sync the department picker to whatever's actually on the item every
  // time the detail modal opens for a (possibly different) one.
  useEffect(() => {
    setDepartmentId(item?.department ?? '');
  }, [item?.id]);

  async function changeRate() {
    if (!rateItemId || !newRate) return;
    try {
      const { error } = await apiClient.POST('/api/v1/revenue-items/{id}/rate', { params: { path: { id: String(rateItemId) } }, body: { rate_amount: newRate } });
      if (error) throw new Error(errorMessage(error));
      toast('Rate updated');
      setRateItemId(null);
      setNewRate('');
      await queryClient.invalidateQueries({ queryKey: ['revenue-items'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change rate', true);
    }
  }

  async function saveDepartment() {
    if (!rateItemId) return;
    try {
      const { error } = await apiClient.POST('/api/v1/revenue-items/{id}/department', {
        params: { path: { id: String(rateItemId) } },
        body: { department_id: departmentId === '' ? null : departmentId },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Department updated');
      await queryClient.invalidateQueries({ queryKey: ['revenue-items'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update department', true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by item name or code…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {REVENUE_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={pricingFilter} onChange={(e) => setPricingFilter(e.target.value)}>
          {PRICING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="category">Sort: Category</option>
          <option value="name">Sort: Name</option>
          <option value="code">Sort: Code</option>
          <option value="rate">Sort: Rate</option>
        </select>
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load revenue items'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th className="r">Current Rate</th>
                  <th>Pricing</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      {q || categoryFilter || pricingFilter ? 'No revenue items match' : 'No revenue items'}
                    </td>
                  </tr>
                )}
                {filteredSorted.map((i) => {
                  const banded = i.rate_bands.length > 0;
                  const pricing = banded ? (
                    <Tag variant="brass">{i.rate_bands.length} band{i.rate_bands.length === 1 ? '' : 's'}</Tag>
                  ) : (
                    <Tag variant="neutral">Flat</Tag>
                  );
                  return isAdmin ? (
                    <ClickableRow key={i.id} onClick={() => { setRateItemId(i.id); setNewRate(i.current_rate); }}>
                      <NumCell>{i.harmonised_code}</NumCell>
                      <td>{i.item_name}</td>
                      <td>{i.category_name}</td>
                      <td>{i.department_name || '—'}</td>
                      <NumCell className="r">{banded ? '—' : money(i.current_rate)}</NumCell>
                      <td>{pricing}</td>
                    </ClickableRow>
                  ) : (
                    <tr key={i.id}>
                      <NumCell>{i.harmonised_code}</NumCell>
                      <td>{i.item_name}</td>
                      <td>{i.category_name}</td>
                      <td>{i.department_name || '—'}</td>
                      <NumCell className="r">{banded ? '—' : money(i.current_rate)}</NumCell>
                      <td>{pricing}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {item != null && (
        <Modal
          open
          onClose={() => setRateItemId(null)}
          title={item.item_name}
          footer={
            <button className="btn btn-ghost" onClick={() => setRateItemId(null)}>
              Close
            </button>
          }
        >
          <h3 style={{ margin: '0 0 6px' }}>Flat Rate</h3>
          <p style={{ fontSize: 12.5, color: 'var(--ink-60)', marginBottom: 12 }}>
            {item.rate_bands.length > 0
              ? 'This item is priced by the bands below — the flat rate has no effect while bands are active.'
              : `Current rate is ${money(item.current_rate)}. Changing it closes the current rate-history row and opens a new one — past assessments keep citing the rate they were priced at.`}
          </p>
          <div className="row" style={{ alignItems: 'end' }}>
            <Field label="New rate (₦)">
              <Input type="number" min={0} step={0.01} value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </Field>
            <button className="btn btn-primary" onClick={changeRate} style={{ maxWidth: 140 }}>
              Save Flat Rate
            </button>
          </div>

          <RateBandsEditor
            itemId={item.id}
            existingBands={item.rate_bands}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['revenue-items'] })}
          />

          <h3 style={{ margin: '18px 0 6px' }}>Department</h3>
          <div className="row" style={{ alignItems: 'end' }}>
            <Field label="Administered by">
              <select value={departmentId} onChange={(e) => setDepartmentId(Number(e.target.value) || '')}>
                <option value="">— None —</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </Field>
            <button className="btn btn-ghost" onClick={saveDepartment} style={{ maxWidth: 140 }}>
              Save Department
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
