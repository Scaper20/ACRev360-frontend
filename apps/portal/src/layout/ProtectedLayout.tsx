import type { AccessLevel } from '@acrev360/api';
import { AppShell } from '@acrev360/ui';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { navSectionsFor } from '../nav';
import { MyProfileModal } from './MyProfileModal';

const PAGE_META: Record<string, [string, string]> = {
  '/': ['Revenue Dashboard', 'Real-time position across collections, bills and payers'],
  '/global': ['Global Performance', 'Collections by sub-consultant and by ward'],
  '/payers': ['Payer Registry', 'Enumerated ratepayers and businesses'],
  '/bills': ['Assessment & e-Billing', 'Bills issued against the harmonised chart of revenue'],
  '/payments': ['Payments', 'Confirmed collections across all e-channels'],
  '/receipts': ['e-Receipts', 'Issued receipts and QR/SMS verification'],
  '/reconciliation': ['Reconciliation', 'Platform collections matched against the bank feed'],
  '/settlements': ['Commission Settlements', 'Sub-consultant commission computation and status'],
  '/debt': ['Debt Management', 'Overdue bills and the enforcement ladder'],
  '/revenue-items': ['Revenue Items', 'The harmonised chart of revenue and its rates'],
  '/consultants': ['Sub-Consultants', 'Portfolio holders onboarded to the platform'],
  '/agents': ['Field Agents', 'Collection agents deployed to wards'],
  '/stakeholders': ['Stakeholders', 'Read-only oversight accounts'],
  '/terminals': ['POS Terminal Fleet', 'Deployed terminals and lifetime collections'],
  '/channels': ['e-Channel Config', 'Payment channel catalogue and API credentials'],
  '/audit': ['Audit Log', 'Immutable trail of sensitive actions'],
};

export function ProtectedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null; // RequireAuth already guards this, but keeps TS happy
  const sections = navSectionsFor(user.access_level as AccessLevel);
  const [title, subtitle] = PAGE_META[location.pathname] ?? ['ACRev360', ''];

  return (
    <>
      <AppShell
        logoInitials="AR"
        productName="ACRev360"
        tenantLabel={user.council_code || 'Platform'}
        sections={sections.map((s) => ({
          label: s.label,
          items: s.items.map((item) => ({
            key: item.key,
            label: item.label,
            href: item.to,
            active: location.pathname === item.to,
            onClick: () => navigate(item.to),
          })),
        }))}
        footer="ACRev360 — Revenue Administration & Collection"
        pageTitle={title}
        pageSubtitle={subtitle}
        userName={user.full_name}
        userRole={user.role_name}
        onSignOut={() => void logout()}
        onProfileClick={() => setProfileOpen(true)}
      >
        <Outlet />
      </AppShell>
      {profileOpen && <MyProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
}
