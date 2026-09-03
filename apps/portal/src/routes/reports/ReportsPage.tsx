import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Field, Input, TableWrap, money2, useToast } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRevenueItems } from '../../lib/revenueItems';
import { useWards } from '../../lib/wards';

const ENTITIES = ['PAYERS', 'BILLS', 'PAYMENTS', 'SETTLEMENTS'] as const;
const GROUP_BY_OPTIONS = [
  { value: 'ward', label: 'Ward' },
  { value: 'revenue_item', label: 'Revenue item' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'date', label: 'Date' },
] as const;

/** Snake_case column keys read better in Title Case than raw — this doesn't
 * know the actual key names ahead of time (rows are a genuinely dynamic
 * shape, keyed differently per entity/group_by combination), so it's a
 * generic transform, not a per-key label lookup. */
function columnLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// The backend serializes Decimal-shaped fields (billed/arrears/balance,
// commission, etc.) as fixed-2dp strings, same as everywhere else in this
// API — matching that exact shape here (rather than a per-key label lookup,
// since the key names vary by entity/group_by) so money renders like money
// instead of a raw "120000.00" string.
const DECIMAL_STRING = /^-?\d+\.\d{2}$/;

function cellValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string' && DECIMAL_STRING.test(value)) return money2(value);
  return String(value);
}

export function ReportsPage() {
  const toast = useToast();
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]>('PAYERS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [consultantId, setConsultantId] = useState<number | ''>('');
  const [wardId, setWardId] = useState<number | ''>('');
  const [revenueItemId, setRevenueItemId] = useState<number | ''>('');
  const [ran, setRan] = useState(false);

  const { data: wards } = useWards();
  const { data: revenueItems } = useRevenueItems();
  const { data: consultants } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  const reportQuery = useQuery({
    queryKey: ['reports', entity, dateFrom, dateTo, groupBy, consultantId, wardId, revenueItemId],
    enabled: ran,
    // A bad combination (e.g. a group_by dimension the chosen entity doesn't
    // support) 400s and will never succeed on retry — the default 3 retries
    // with backoff just delays the actual error message for several seconds
    // while this query-builder tool is exactly the case where users will
    // hit that regularly while exploring valid combinations.
    retry: false,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/reports', {
        params: {
          query: {
            entity,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            // Documented as "Repeatable, max 2" and the backend reads it via
            // getlist(), but the generated type is a bare `string` (the
            // OpenAPI schema never declared it as an array) — openapi-fetch's
            // default query serializer still repeats an array value as
            // multiple keys regardless of what the type says, so the actual
            // request is correct; only the type checker needs convincing.
            group_by: (groupBy.length > 0 ? groupBy : undefined) as unknown as string | undefined,
            consultant_id: consultantId === '' ? undefined : consultantId,
            ward_id: wardId === '' ? undefined : wardId,
            revenue_item_id: entity === 'BILLS' && revenueItemId !== '' ? revenueItemId : undefined,
          },
        },
      });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function toggleGroupBy(value: string) {
    setGroupBy((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= 2) {
        toast('Group by up to 2 dimensions at a time', true);
        return prev;
      }
      return [...prev, value];
    });
  }

  function runReport() {
    setRan(true);
    reportQuery.refetch();
  }

  const rows = reportQuery.data?.rows ?? [];
  // Rows are a genuinely dynamic shape — union every key across every row
  // rather than trust the first one, in case group_by combinations produce
  // rows with slightly different keys present (e.g. a null dimension omitted).
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];

  return (
    <>
      <div className="card">
        <div className="row">
          <Field label="Entity">
            <select value={entity} onChange={(e) => setEntity(e.target.value as (typeof ENTITIES)[number])}>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {columnLabel(e.toLowerCase())}
                </option>
              ))}
            </select>
          </Field>
          <Field label="From (optional)">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="To (optional)">
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
        </div>

        <div className="row">
          <Field label="Consultant (optional)">
            <select value={consultantId} onChange={(e) => setConsultantId(Number(e.target.value) || '')}>
              <option value="">— All —</option>
              {consultants?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.consultant_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ward (optional)">
            <select value={wardId} onChange={(e) => setWardId(Number(e.target.value) || '')}>
              <option value="">— All —</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
          {entity === 'BILLS' && (
            <Field label="Revenue item (optional)">
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
        </div>

        <Field label="Group by (up to 2)">
          <div className="row" style={{ gap: 16 }}>
            {GROUP_BY_OPTIONS.map((g) => (
              <label key={g.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={groupBy.includes(g.value)} onChange={() => toggleGroupBy(g.value)} />
                {g.label}
              </label>
            ))}
          </div>
        </Field>

        <div className="toolbar" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="grow" />
          <Button variant="primary" onClick={runReport}>
            Run Report
          </Button>
        </div>
      </div>

      {ran && (
        <div className="card">
          <TableWrap>
            {reportQuery.isFetching ? (
              <div className="empty">Running report…</div>
            ) : reportQuery.error ? (
              <div className="notice notice-bad">{reportQuery.error instanceof Error ? reportQuery.error.message : 'Failed to run report'}</div>
            ) : rows.length === 0 ? (
              <div className="empty">No rows for this selection</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c}>{columnLabel(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td key={c}>{cellValue(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableWrap>
        </div>
      )}
    </>
  );
}
