import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Button, ClickableRow, Field, GroupedSelect, Input, KV, Modal, NumCell, Pagination, Select, TableWrap, Tag, dateTime, money, useToast } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { sha256Hex } from '../../lib/hash';
import { ID_TYPES, ID_TYPE_LABEL } from '../../lib/idTypes';
import { REVENUE_CATEGORY_ORDER, toGroupedItems, useRevenueItems } from '../../lib/revenueItems';
import { useWards, wardNameLookup } from '../../lib/wards';

const STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', SUSPENDED: 'bad', EXITED: 'neutral', PENDING: 'warn' };
const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXITED'];

// A <button> styled to read as an inline text link, not href="javascript:void(0)"
// — React 19 actively blocks javascript: URLs as an XSS hardening measure
// (throws "React has blocked a javascript: URL as a security precaution."
// on every click, confirmed live), so that old pattern is a real bug now,
// not just dated style.
const LINK_BUTTON_STYLE: CSSProperties = { background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--danger)', fontWeight: 400, cursor: 'pointer', textDecoration: 'underline' };

export function ConsultantsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [contractRef, setContractRef] = useState('');
  const [rate, setRate] = useState('30');
  const [managerName, setManagerName] = useState('');
  const [managerUsername, setManagerUsername] = useState('');
  const [registrationWard, setRegistrationWard] = useState<number | ''>('');
  const [onboardStart, setOnboardStart] = useState('');
  const [onboardEnd, setOnboardEnd] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryIdType, setSignatoryIdType] = useState('');
  const [signatoryIdNumber, setSignatoryIdNumber] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [roName, setRoName] = useState('');
  const [roUsername, setRoUsername] = useState('');
  const [roPhone, setRoPhone] = useState('');
  const [addItemId, setAddItemId] = useState<number | ''>('');
  const [addWard, setAddWard] = useState<number | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['consultants', q, page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: { q: q || undefined, page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  const { data: revenueItems } = useRevenueItems();
  const groupedItems = revenueItems ? toGroupedItems(revenueItems) : [];
  const itemLookup = (id: number) => revenueItems?.find((i) => i.id === id);
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);

  const revenueOfficersQuery = useQuery({
    queryKey: ['consultants', 'revenue-officers', detailId],
    enabled: detailId != null,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants/{id}/revenue-officers', { params: { path: { id: String(detailId) } } });
      if (error) throw new Error(errorMessage(error));
      // Documented as PaginatedRevenueOfficerList, but confirmed live: an
      // empty list comes back as a bare [], not {results: [], count: 0} —
      // another schema-vs-runtime mismatch (see CHANGELOG.md's recurring
      // themes). Handle both shapes rather than assume either one.
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  async function onboardRevenueOfficer() {
    if (detailId == null || !roName.trim() || !roUsername.trim()) {
      toast("Enter the revenue officer's name and a username", true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/consultants/{id}/revenue-officers', {
        params: { path: { id: String(detailId) } },
        body: { full_name: roName.trim(), username: roUsername.trim(), phone: roPhone.trim() || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Revenue officer account created');
      setRoName('');
      setRoUsername('');
      setRoPhone('');
      await queryClient.invalidateQueries({ queryKey: ['consultants', 'revenue-officers', detailId] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create revenue officer account', true);
    }
  }

  const portfolioQuery = useQuery({
    queryKey: ['consultants', 'portfolio', detailId],
    enabled: detailId != null,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants/{id}/portfolio', { params: { path: { id: String(detailId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  async function addPortfolioItem() {
    if (detailId == null || addItemId === '') return;
    try {
      const { error } = await apiClient.POST('/api/v1/consultants/{id}/portfolio', {
        params: { path: { id: String(detailId) } },
        body: { consultant: detailId, council_revenue_item: addItemId, ward: addWard === '' ? undefined : addWard },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Revenue item assigned');
      setAddItemId('');
      setAddWard('');
      await queryClient.invalidateQueries({ queryKey: ['consultants', 'portfolio', detailId] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not assign revenue item', true);
    }
  }

  async function revokePortfolioItem(portfolioId: number) {
    if (detailId == null) return;
    try {
      const { error } = await apiClient.POST('/api/v1/consultants/{id}/portfolio/{portfolio_id}/end', {
        params: { path: { id: String(detailId), portfolio_id: portfolioId } },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Assignment revoked');
      await queryClient.invalidateQueries({ queryKey: ['consultants', 'portfolio', detailId] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not revoke assignment', true);
    }
  }

  async function onboard() {
    if (!name.trim() || !contractRef.trim()) {
      toast('Enter a name and contract reference', true);
      return;
    }
    if (registrationWard === '') {
      toast("Select the consultant's registration ward", true);
      return;
    }
    if (managerUsername.trim() && !managerName.trim()) {
      toast("Enter the manager's name, or leave both manager fields blank", true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/consultants', {
        body: {
          consultant_name: name.trim(),
          contract_ref: contractRef.trim(),
          commission_rate: rate,
          registration_ward_id: registrationWard,
          contract_start_date: onboardStart || undefined,
          contract_end_date: onboardEnd || undefined,
          ...(managerUsername.trim() ? { manager_username: managerUsername.trim(), manager_full_name: managerName.trim() } : {}),
          authorized_signatory_name: signatoryName.trim() || undefined,
          ...(signatoryIdType ? { authorized_signatory_id_type: signatoryIdType as components['schemas']['AuthorizedSignatoryIdTypeEnum'] } : {}),
          ...(signatoryIdNumber.trim() ? { authorized_signatory_id_hash: await sha256Hex(signatoryIdNumber.trim()) } : {}),
          registered_address: registeredAddress.trim() || undefined,
        },
      });
      if (error) throw new Error(errorMessage(error));
      toast(managerUsername.trim() ? 'Consultant onboarded with a manager login' : 'Consultant onboarded');
      setOnboardOpen(false);
      setName('');
      setContractRef('');
      setManagerName('');
      setManagerUsername('');
      setRegistrationWard('');
      setOnboardStart('');
      setOnboardEnd('');
      setSignatoryName('');
      setSignatoryIdType('');
      setSignatoryIdNumber('');
      setRegisteredAddress('');
      await queryClient.invalidateQueries({ queryKey: ['consultants'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not onboard consultant', true);
    }
  }

  async function changeStatus(id: number, status: string) {
    try {
      const { error } = await apiClient.POST('/api/v1/consultants/{id}/status_change', {
        params: { path: { id: String(id) } },
        body: { status: status as components['schemas']['StatusC83Enum'] },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`Status set to ${status}`);
      await queryClient.invalidateQueries({ queryKey: ['consultants'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change status', true);
    }
  }

  const consultant = data?.results.find((c) => c.id === detailId);

  // Registration bill balance — status_change rejects PENDING -> ACTIVE
  // server-side while this is above zero (see the backend's own error:
  // "This consultant's registration bill still has a balance — it must be
  // paid before activation."). Surfacing it here so an admin sees why
  // before trying, not just after a failed attempt. Older consultants
  // predating this flow have no registration_payer at all.
  const registrationBillsQuery = useQuery({
    queryKey: ['consultants', 'registration-bills', consultant?.registration_payer],
    enabled: consultant?.registration_payer != null,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bills', { params: { query: { payer: consultant!.registration_payer! } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });
  const registrationBalance = (registrationBillsQuery.data ?? []).reduce((sum, b) => sum + Number(b.balance), 0);

  // Re-sync the two date inputs to whatever's actually on the consultant
  // every time the detail modal opens for a (possibly different) one —
  // otherwise a stale value from the last consultant viewed would linger.
  useEffect(() => {
    setContractStart(consultant?.contract_start_date ?? '');
    setContractEnd(consultant?.contract_end_date ?? '');
  }, [consultant?.id]);

  async function saveContractDates() {
    if (detailId == null) return;
    try {
      const { error } = await apiClient.POST('/api/v1/consultants/{id}/contract_dates', {
        params: { path: { id: String(detailId) } },
        body: { contract_start_date: contractStart || null, contract_end_date: contractEnd || null },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Contract dates updated');
      await queryClient.invalidateQueries({ queryKey: ['consultants'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update contract dates', true);
    }
  }

  return (
    <>
      {isAdmin && (
        <div className="toolbar">
          <input className="grow" autoComplete="off" placeholder="Search by name or contract reference…" value={q} onChange={(e) => onSearchChange(e.target.value)} />
          <Button variant="primary" onClick={() => setOnboardOpen(true)}>
            Onboard Consultant
          </Button>
        </div>
      )}
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load consultants'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contract Ref</th>
                  <th className="r">Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((c) => (
                    <ClickableRow key={c.id} onClick={() => setDetailId(c.id)}>
                      <td>{c.consultant_name}</td>
                      <NumCell>{c.contract_ref}</NumCell>
                      <NumCell className="r">{c.commission_rate}%</NumCell>
                      <td>
                        <Tag variant={STATUS_TAG[c.status] ?? 'neutral'}>{c.status}</Tag>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      No consultants onboarded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {onboardOpen && (
        <Modal
          open
          onClose={() => setOnboardOpen(false)}
          title="Onboard Consultant"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOnboardOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onboard}>
                Onboard
              </button>
            </>
          }
        >
          <Field label="Consultant name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Contract reference">
            <Input value={contractRef} onChange={(e) => setContractRef(e.target.value)} placeholder="KAC/RC/2026/xxx" />
          </Field>
          <Field label="Commission rate (%)">
            <Input type="number" min={0} max={100} step={0.01} value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
          <Field label="Registration ward">
            <select value={registrationWard} onChange={(e) => setRegistrationWard(Number(e.target.value) || '')}>
              <option value="">— Select ward —</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
          <div className="row">
            <Field label="Contract start (optional)">
              <Input type="date" value={onboardStart} onChange={(e) => setOnboardStart(e.target.value)} />
            </Field>
            <Field label="Contract end (optional — blank = open-ended)">
              <Input type="date" value={onboardEnd} onChange={(e) => setOnboardEnd(e.target.value)} />
            </Field>
          </div>
          <Field label="Manager login — username (optional)">
            <Input value={managerUsername} onChange={(e) => setManagerUsername(e.target.value)} placeholder="Leave blank to onboard without a login" />
          </Field>
          {managerUsername.trim() && (
            <Field label="Manager's name">
              <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} />
            </Field>
          )}
          <Field label="Authorized signatory — name (optional)">
            <Input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} />
          </Field>
          <div className="row">
            <Field label="Signatory ID type (optional)">
              <select value={signatoryIdType} onChange={(e) => setSignatoryIdType(e.target.value)}>
                <option value="">—</option>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ID_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Signatory ID number (optional — hashed before sending)">
              <Input value={signatoryIdNumber} onChange={(e) => setSignatoryIdNumber(e.target.value)} />
            </Field>
          </div>
          <Field label="Registered address (optional)">
            <Input value={registeredAddress} onChange={(e) => setRegisteredAddress(e.target.value)} />
          </Field>
        </Modal>
      )}

      {consultant != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={consultant.consultant_name}
          footer={<button className="btn btn-ghost" onClick={() => setDetailId(null)}>Close</button>}
        >
          <KV label="Contract ref">
            <span className="num">{consultant.contract_ref}</span>
          </KV>
          <KV label="Commission rate">{consultant.commission_rate}%</KV>
          <KV label="Status">
            <Tag variant={STATUS_TAG[consultant.status] ?? 'neutral'}>{consultant.status}</Tag>
          </KV>
          <KV label="Authorized signatory">{consultant.authorized_signatory_name || 'Not recorded'}</KV>
          <KV label="Signatory ID on file">
            {consultant.authorized_signatory_id_type ? ID_TYPE_LABEL[consultant.authorized_signatory_id_type] ?? consultant.authorized_signatory_id_type : 'None recorded'}
          </KV>
          <KV label="Registered address">{consultant.registered_address || 'Not recorded'}</KV>
          <KV label="Manager login">
            <Tag variant={consultant.has_login ? 'ok' : 'neutral'}>{consultant.has_login ? 'Set up' : 'Not set up'}</Tag>
          </KV>
          <KV label="Contract dates">
            {consultant.contract_start_date || consultant.contract_end_date ? (
              <>
                {consultant.contract_start_date ?? '—'} to {consultant.contract_end_date ?? 'open-ended'}
                {consultant.is_contract_expired && (
                  <span style={{ marginLeft: 8 }}>
                    <Tag variant="bad">Expired</Tag>
                  </span>
                )}
              </>
            ) : (
              'Not set'
            )}
          </KV>
          {consultant.registration_payer != null && registrationBillsQuery.error && (
            <KV label="Registration bill outstanding">
              <span style={{ color: 'var(--danger)' }}>Could not check — try reopening before activating</span>
            </KV>
          )}
          {consultant.registration_payer != null && !registrationBillsQuery.error && registrationBalance > 0 && (
            <KV label="Registration bill outstanding">
              <span className="num" style={{ color: 'var(--danger)' }}>
                {money(registrationBalance)} — cannot activate until paid
              </span>
            </KV>
          )}
          {isAdmin && (
            <Field label="Change status">
              <Select value={consultant.status} onChange={(e) => changeStatus(consultant.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {isAdmin && (
            <div className="row" style={{ marginTop: 10 }}>
              <Field label="Contract start">
                <Input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
              </Field>
              <Field label="Contract end (blank = open-ended)">
                <Input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
              </Field>
              <Field label="&nbsp;">
                <button className="btn btn-ghost" type="button" onClick={saveContractDates}>
                  Save dates
                </button>
              </Field>
            </div>
          )}

          <h3 style={{ margin: '18px 0 8px' }}>Assigned revenue items ({portfolioQuery.data?.length ?? 0})</h3>
          {portfolioQuery.isLoading ? (
            <div className="empty">Loading portfolio…</div>
          ) : portfolioQuery.error ? (
            <div className="notice notice-bad">{portfolioQuery.error instanceof Error ? portfolioQuery.error.message : 'Failed to load portfolio'}</div>
          ) : portfolioQuery.data && portfolioQuery.data.length > 0 ? (
            portfolioQuery.data.map((p) => {
              const item = itemLookup(p.council_revenue_item);
              return (
                <KV key={p.id} label={item ? `${item.harmonised_code} — ${item.item_name}${p.ward != null ? ` · ${wardName(p.ward)}` : ''}` : `Revenue item #${p.council_revenue_item}`}>
                  {isAdmin && (
                    <button type="button" style={LINK_BUTTON_STYLE} onClick={() => revokePortfolioItem(p.id)}>
                      revoke
                    </button>
                  )}
                </KV>
              );
            })
          ) : (
            <div className="empty">No revenue items assigned yet</div>
          )}

          {isAdmin && (
            <div className="row" style={{ marginTop: 14 }}>
              <Field label="Add revenue item">
                <GroupedSelect items={groupedItems} groupOrder={REVENUE_CATEGORY_ORDER} value={addItemId} onChange={setAddItemId} />
              </Field>
              <Field label="Ward (optional — leave blank for all wards)">
                <select value={addWard} onChange={(e) => setAddWard(Number(e.target.value) || '')}>
                  <option value="">— All wards —</option>
                  {wards?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.ward_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="&nbsp;">
                <button className="btn btn-ghost" type="button" onClick={addPortfolioItem} disabled={addItemId === ''}>
                  Add
                </button>
              </Field>
            </div>
          )}

          <h3 style={{ margin: '18px 0 8px' }}>Revenue Officers ({revenueOfficersQuery.data?.length ?? 0})</h3>
          <p style={{ fontSize: 12.5, color: 'var(--ink-60)', marginTop: -4, marginBottom: 10 }}>
            Read-only accounts — same portfolio visibility as this consultant&rsquo;s own manager, no mutating access anywhere.
          </p>
          {revenueOfficersQuery.isLoading ? (
            <div className="empty">Loading…</div>
          ) : revenueOfficersQuery.error ? (
            <div className="notice notice-bad">{revenueOfficersQuery.error instanceof Error ? revenueOfficersQuery.error.message : 'Failed to load revenue officers'}</div>
          ) : revenueOfficersQuery.data && revenueOfficersQuery.data.length > 0 ? (
            revenueOfficersQuery.data.map((ro) => (
              <KV key={ro.id} label={`${ro.full_name} · ${ro.username}${ro.phone ? ' · ' + ro.phone : ''}`}>
                <Tag variant={ro.is_active ? 'ok' : 'neutral'}>{ro.is_active ? 'Active' : 'Inactive'}</Tag>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ink-60)' }}>{dateTime(ro.date_joined)}</span>
              </KV>
            ))
          ) : (
            <div className="empty">No revenue officer accounts yet</div>
          )}

          {isAdmin && (
            <div className="row" style={{ marginTop: 14 }}>
              <Field label="Full name">
                <Input value={roName} onChange={(e) => setRoName(e.target.value)} />
              </Field>
              <Field label="Username">
                <Input value={roUsername} onChange={(e) => setRoUsername(e.target.value)} />
              </Field>
              <Field label="Phone (optional)">
                <Input value={roPhone} onChange={(e) => setRoPhone(e.target.value)} />
              </Field>
              <Field label="&nbsp;">
                <button className="btn btn-ghost" type="button" onClick={onboardRevenueOfficer}>
                  Create
                </button>
              </Field>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
