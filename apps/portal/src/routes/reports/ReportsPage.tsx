import { API_BASE_URL, apiClient, authStore, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, Input, NumCell, Pagination, TableWrap, dateTime, money, shortDate, useToast } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRevenueItems } from '../../lib/revenueItems';
import { useWards } from '../../lib/wards';

const REPORT_TYPES = ['PAYERS', 'BILLS', 'SUMMARY'] as const;

const KYC_TAG: Record<string, string> = { VERIFIED: 'ok', FLAGGED: 'bad', PENDING: 'warn' };
const BILL_STATUS_TAG: Record<string, string> = { PAID: 'ok', OVERDUE: 'bad', PART_PAID: 'warn', CANCELLED: 'neutral', SUPERSEDED: 'neutral' };
const BILL_STATUSES = ['ISSUED', 'PART_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'SUPERSEDED'];

// Confirmed live against the qa_council_* RBAC test accounts: GET
// /api/v1/consultants passes for these three roles in addition to
// COUNCIL_ADMIN (COUNCIL_IT gets a 403 on this same list endpoint despite
// passing consultants/{id}/revenue-officers's own separate permission).
const CAN_LIST_CONSULTANTS = new Set(['COUNCIL_ADMIN', 'COUNCIL_IGR_HEAD', 'COUNCIL_TREASURY', 'COUNCIL_AUDITOR']);

function useConsultantOptions() {
  const { user } = useAuth();
  // Reports has no route-level role check of its own and is reachable by
  // direct URL, so skip the guaranteed 403 for anyone who can't list
  // consultants rather than firing it unconditionally.
  return useQuery({
    queryKey: ['consultants'],
    enabled: user != null && CAN_LIST_CONSULTANTS.has(user.access_level),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });
}

const REPORT_TYPE_LABEL: Record<(typeof REPORT_TYPES)[number], string> = {
  PAYERS: 'Payers Report',
  BILLS: 'Bills Report',
  SUMMARY: 'Summary Reports',
};

export function ReportsPage() {
  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>('PAYERS');

  return (
    <>
      <div className="toolbar">
        <div className="row" style={{ gap: 8 }}>
          {REPORT_TYPES.map((t) => (
            <button key={t} className={`btn ${reportType === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setReportType(t)}>
              {REPORT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      {reportType === 'PAYERS' ? <PayersReport /> : reportType === 'BILLS' ? <BillsReport /> : <SummaryReports />}
    </>
  );
}

interface PayerFilters {
  q: string;
  wardId: number | '';
  consultantId: number | '';
  dateFrom: string;
  dateTo: string;
}

const EMPTY_PAYER_FILTERS: PayerFilters = { q: '', wardId: '', consultantId: '', dateFrom: '', dateTo: '' };

function PayersReport() {
  // draft holds what's currently typed/selected; applied is what the query
  // actually runs against. Nothing refetches until "Apply Filters" copies
  // draft into applied — typing a search term or picking a ward no longer
  // hits the backend on every keystroke/change.
  const [draft, setDraft] = useState<PayerFilters>(EMPTY_PAYER_FILTERS);
  const [applied, setApplied] = useState<PayerFilters>(EMPTY_PAYER_FILTERS);
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);

  const { data: wards } = useWards();
  const { data: consultants } = useConsultantOptions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'payers', applied, ordering, page],
    // A bad ordering value or filter combination 400s and never succeeds on
    // retry — see BillsReport's identical setting for the incident this
    // fixes (default retry/backoff delayed a real error long enough to look
    // like "no rows" instead).
    retry: false,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers', {
        params: {
          query: {
            q: applied.q || undefined,
            ward_id: applied.wardId === '' ? undefined : applied.wardId,
            consultant_id: applied.consultantId === '' ? undefined : applied.consultantId,
            date_from: applied.dateFrom || undefined,
            date_to: applied.dateTo || undefined,
            ordering,
            page,
          },
        },
      });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <Field label="Search">
            <Input
              placeholder="Name, reference or phone…"
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </Field>
          <Field label="Ward">
            <select value={draft.wardId} onChange={(e) => setDraft((d) => ({ ...d, wardId: Number(e.target.value) || '' }))}>
              <option value="">— All —</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Onboarded by">
            <select value={draft.consultantId} onChange={(e) => setDraft((d) => ({ ...d, consultantId: Number(e.target.value) || '' }))}>
              <option value="">— All —</option>
              {consultants?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.consultant_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="row" style={{ alignItems: 'end' }}>
          <Field label="Registered from">
            <Input type="date" value={draft.dateFrom} onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))} />
          </Field>
          <Field label="Registered to">
            <Input type="date" value={draft.dateTo} onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))} />
          </Field>
          <Field label="Sort by">
            <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="full_name">Name (A–Z)</option>
              <option value="-full_name">Name (Z–A)</option>
              <option value="payer_ref">Reference</option>
            </select>
          </Field>
          <button className="btn btn-primary" type="button" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load payers'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>KYC</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((p) => (
                    <tr key={p.id}>
                      <NumCell>{p.payer_ref}</NumCell>
                      <td>{p.full_name}</td>
                      <NumCell>{p.phone || '—'}</NumCell>
                      <td>{p.payer_type}</td>
                      <td>
                        <span className={`tag tag-${KYC_TAG[p.kyc_status] ?? 'neutral'}`}>{p.kyc_status}</span>
                      </td>
                      <NumCell>{dateTime(p.created_at)}</NumCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty">
                      No payers match this selection
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>
    </>
  );
}

interface BillFilters {
  q: string;
  status: string;
  wardId: number | '';
  consultantId: number | '';
  revenueItemId: number | '';
  dateFrom: string;
  dateTo: string;
  valueMin: string;
  valueMax: string;
}

const EMPTY_BILL_FILTERS: BillFilters = {
  q: '',
  status: '',
  wardId: '',
  consultantId: '',
  revenueItemId: '',
  dateFrom: '',
  dateTo: '',
  valueMin: '',
  valueMax: '',
};

function BillsReport() {
  // Same draft/applied split as PayersReport — see its comment.
  const [draft, setDraft] = useState<BillFilters>(EMPTY_BILL_FILTERS);
  const [applied, setApplied] = useState<BillFilters>(EMPTY_BILL_FILTERS);
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const toast = useToast();

  const { data: wards } = useWards();
  const { data: consultants } = useConsultantOptions();
  const { data: revenueItems } = useRevenueItems();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'bills', applied, ordering, page],
    // See PayersReport's identical setting — a rejected filter combination
    // never succeeds on retry.
    retry: false,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bills', {
        params: {
          query: {
            q: applied.q || undefined,
            status: (applied.status || undefined) as components['schemas']['StatusE25Enum'] | undefined,
            ward_id: applied.wardId === '' ? undefined : applied.wardId,
            consultant_id: applied.consultantId === '' ? undefined : applied.consultantId,
            revenue_item_id: applied.revenueItemId === '' ? undefined : applied.revenueItemId,
            date_from: applied.dateFrom || undefined,
            date_to: applied.dateTo || undefined,
            value_min: applied.valueMin ? Number(applied.valueMin) : undefined,
            value_max: applied.valueMax ? Number(applied.valueMax) : undefined,
            ordering,
            page,
          },
        },
      });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function applyFilters() {
    // Validated here, before committing to `applied`, so an invalid
    // combination never reaches the request at all — a toast fired from
    // inside queryFn couldn't actually block anything and re-fired on every
    // background refetch besides.
    const min = draft.valueMin ? Number(draft.valueMin) : null;
    const max = draft.valueMax ? Number(draft.valueMax) : null;
    if ((min != null && Number.isNaN(min)) || (max != null && Number.isNaN(max))) {
      toast('Min/max value must be a number', true);
      return;
    }
    if (min != null && max != null && min > max) {
      toast('Minimum value is greater than maximum', true);
      return;
    }
    setApplied(draft);
    setPage(1);
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <Field label="Search">
            <Input
              placeholder="Bill reference or payer…"
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </Field>
          <Field label="Status">
            <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
              <option value="">— All —</option>
              {BILL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ward">
            <select value={draft.wardId} onChange={(e) => setDraft((d) => ({ ...d, wardId: Number(e.target.value) || '' }))}>
              <option value="">— All —</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Onboarded by">
            <select value={draft.consultantId} onChange={(e) => setDraft((d) => ({ ...d, consultantId: Number(e.target.value) || '' }))}>
              <option value="">— All —</option>
              {consultants?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.consultant_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="row">
          <Field label="Revenue item">
            <select value={draft.revenueItemId} onChange={(e) => setDraft((d) => ({ ...d, revenueItemId: Number(e.target.value) || '' }))}>
              <option value="">— All —</option>
              {revenueItems?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.harmonised_code} — {i.item_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Issued from">
            <Input type="date" value={draft.dateFrom} onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))} />
          </Field>
          <Field label="Issued to">
            <Input type="date" value={draft.dateTo} onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))} />
          </Field>
        </div>
        <div className="row" style={{ alignItems: 'end' }}>
          <Field label="Min value (₦)">
            <Input type="number" min={0} value={draft.valueMin} onChange={(e) => setDraft((d) => ({ ...d, valueMin: e.target.value }))} />
          </Field>
          <Field label="Max value (₦)">
            <Input type="number" min={0} value={draft.valueMax} onChange={(e) => setDraft((d) => ({ ...d, valueMax: e.target.value }))} />
          </Field>
          <Field label="Sort by">
            <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="-total_amount">Value (high–low)</option>
              <option value="total_amount">Value (low–high)</option>
              <option value="due_date">Due date</option>
              <option value="bill_ref">Reference</option>
            </select>
          </Field>
          <button className="btn btn-primary" type="button" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load bills'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill Ref</th>
                  <th>Payer</th>
                  <th>Consultant</th>
                  <th className="r">Total</th>
                  <th className="r">Balance</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((b) => (
                    <tr key={b.id}>
                      <NumCell>{b.bill_ref}</NumCell>
                      <td>{b.full_name}</td>
                      <td>{b.consultant_name ?? 'Council Direct'}</td>
                      <NumCell className="r">{money(b.total_amount)}</NumCell>
                      <NumCell className="r">{money(b.balance)}</NumCell>
                      <NumCell>{shortDate(b.due_date)}</NumCell>
                      <td>
                        <span className={`tag tag-${BILL_STATUS_TAG[b.status] ?? 'brass'}`}>{b.status.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      No bills match this selection
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>
    </>
  );
}

const ENTITIES = ['PAYERS', 'BILLS', 'PAYMENTS', 'SETTLEMENTS'] as const;
type Entity = (typeof ENTITIES)[number];
const ENTITY_LABEL: Record<Entity, string> = { PAYERS: 'Payers', BILLS: 'Bills', PAYMENTS: 'Payments', SETTLEMENTS: 'Settlements' };

// Mirrors apps/common/api/reports.py's _ENTITY_DIMENSIONS exactly — the
// backend 400s on any dimension outside this per-entity set, so the picker
// only ever offers a combination that's actually valid.
const ENTITY_DIMENSIONS: Record<Entity, string[]> = {
  PAYERS: ['ward', 'consultant', 'date'],
  BILLS: ['ward', 'consultant', 'revenue_item', 'date'],
  PAYMENTS: ['ward', 'consultant', 'date'],
  SETTLEMENTS: ['consultant', 'date'],
};
const DIMENSION_LABEL: Record<string, string> = { ward: 'Ward', consultant: 'Consultant', revenue_item: 'Revenue item', date: 'Date' };

function buildReportUrl(params: {
  entity: Entity;
  groupBy: string[];
  wardId: number | '';
  consultantId: number | '';
  revenueItemId: number | '';
  dateFrom: string;
  dateTo: string;
  format?: 'csv';
}) {
  const q = new URLSearchParams();
  q.set('entity', params.entity);
  for (const dim of params.groupBy) q.append('group_by', dim);
  if (params.wardId !== '') q.set('ward_id', String(params.wardId));
  if (params.consultantId !== '') q.set('consultant_id', String(params.consultantId));
  if (params.revenueItemId !== '') q.set('revenue_item_id', String(params.revenueItemId));
  if (params.dateFrom) q.set('date_from', params.dateFrom);
  if (params.dateTo) q.set('date_to', params.dateTo);
  if (params.format) q.set('export', params.format);
  return `${API_BASE_URL}/api/v1/reports?${q.toString()}`;
}

interface ReportResponse {
  entity: string;
  group_by: string[];
  rows: Record<string, string | number | null>[];
}

const NUMERIC_COLUMNS = new Set(['count', 'billed', 'arrears', 'balance', 'amount', 'commission_amount', 'gross_collections']);

function SummaryReports() {
  const toast = useToast();
  const { data: wards } = useWards();
  const { data: consultants } = useConsultantOptions();
  const { data: revenueItems } = useRevenueItems();

  const [entity, setEntity] = useState<Entity>('BILLS');
  const [groupBy, setGroupBy] = useState<string[]>(['ward']);
  const [wardId, setWardId] = useState<number | ''>('');
  const [consultantId, setConsultantId] = useState<number | ''>('');
  const [revenueItemId, setRevenueItemId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  const allowedDims = ENTITY_DIMENSIONS[entity];

  function changeEntity(next: Entity) {
    setEntity(next);
    // Drop any selected dimension the new entity doesn't support, rather
    // than carrying over a combination the backend would 400 on.
    setGroupBy((prev) => prev.filter((d) => ENTITY_DIMENSIONS[next].includes(d)));
    if (next !== 'BILLS') setRevenueItemId('');
  }

  function toggleDimension(dim: string) {
    setGroupBy((prev) => {
      if (prev.includes(dim)) return prev.filter((d) => d !== dim);
      if (prev.length >= 2) {
        toast('Group by at most 2 dimensions', true);
        return prev;
      }
      return [...prev, dim];
    });
  }

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['reports', 'summary', entity, groupBy, wardId, consultantId, revenueItemId, dateFrom, dateTo],
    retry: false,
    queryFn: async (): Promise<ReportResponse> => {
      const url = buildReportUrl({ entity, groupBy, wardId, consultantId, revenueItemId, dateFrom, dateTo });
      const res = await fetch(url, { headers: { Authorization: `Bearer ${authStore.getAccessToken() ?? ''}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load report');
      return body;
    },
  });

  async function downloadCsv() {
    setDownloading(true);
    try {
      const url = buildReportUrl({ entity, groupBy, wardId, consultantId, revenueItemId, dateFrom, dateTo, format: 'csv' });
      const res = await fetch(url, { headers: { Authorization: `Bearer ${authStore.getAccessToken() ?? ''}` } });
      if (!res.ok) throw new Error('Failed to export report');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${entity.toLowerCase()}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not export report', true);
    } finally {
      setDownloading(false);
    }
  }

  const columns = data ? Object.keys(data.rows[0] ?? { message: '' }) : [];

  return (
    <>
      <div className="card">
        <div className="row">
          <Field label="Report on">
            <select value={entity} onChange={(e) => changeEntity(e.target.value as Entity)}>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {ENTITY_LABEL[e]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="From">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
        </div>
        <div className="row" style={{ alignItems: 'end' }}>
          {allowedDims.includes('ward') && (
            <Field label="Ward">
              <select value={wardId} onChange={(e) => setWardId(Number(e.target.value) || '')}>
                <option value="">— All —</option>
                {wards?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.ward_name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {allowedDims.includes('consultant') && (
            <Field label="Consultant">
              <select value={consultantId} onChange={(e) => setConsultantId(Number(e.target.value) || '')}>
                <option value="">— All —</option>
                {consultants?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.consultant_name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {allowedDims.includes('revenue_item') && (
            <Field label="Revenue item">
              <select value={revenueItemId} onChange={(e) => setRevenueItemId(Number(e.target.value) || '')}>
                <option value="">— All —</option>
                {revenueItems?.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.harmonised_code} — {i.item_name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <button className="btn btn-primary" type="button" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Running…' : 'Run Report'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={downloadCsv} disabled={downloading}>
            {downloading ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        <div className="row" style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-60)', marginRight: 8, alignSelf: 'center' }}>Group by (up to 2):</div>
          {allowedDims.map((dim) => (
            <button
              key={dim}
              type="button"
              className={`btn btn-sm ${groupBy.includes(dim) ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 'none' }}
              onClick={() => toggleDimension(dim)}
            >
              {DIMENSION_LABEL[dim]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load report'}</div>
          ) : !data || data.rows.length === 0 ? (
            <div className="empty">Run a report to see results</div>
          ) : (
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} className={NUMERIC_COLUMNS.has(c) ? 'r' : undefined}>
                      {c.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <NumCell key={c} className={NUMERIC_COLUMNS.has(c) ? 'r' : undefined}>
                        {row[c] ?? '—'}
                      </NumCell>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>
    </>
  );
}
