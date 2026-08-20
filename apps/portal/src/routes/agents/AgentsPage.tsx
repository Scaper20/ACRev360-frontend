import { apiClient, errorMessage } from '@acrev360/api';
import { Button, ClickableRow, Field, GroupedSelect, Input, KV, Modal, NumCell, Pagination, TableWrap, Tag, dateTime, money, money2, useToast } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { REVENUE_CATEGORY_ORDER, toGroupedItems, useRevenueItems } from '../../lib/revenueItems';
import { useWards, wardNameLookup } from '../../lib/wards';

const STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', SUSPENDED: 'bad', EXITED: 'neutral' };

export function AgentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [addItemId, setAddItemId] = useState<number | ''>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents', page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/agents', { params: { query: { page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const { data: consultants } = useQuery({
    queryKey: ['consultants'],
    // A CONSULTANT-role caller can't list this endpoint at all (COUNCIL_ADMIN
    // only, see SubConsultantViewSet.get_permissions()) — skip the guaranteed
    // 403 and fall back to the caller's own identity below instead.
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });
  // consultant_id is typed as a non-nullable number in the generated schema,
  // but a council-direct agent (no consultant) comes back with it genuinely
  // null at runtime — confirmed live. Guard defensively rather than trust
  // the generated type here.
  const consultantName = (id: number | null | undefined) => {
    if (id == null) return 'Council-direct';
    if (!isAdmin && user?.consultant === id) return user.consultant_name ?? `#${id}`;
    return consultants?.find((c) => c.id === id)?.consultant_name ?? `#${id}`;
  };

  const { data: revenueItems } = useRevenueItems();
  const groupedItems = revenueItems ? toGroupedItems(revenueItems) : [];
  const itemLookup = (id: number) => revenueItems?.find((i) => i.id === id);

  const activityQuery = useQuery({
    queryKey: ['agents', 'activity', detailId],
    enabled: detailId != null,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/agents/{id}/activity', { params: { path: { id: String(detailId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const portfolioQuery = useQuery({
    queryKey: ['agents', 'portfolio', detailId],
    enabled: detailId != null,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/agents/{id}/portfolio', { params: { path: { id: String(detailId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  async function addAgentPortfolioItem() {
    if (detailId == null || addItemId === '') return;
    try {
      const { error } = await apiClient.POST('/api/v1/agents/{id}/portfolio', {
        params: { path: { id: String(detailId) } },
        body: { council_revenue_item: addItemId },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Revenue item assigned');
      setAddItemId('');
      await queryClient.invalidateQueries({ queryKey: ['agents', 'portfolio', detailId] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not assign revenue item', true);
    }
  }

  async function revokeAgentPortfolioItem(portfolioId: number) {
    if (detailId == null) return;
    try {
      const { error } = await apiClient.POST('/api/v1/agents/{id}/portfolio/{portfolio_id}/end', {
        params: { path: { id: String(detailId), portfolio_id: portfolioId } },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Assignment revoked');
      await queryClient.invalidateQueries({ queryKey: ['agents', 'portfolio', detailId] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not revoke assignment', true);
    }
  }

  const agent = data?.results.find((a) => a.id === detailId);
  const canManagePortfolio = agent != null && (isAdmin || (user?.access_level === 'CONSULTANT' && user.consultant === agent.consultant_id));

  async function onboard() {
    if (!fullName.trim() || !username.trim()) {
      toast("Enter the agent's name and a username", true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/agents', {
        body: { full_name: fullName.trim(), username: username.trim(), phone: phone.trim() || undefined, assigned_ward: ward || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Agent onboarded');
      setOnboardOpen(false);
      setFullName('');
      setUsername('');
      setPhone('');
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not onboard agent', true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="grow" />
        <Button variant="primary" onClick={() => setOnboardOpen(true)}>
          Onboard Agent
        </Button>
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load agents'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Agent Code</th>
                  <th>Ward</th>
                  <th>Consultant</th>
                  <th>Device IMEI</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((a) => (
                    <ClickableRow key={a.id} onClick={() => setDetailId(a.id)}>
                      <NumCell>{a.agent_code}</NumCell>
                      <td>{a.assigned_ward != null ? wardName(a.assigned_ward) : '—'}</td>
                      <td>{consultantName(a.consultant_id)}</td>
                      <NumCell>{a.device_imei || '—'}</NumCell>
                      <td>
                        <Tag variant={STATUS_TAG[a.status] ?? 'neutral'}>{a.status}</Tag>
                      </td>
                    </ClickableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      No field agents onboarded yet
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
          title="Onboard Agent"
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
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Assigned ward">
            <select value={ward} onChange={(e) => setWard(Number(e.target.value) || '')}>
              <option value="">—</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      )}

      {agent != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={`Agent — ${agent.agent_code}`}
          footer={
            <button className="btn btn-ghost" onClick={() => setDetailId(null)}>
              Close
            </button>
          }
        >
          <KV label="Ward">{agent.assigned_ward != null ? wardName(agent.assigned_ward) : '—'}</KV>
          <KV label="Consultant">{consultantName(agent.consultant_id)}</KV>
          <KV label="Device IMEI">
            <span className="num">{agent.device_imei || '—'}</span>
          </KV>
          <KV label="Status">
            <Tag variant={STATUS_TAG[agent.status] ?? 'neutral'}>{agent.status}</Tag>
          </KV>

          {agent.consultant_id != null && (
            <>
              <h3 style={{ margin: '18px 0 8px' }}>Assigned Revenue Items ({portfolioQuery.data?.length ?? 0})</h3>
              {portfolioQuery.isLoading ? (
                <div className="empty">Loading…</div>
              ) : portfolioQuery.error ? (
                <div className="notice notice-bad">{portfolioQuery.error instanceof Error ? portfolioQuery.error.message : 'Failed to load assigned items'}</div>
              ) : portfolioQuery.data && portfolioQuery.data.length > 0 ? (
                portfolioQuery.data.map((p) => {
                  const item = itemLookup(p.council_revenue_item);
                  return (
                    <KV key={p.id} label={item ? `${item.harmonised_code} — ${item.item_name}${p.ward != null ? ` · ${wardName(p.ward)}` : ''}` : `Revenue item #${p.council_revenue_item}`}>
                      {canManagePortfolio && (
                        <button type="button" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--danger)', fontWeight: 400, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => revokeAgentPortfolioItem(p.id)}>
                          revoke
                        </button>
                      )}
                    </KV>
                  );
                })
              ) : (
                <div className="empty">
                  {canManagePortfolio
                    ? "Nothing assigned yet — this agent can currently work this consultant's whole portfolio"
                    : "Nothing assigned yet — this agent inherits their consultant's whole portfolio"}
                </div>
              )}

              {canManagePortfolio && (
                <div className="row" style={{ marginTop: 14 }}>
                  <Field label="Assign revenue item — out of the consultant's own portfolio">
                    <GroupedSelect items={groupedItems} groupOrder={REVENUE_CATEGORY_ORDER} value={addItemId} onChange={setAddItemId} />
                  </Field>
                  <Field label="&nbsp;">
                    <button className="btn btn-ghost" type="button" onClick={addAgentPortfolioItem} disabled={addItemId === ''}>
                      Assign
                    </button>
                  </Field>
                </div>
              )}
            </>
          )}

          {activityQuery.isLoading ? (
            <div className="empty" style={{ marginTop: 16 }}>
              Loading activity…
            </div>
          ) : activityQuery.error ? (
            <div className="notice notice-bad" style={{ marginTop: 16 }}>
              {activityQuery.error instanceof Error ? activityQuery.error.message : 'Failed to load activity'}
            </div>
          ) : (
            <>
              <KV label={<b>Today&rsquo;s collections</b>}>
                <span className="num">{money(activityQuery.data?.today_total ?? '0')}</span>
              </KV>
              <h3 style={{ margin: '18px 0 8px' }}>Recent Payments</h3>
              <TableWrap>
                {activityQuery.data && activityQuery.data.recent_payments.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Payment Ref</th>
                        <th>Bill</th>
                        <th>Channel</th>
                        <th className="r">Amount</th>
                        <th>Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityQuery.data.recent_payments.map((p) => (
                        <tr key={p.id}>
                          <NumCell>{p.payment_ref}</NumCell>
                          <NumCell>{p.bill_ref}</NumCell>
                          <td>{p.channel_code}</td>
                          <NumCell className="r">{money2(p.amount)}</NumCell>
                          <NumCell>{dateTime(p.created_at)}</NumCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty">No payments recorded</div>
                )}
              </TableWrap>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
