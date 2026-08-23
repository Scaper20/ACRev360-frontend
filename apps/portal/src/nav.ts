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
            { key: 'wards', label: 'Wards', to: '/wards' },
            { key: 'consultants', label: 'Sub-Consultants', to: '/consultants' },
            { key: 'agents', label: 'Field Agents', to: '/agents' },
            { key: 'stakeholders', label: 'Stakeholders', to: '/stakeholders' },
            { key: 'terminals', label: 'POS Terminal Fleet', to: '/terminals' },
            { key: 'channels', label: 'e-Channel Config', to: '/channels' },
            { key: 'audit', label: 'Audit Log', to: '/audit' },
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
  }
}
