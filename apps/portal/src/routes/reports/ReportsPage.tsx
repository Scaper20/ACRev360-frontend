import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, Input, NumCell, Pagination, TableWrap, dateTime, money, shortDate, useToast } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRevenueItems } from '../../lib/revenueItems';
import { useWards } from '../../lib/wards';

const REPORT_TYPES = ['PAYERS', 'BILLS'] as const;

const KYC_TAG: Record<string, string> = { VERIFIED: 'ok', FLAGGED: 'bad', PENDING: 'warn' };
const BILL_STATUS_TAG: Record<string, string> = { PAID: 'ok', OVERDUE: 'bad', PART_PAID: 'warn', CANCELLED: 'neutral', SUPERSEDED: 'neutral' };
const BILL_STATUSES = ['ISSUED', 'PART_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'SUPERSEDED'];

function useConsultantOptions() {
  return useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });
}

export function ReportsPage() {
  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>('PAYERS');

  return (
    <>
      <div className="toolbar">
        <div className="row" style={{ gap: 8 }}>
          {REPORT_TYPES.map((t) => (
            <button key={t} className={`btn ${reportType === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setReportType(t)}>
              {t === 'PAYERS' ? 'Payers Report' : 'Bills Report'}
            </button>
          ))}
        </div>
      </div>
      {reportType === 'PAYERS' ? <PayersReport /> : <BillsReport />}
    </>
  );
}

function PayersReport() {
  const [q, setQ] = useState('');
  const [wardId, setWardId] = useState<number | ''>('');
  const [consultantId, setConsultantId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);

  const { data: wards } = useWards();
  const { data: consultants } = useConsultantOptions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'payers', q, wardId, consultantId, dateFrom, dateTo, ordering, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers', {
        params: {
          query: {
            q: q || undefined,
            ward_id: wardId === '' ? undefined : wardId,
            consultant_id: consultantId === '' ? undefined : consultantId,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            ordering,
            page,
          },
        },
      });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function resetPage() {
    setPage(1);
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <Field label="Search">
            <Input placeholder="Name, reference or phone…" value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} />
          </Field>
          <Field label="Ward">
            <select value={wardId} onChange={(e) => { setWardId(Number(e.target.value) || ''); resetPage(); }}>
              <option value="">— All —</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Onboarded by">
            <select value={consultantId} onChange={(e) => { setConsultantId(Number(e.target.value) || ''); resetPage(); }}>
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
          <Field label="Registered from">
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }} />
          </Field>
          <Field label="Registered to">
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }} />
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

function BillsReport() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [wardId, setWardId] = useState<number | ''>('');
  const [consultantId, setConsultantId] = useState<number | ''>('');
  const [revenueItemId, setRevenueItemId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const toast = useToast();

  const { data: wards } = useWards();
  const { data: consultants } = useConsultantOptions();
  const { data: revenueItems } = useRevenueItems();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'bills', q, status, wardId, consultantId, revenueItemId, dateFrom, dateTo, valueMin, valueMax, ordering, page],
    queryFn: async () => {
      if (valueMin && valueMax && Number(valueMin) > Number(valueMax)) {
        toast('Minimum value is greater than maximum — showing no results', true);
      }
      const { data, error } = await apiClient.GET('/api/v1/bills', {
        params: {
          query: {
            q: q || undefined,
            status: (status || undefined) as components['schemas']['StatusE25Enum'] | undefined,
            ward_id: wardId === '' ? undefined : wardId,
            consultant_id: consultantId === '' ? undefined : consultantId,
            revenue_item_id: revenueItemId === '' ? undefined : revenueItemId,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            value_min: valueMin || undefined,
            value_max: valueMax || undefined,
            ordering,
            page,
          },
        },
      });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function resetPage() {
    setPage(1);
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <Field label="Search">
            <Input placeholder="Bill reference or payer…" value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => { setStatus(e.target.value); resetPage(); }}>
              <option value="">— All —</option>
              {BILL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ward">
            <select value={wardId} onChange={(e) => { setWardId(Number(e.target.value) || ''); resetPage(); }}>
              <option value="">— All —</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Onboarded by">
            <select value={consultantId} onChange={(e) => { setConsultantId(Number(e.target.value) || ''); resetPage(); }}>
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
            <select value={revenueItemId} onChange={(e) => { setRevenueItemId(Number(e.target.value) || ''); resetPage(); }}>
              <option value="">— All —</option>
              {revenueItems?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.harmonised_code} — {i.item_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Issued from">
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }} />
          </Field>
          <Field label="Issued to">
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }} />
          </Field>
        </div>
        <div className="row">
          <Field label="Min value (₦)">
            <Input type="number" min={0} value={valueMin} onChange={(e) => { setValueMin(e.target.value); resetPage(); }} />
          </Field>
          <Field label="Max value (₦)">
            <Input type="number" min={0} value={valueMax} onChange={(e) => { setValueMax(e.target.value); resetPage(); }} />
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
