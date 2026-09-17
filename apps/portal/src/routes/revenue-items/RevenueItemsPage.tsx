import { apiClient, errorMessage, REVENUE_CATEGORY_ORDER } from '@acrev360/api';
import { Button, ClickableRow, Field, Input, Modal, NumCell, Tag, TableWrap, money, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRevenueItems } from '../../lib/revenueItems';
import { AddRevenueItemModal } from './AddRevenueItemModal';
import { RateBandsEditor } from './RateBandsEditor';

type SortKey = 'name' | 'code' | 'category' | 'department' | 'rate';
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
  const [addOpen, setAddOpen] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  // All ~100 items load in one shot (useRevenueItems has no pagination) so
  // search/sort/filter run client-side over the already-fetched list rather
  // than round-tripping to the server per keystroke, unlike the paginated
  // list pages (Bills, Payers) that filter via query params.
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('category');

  // Options for the department filter come from what's actually on the
  // loaded items, not the admin-only /departments query — a non-admin can
  // still view this page read-only and needs a working filter too, and this
  // way it never shows a department with zero revenue items in it.
  const NO_DEPARTMENT = ' none';
  const departmentNames = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((i) => i.department_name).filter((n): n is string => !!n))].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredSorted = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const filtered = data.filter((i) => {
      if (needle && !i.item_name.toLowerCase().includes(needle) && !i.harmonised_code.toLowerCase().includes(needle)) return false;
      if (categoryFilter && i.category_name !== categoryFilter) return false;
      if (departmentFilter === NO_DEPARTMENT ? !!i.department_name : departmentFilter && i.department_name !== departmentFilter) return false;
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
        case 'department':
          return (a.department_name || '').localeCompare(b.department_name || '') || a.item_name.localeCompare(b.item_name);
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
  }, [data, q, categoryFilter, departmentFilter, pricingFilter, sortKey]);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/departments', { params: { query: { page: undefined } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['revenue-categories'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/revenue-categories', { params: { query: {} } });
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

  // Retires (is_active: false), not a real delete — matches the backend's
  // own "Only COUNCIL_ADMIN may retire" framing on both the DELETE and
  // .../retire routes. Using .../retire rather than DELETE since it hands
  // back the updated item directly instead of a bare 204, so the modal can
  // close on real confirmed state rather than assuming the request worked.
  async function retireItem() {
    if (!item) return;
    if (!window.confirm(`Retire ${item.item_name} (${item.harmonised_code})? It stops appearing here and can no longer be billed — past bills/assessments are unaffected.`)) return;
    try {
      const { error } = await apiClient.POST('/api/v1/revenue-items/{id}/retire', { params: { path: { id: String(item.id) } } });
      if (error) throw new Error(errorMessage(error));
      toast(`${item.item_name} retired`);
      setRateItemId(null);
      await queryClient.invalidateQueries({ queryKey: ['revenue-items'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not retire revenue item', true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <input className="grow" autoComplete="off" placeholder="Search by item name or code…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={{ maxWidth: 200 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {REVENUE_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select style={{ maxWidth: 200 }} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="">All departments</option>
          <option value={NO_DEPARTMENT}>No department</option>
          {departmentNames.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select style={{ maxWidth: 160 }} value={pricingFilter} onChange={(e) => setPricingFilter(e.target.value)}>
          {PRICING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select style={{ maxWidth: 160 }} value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="category">Sort: Category</option>
          <option value="name">Sort: Name</option>
          <option value="code">Sort: Code</option>
          <option value="department">Sort: Department</option>
          <option value="rate">Sort: Rate</option>
        </select>
        {isAdmin && (
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            + Add Revenue Item
          </Button>
        )}
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
                      {q || categoryFilter || departmentFilter || pricingFilter ? 'No revenue items match' : 'No revenue items'}
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
            <>
              <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={retireItem}>
                Retire
              </button>
              <button className="btn btn-ghost" onClick={() => setRateItemId(null)}>
                Close
              </button>
            </>
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

      {addOpen && <AddRevenueItemModal categories={categories} departments={departments} onClose={() => setAddOpen(false)} />}
    </>
  );
}
