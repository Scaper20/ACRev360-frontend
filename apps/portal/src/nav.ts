import type { AccessLevel } from '@acrev360/api';

export interface NavLinkDef {
  key: string;
  label: string;
  to: string;
}

export interface NavSectionDef {
  label: string;
  items: NavLinkDef[];
}

/**
 * Role-driven nav, ported from the prototype's NAV_SECTIONS but reshaped
 * around what this backend build pass actually exposes (see the build
 * plan's "scope for this pass" — no field-agent worklist screens, no report
 * builder, no council switcher).
 *
 * Note: council onboarding (`POST /councils/onboard`) is deliberately NOT
 * listed here for any role — it's gated on Django is_superuser/is_staff, a
 * dimension /auth/me doesn't expose at all, so no business access_level can
 * be used to reliably show/hide it. It lives at a direct route
 * (/platform/onboard-council) instead; the backend's own 403 is the real
 * gate if someone without platform access finds their way there.
 */
export function navSectionsFor(accessLevel: AccessLevel): NavSectionDef[] {
  switch (accessLevel) {
    case 'COUNCIL_ADMIN':
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }, { key: 'global', label: 'Global Performance', to: '/global' }] },
        {
          label: 'Revenue Operations',
          items: [
            { key: 'payers', label: 'Payer Registry', to: '/payers' },
            { key: 'bills', label: 'Assessment & e-Billing', to: '/bills' },
            { key: 'payments', label: 'Payments', to: '/payments' },
            { key: 'receipts', label: 'e-Receipts', to: '/receipts' },
          ],
        },
        {
          label: 'Finance',
          items: [
            { key: 'reconciliation', label: 'Reconciliation', to: '/reconciliation' },
            { key: 'settlements', label: 'Commission Settlements', to: '/settlements' },
            { key: 'debt', label: 'Debt Management', to: '/debt' },
          ],
        },
        {
          label: 'Administration',
          items: [
            { key: 'revenueItems', label: 'Revenue Items', to: '/revenue-items' },
            { key: 'departments', label: 'Departments', to: '/departments' },
            { key: 'wards', label: 'Wards', to: '/wards' },
            { key: 'consultants', label: 'Sub-Consultants', to: '/consultants' },
            { key: 'agents', label: 'Field Agents', to: '/agents' },
            { key: 'stakeholders', label: 'Stakeholders', to: '/stakeholders' },
            { key: 'terminals', label: 'POS Terminal Fleet', to: '/terminals' },
            { key: 'channels', label: 'e-Channel Config', to: '/channels' },
            { key: 'audit', label: 'Audit Log', to: '/audit' },
            { key: 'reports', label: 'Reports', to: '/reports' },
          ],
        },
      ];
    case 'CONSULTANT':
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }] },
        {
          label: 'Revenue Operations',
          items: [
            { key: 'payers', label: 'Payer Registry', to: '/payers' },
            { key: 'bills', label: 'Assessment & e-Billing', to: '/bills' },
            { key: 'payments', label: 'Payments', to: '/payments' },
            { key: 'receipts', label: 'e-Receipts', to: '/receipts' },
          ],
        },
        {
          label: 'Finance',
          items: [
            { key: 'reconciliation', label: 'Reconciliation', to: '/reconciliation' },
            { key: 'settlements', label: 'Commission Settlements', to: '/settlements' },
            { key: 'debt', label: 'Debt Management', to: '/debt' },
          ],
        },
        { label: 'Team', items: [{ key: 'agents', label: 'Field Agents', to: '/agents' }, { key: 'terminals', label: 'POS Terminal Fleet', to: '/terminals' }] },
      ];
    case 'REVENUE_OFFICER':
      // Same portfolio visibility as the consultant's own manager (see
      // SubConsultantViewSet.revenue_officers's docstring), but read-only —
      // no "Team" section, since managing/onboarding agents is a mutating
      // capability outside "visibility" and every such action 403s for this
      // role server-side regardless of what's shown here.
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }] },
        {
          label: 'Revenue Operations',
          items: [
            { key: 'payers', label: 'Payer Registry', to: '/payers' },
            { key: 'bills', label: 'Assessment & e-Billing', to: '/bills' },
            { key: 'payments', label: 'Payments', to: '/payments' },
            { key: 'receipts', label: 'e-Receipts', to: '/receipts' },
          ],
        },
        {
          label: 'Finance',
          items: [
            { key: 'reconciliation', label: 'Reconciliation', to: '/reconciliation' },
            { key: 'settlements', label: 'Commission Settlements', to: '/settlements' },
            { key: 'debt', label: 'Debt Management', to: '/debt' },
          ],
        },
      ];
    case 'GLOBAL_VIEW':
      // Read-only, aggregate-only by design (see StakeholderViewSet's
      // docstring on the backend) — no Sub-Consultants link, since that list
      // is named-identity data GLOBAL_VIEW no longer has permission for.
      return [{ label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }, { key: 'global', label: 'Global Performance', to: '/global' }] }];
    case 'AGENT':
      // Field agents have no portal surface this pass — the backend has no
      // worklist/offline-sync endpoints yet (see build plan). Route guarding
      // sends them to a plain notice rather than into a nav with nothing
      // meaningful behind it.
      return [];
    // The four cases below were verified live against the qa_council_*
    // test accounts (see FRONTEND_HANDOFF_RBAC's credential table) rather
    // than built from the handoff's prose summary alone — several real
    // endpoints diverge from what that summary implies (e.g. GET /payers
    // 403s for all four roles despite bills/payments being readable; GET
    // /revenue-items, /wards, /departments, /channels are open to every
    // authenticated role including COUNCIL_IT, "financial access" or not).
    // No Payer Registry link for any of the four — none of them can call
    // GET /payers.
    case 'COUNCIL_IGR_HEAD':
      // Confirmed live: bills/payments/receipts (read), reconciliation,
      // debt, audit, agents, consultants, reports, dashboard, revenue-items/
      // wards/departments/channels (open to all). NOT settlements, NOT
      // payers, NOT api-clients, NOT terminals, NOT dashboard/global (403
      // despite Dashboard's own /dashboard/summary working).
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }] },
        {
          label: 'Revenue Operations',
          items: [
            { key: 'bills', label: 'Assessment & e-Billing', to: '/bills' },
            { key: 'payments', label: 'Payments', to: '/payments' },
            { key: 'receipts', label: 'e-Receipts', to: '/receipts' },
          ],
        },
        { label: 'Finance', items: [{ key: 'reconciliation', label: 'Reconciliation', to: '/reconciliation' }, { key: 'debt', label: 'Debt Management', to: '/debt' }] },
        {
          label: 'Administration',
          items: [
            { key: 'revenueItems', label: 'Revenue Items', to: '/revenue-items' },
            { key: 'departments', label: 'Departments', to: '/departments' },
            { key: 'wards', label: 'Wards', to: '/wards' },
            { key: 'consultants', label: 'Sub-Consultants', to: '/consultants' },
            { key: 'agents', label: 'Field Agents', to: '/agents' },
            { key: 'audit', label: 'Audit Log', to: '/audit' },
            { key: 'reports', label: 'Reports', to: '/reports' },
          ],
        },
      ];
    case 'COUNCIL_TREASURY':
      // Confirmed live: bills/payments/receipts (read), reconciliation,
      // debt, settlements, reports, dashboard, revenue-items/wards/
      // departments/channels. NOT agents, NOT audit, NOT payers,
      // NOT api-clients, NOT terminals, NOT dashboard/global, NOT consultant
      // management (can call GET /consultants for the reports filter, but
      // has no consultants-page reason to be there).
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }] },
        {
          label: 'Revenue Operations',
          items: [
            { key: 'bills', label: 'Assessment & e-Billing', to: '/bills' },
            { key: 'payments', label: 'Payments', to: '/payments' },
            { key: 'receipts', label: 'e-Receipts', to: '/receipts' },
          ],
        },
        {
          label: 'Finance',
          items: [
            { key: 'reconciliation', label: 'Reconciliation', to: '/reconciliation' },
            { key: 'settlements', label: 'Commission Settlements', to: '/settlements' },
            { key: 'debt', label: 'Debt Management', to: '/debt' },
          ],
        },
        {
          label: 'Administration',
          items: [
            { key: 'revenueItems', label: 'Revenue Items', to: '/revenue-items' },
            { key: 'departments', label: 'Departments', to: '/departments' },
            { key: 'wards', label: 'Wards', to: '/wards' },
            { key: 'reports', label: 'Reports', to: '/reports' },
          ],
        },
      ];
    case 'COUNCIL_AUDITOR':
      // Confirmed live: same read surface as IGR plus settlements and
      // reports (everything transactional, read-only). NOT payers,
      // NOT api-clients, NOT terminals, NOT dashboard/global.
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }] },
        {
          label: 'Revenue Operations',
          items: [
            { key: 'bills', label: 'Assessment & e-Billing', to: '/bills' },
            { key: 'payments', label: 'Payments', to: '/payments' },
            { key: 'receipts', label: 'e-Receipts', to: '/receipts' },
          ],
        },
        {
          label: 'Finance',
          items: [
            { key: 'reconciliation', label: 'Reconciliation', to: '/reconciliation' },
            { key: 'settlements', label: 'Commission Settlements', to: '/settlements' },
            { key: 'debt', label: 'Debt Management', to: '/debt' },
          ],
        },
        {
          label: 'Administration',
          items: [
            { key: 'revenueItems', label: 'Revenue Items', to: '/revenue-items' },
            { key: 'departments', label: 'Departments', to: '/departments' },
            { key: 'wards', label: 'Wards', to: '/wards' },
            { key: 'consultants', label: 'Sub-Consultants', to: '/consultants' },
            { key: 'agents', label: 'Field Agents', to: '/agents' },
            { key: 'audit', label: 'Audit Log', to: '/audit' },
            { key: 'reports', label: 'Reports', to: '/reports' },
          ],
        },
      ];
    case 'COUNCIL_IT':
      // Confirmed live: stakeholders (read+create), consultants/{id}/
      // revenue-officers (its own nested permission, passes despite the
      // parent GET /consultants list 403ing), dashboard, revenue-items/
      // wards/departments/channels (open to all). Zero financial access —
      // bills/payments/receipts/reconciliation/debt/settlements/reports/
      // audit all 403 live.
      //
      // No Field Agents or Sub-Consultants nav link even though this role
      // can create logins on both — GET /api/v1/agents and GET
      // /api/v1/consultants (the list views those pages need to render at
      // all) both 403 for COUNCIL_IT right now, which looks like an
      // oversight against its own "can create agent/officer" grant (flagged
      // back). AgentsPage/ConsultantsPage's own component-level checks
      // already treat COUNCIL_IT correctly for the create actions
      // specifically (see AgentsPage's usesExplicitConsultantPicker and
      // ConsultantsPage's canCreateRevenueOfficer) — once the backend adds
      // list-view read access for COUNCIL_IT on both viewsets, add
      // { key: 'agents', label: 'Field Agents', to: '/agents' } and
      // { key: 'consultants', label: 'Sub-Consultants', to: '/consultants' }
      // back here and nothing else needs to change.
      return [
        { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', to: '/' }] },
        {
          label: 'Administration',
          items: [
            { key: 'revenueItems', label: 'Revenue Items', to: '/revenue-items' },
            { key: 'departments', label: 'Departments', to: '/departments' },
            { key: 'wards', label: 'Wards', to: '/wards' },
            { key: 'stakeholders', label: 'Stakeholders', to: '/stakeholders' },
          ],
        },
      ];
    // Every AccessLevel without a portal nav yet (CONSULTANT_STAFF,
    // AGENT_SUPERVISOR, the platform tier, EXTERNAL_AUDITOR, RATEPAYER*) —
    // this switch previously had no default, so navSectionsFor silently
    // returned undefined for any of these at runtime (TS's return type
    // promised NavSectionDef[] always, which isn't actually true of a
    // no-default switch) and ProtectedLayout's `sections.map(...)` crashed
    // the whole portal shell on login. Same "no meaningful nav, don't crash"
    // fallback as AGENT above, until each of these gets a real case.
    default:
      return [];
  }
}
