import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Field, KV, Modal, Select, Tag, money, shortDate, useToast } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useWards, wardNameLookup } from '../../lib/wards';

const KYC_STATUSES = ['PENDING', 'VERIFIED', 'FLAGGED'];
// Matches BillDetailModal/BillListPage's own status-tag mapping — ISSUED
// falls through to the 'neutral' default, same as there.
const BILL_TAG_FOR: Record<string, TagVariant> = { PAID: 'ok', OVERDUE: 'bad', PART_PAID: 'warn', CANCELLED: 'neutral', SUPERSEDED: 'neutral' };

export function PayerDetailModal({ payerId, onClose }: { payerId: number; onClose: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  // Per FRONTEND_HANDOFF_RBAC: invite-ratepayer is available to
  // COUNCIL_ADMIN, COUNCIL_IT, and AGENT — confirmed live that COUNCIL_IT
  // passes this endpoint's permission check (409 on an already-invited
  // payer, not 403).
  const canInviteRatepayer = isAdmin || user?.access_level === 'COUNCIL_IT' || user?.access_level === 'AGENT';
  const { data: wards } = useWards();
  const wardName = wardNameLookup(wards);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rollArrears, setRollArrears] = useState(false);
  const [duplicate, setDuplicate] = useState<components['schemas']['Bill'] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rpUsername, setRpUsername] = useState('');
  const [rpPassword, setRpPassword] = useState('');
  const [inviting, setInviting] = useState(false);

  const payerQuery = useQuery({
    queryKey: ['payers', 'detail', payerId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers/{id}', { params: { path: { id: String(payerId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const draftsQuery = useQuery({
    queryKey: ['payers', 'draft-assessments', payerId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/payers/{id}/draft-assessments', { params: { path: { id: String(payerId) } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const billsQuery = useQuery({
    queryKey: ['payers', 'bills', payerId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bills', { params: { query: { payer: payerId } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  async function issueHarmonizedBill(force = false) {
    try {
      const { data, error, response } = await apiClient.POST('/api/v1/bills', {
        body: { payer_id: payerId, bill_all_drafts: true, roll_arrears: rollArrears, force },
      });
      if (error) {
        if (response.status === 409 && 'duplicate_of' in error) {
          setDuplicate((error as { duplicate_of: components['schemas']['Bill'] }).duplicate_of);
          return;
        }
        throw new Error(errorMessage(error));
      }
      setDuplicate(null);
      toast(`Harmonized bill issued — ${data.bill_ref} (${money(data.total_amount)})` + (Number(data.arrears_amount) > 0 ? ` · ${money(data.arrears_amount)} arrears consolidated` : ''));
      setRollArrears(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payers', 'draft-assessments', payerId] }),
        queryClient.invalidateQueries({ queryKey: ['payers', 'bills', payerId] }),
        queryClient.invalidateQueries({ queryKey: ['bills'] }),
      ]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not issue bill', true);
    }
  }

  async function changeKyc(status: string) {
    try {
      const { error } = await apiClient.POST('/api/v1/payers/{id}/kyc-status', {
        params: { path: { id: String(payerId) } },
        body: { kyc_status: status as components['schemas']['KycStatusEnum'] },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`KYC status set to ${status}`);
      await queryClient.invalidateQueries({ queryKey: ['payers'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change KYC status', true);
    }
  }

  async function inviteRatepayer() {
    if (!rpUsername.trim() || !rpPassword.trim()) {
      toast('Enter a username and password for the ratepayer login', true);
      return;
    }
    setInviting(true);
    try {
      const { error } = await apiClient.POST('/api/v1/payers/{id}/invite-ratepayer', {
        params: { path: { id: String(payerId) } },
        body: { username: rpUsername.trim(), password: rpPassword.trim() },
      });
      if (error) {
        // 409 when this payer already has a ratepayer login — confirmed
        // live, a clean single-field error message.
        throw new Error(errorMessage(error));
      }
      toast(`Ratepayer login created — ${rpUsername.trim()}`);
      setInviteOpen(false);
      setRpUsername('');
      setRpPassword('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create ratepayer login', true);
    } finally {
      setInviting(false);
    }
  }

  async function deletePayer() {
    if (p == null) return;
    if (!window.confirm(`Delete ${p.full_name} (${p.payer_ref})? This can't be undone.`)) return;
    try {
      const { error, response } = await apiClient.DELETE('/api/v1/payers/{id}', { params: { path: { id: String(payerId) } } });
      if (error) {
        if (response.status === 409 && 'error' in error) throw new Error((error as { error: string }).error);
        throw new Error(errorMessage(error));
      }
      toast(`${p.payer_ref} deleted`);
      // Close before invalidating — otherwise this modal's own now-404ing
      // detail/drafts queries are still "active" and get swept into the
      // invalidation's refetch, which then sits out their retry/backoff
      // before onClose() ever runs.
      onClose();
      await queryClient.invalidateQueries({ queryKey: ['payers'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete payer', true);
    }
  }

  const p = payerQuery.data;
  const drafts = draftsQuery.data ?? [];
  const draftsTotal = drafts.reduce((sum, a) => sum + Number(a.amount), 0);
  const bills = billsQuery.data ?? [];

  return (
    <>
    <Modal
      open
      onClose={onClose}
      title={p?.full_name ?? 'Payer'}
      footer={
        <>
          {canInviteRatepayer && p != null && (
            <button className="btn btn-ghost" onClick={() => setInviteOpen(true)}>
              Invite Ratepayer
            </button>
          )}
          {isAdmin && p != null && (
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={deletePayer}>
              Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {payerQuery.isLoading || !p ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <KV label="Payer ref">
            <span className="num">{p.payer_ref}</span>
          </KV>
          <KV label="Type">
            {p.payer_type}
            {p.business_size ? ` · ${p.business_size[0]}${p.business_size.slice(1).toLowerCase()}` : ''}
          </KV>
          <KV label="Ward">{wardName(p.ward)}</KV>
          <KV label="Phone">
            <span className="num">{p.phone || '—'}</span>
          </KV>
          {isAdmin ? (
            <Field label="KYC status">
              <Select value={p.kyc_status} onChange={(e) => changeKyc(e.target.value)}>
                {KYC_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <KV label="KYC status">{p.kyc_status}</KV>
          )}

          <h3 style={{ margin: '18px 0 8px' }}>Bills ({bills.length})</h3>
          {billsQuery.isLoading && <div className="empty">Loading…</div>}
          {!billsQuery.isLoading && bills.length === 0 && <div className="empty">No bills issued to this payer yet</div>}
          {bills.map((b) => (
            <KV
              key={b.id}
              label={
                <>
                  {b.bill_ref} <Tag variant={BILL_TAG_FOR[b.status] ?? 'neutral'}>{b.status}</Tag>
                </>
              }
            >
              <span className="num">
                {money(b.total_amount)}
                {/* A SUPERSEDED/CANCELLED bill's balance is frozen, not collectible —
                    showing it as "owing" would double-count against whatever bill it
                    was rolled into. Matches Bill.TERMINAL_STATUSES on the backend. */}
                {Number(b.balance) > 0 && b.status !== 'SUPERSEDED' && b.status !== 'CANCELLED' ? ` · ${money(b.balance)} owing` : ''} · due{' '}
                {shortDate(b.due_date)}
              </span>
            </KV>
          ))}

          <h3 style={{ margin: '18px 0 8px' }}>Enumerated Revenue Items — not yet billed ({drafts.length})</h3>
          {drafts.length === 0 && (
            <div className="empty">Nothing pending — enumerate revenue items for this payer to build one up</div>
          )}
          {drafts.length > 0 && (
            <>
              {drafts.map((a) => (
                <KV key={a.id} label={`${a.harmonised_code} — ${a.item_name}`}>
                  <span className="num">{money(a.amount)}</span>
                </KV>
              ))}
              <KV label={<b>Total if billed now</b>}>
                <span className="num">{money(draftsTotal)}</span>
              </KV>
            </>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, marginTop: 10 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={rollArrears} onChange={(e) => setRollArrears(e.target.checked)} />
            Consolidate this payer&rsquo;s prior outstanding bills into this one (arrears brought forward)
          </label>
          {(drafts.length > 0 || rollArrears) && (
            <button className="btn btn-brass btn-sm" style={{ marginTop: 8 }} onClick={() => issueHarmonizedBill(false)}>
              Issue Harmonized Bill
            </button>
          )}
          {duplicate != null && (
            <div className="notice notice-bad" style={{ marginTop: 8 }}>
              This payer already has an active bill for this year — {duplicate.bill_ref} (balance {money(duplicate.balance)}).
              <div style={{ marginTop: 8 }}>
                <button
                  className="btn btn-brass btn-sm"
                  onClick={() => {
                    if (window.confirm(`Issue a new bill anyway alongside ${duplicate.bill_ref}?`)) void issueHarmonizedBill(true);
                  }}
                >
                  Issue anyway
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
    {inviteOpen && p != null && (
      <Modal
        open
        onClose={() => setInviteOpen(false)}
        title={`Invite ${p.full_name} to the ratepayer portal`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={inviteRatepayer} disabled={inviting}>
              {inviting ? 'Creating…' : 'Create Login'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-40)', marginTop: -4, marginBottom: 14 }}>
          Gives {p.full_name} their own sign-in to view bills, payments and receipts — separate from this staff portal. Share these
          credentials with them directly; they can change the password once signed in.
        </p>
        <Field label="Username">
          <input value={rpUsername} onChange={(e) => setRpUsername(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="text" value={rpPassword} onChange={(e) => setRpPassword(e.target.value)} />
        </Field>
      </Modal>
    )}
    </>
  );
}
