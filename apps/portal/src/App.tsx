import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { ProtectedLayout } from './layout/ProtectedLayout';
import { GlobalPerformancePage } from './routes/GlobalPerformancePage';
import { DashboardPage } from './routes/DashboardPage';
import { LoginPage } from './routes/LoginPage';
import { PayerListPage } from './routes/payers/PayerListPage';
import { BillListPage } from './routes/bills/BillListPage';
import { PaymentsPage } from './routes/payments/PaymentsPage';
import { ReceiptsPage } from './routes/receipts/ReceiptsPage';
import { ReconciliationPage } from './routes/reconciliation/ReconciliationPage';
import { SettlementsPage } from './routes/settlements/SettlementsPage';
import { DebtPage } from './routes/debt/DebtPage';
import { RevenueItemsPage } from './routes/revenue-items/RevenueItemsPage';
import { ConsultantsPage } from './routes/consultants/ConsultantsPage';
import { AgentsPage } from './routes/agents/AgentsPage';
import { StakeholdersPage } from './routes/stakeholders/StakeholdersPage';
import { TerminalsPage } from './routes/terminals/TerminalsPage';
import { ChannelsPage } from './routes/channels/ChannelsPage';
import { AuditPage } from './routes/audit/AuditPage';
import { OnboardCouncilPage } from './routes/platform/OnboardCouncilPage';
import { DemandBillPrint } from './routes/print/DemandBillPrint';
import { DemandNoticePrint } from './routes/print/DemandNoticePrint';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Genuinely public, unauthenticated — mirrors GET /api/v1/bills/{bill_ref}
          itself being public (its own docstring: "Powers the demand-notice/
          demand-bill print pages and USSD"). No AppShell/nav; DocViewer loads
          these into an iframe from BillDetailModal, but they also work fine
          visited directly. */}
      <Route path="/print/demand-bill" element={<DemandBillPrint />} />
      <Route path="/print/demand-notice" element={<DemandNoticePrint />} />
      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/global" element={<GlobalPerformancePage />} />
          <Route path="/payers" element={<PayerListPage />} />
          <Route path="/bills" element={<BillListPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/settlements" element={<SettlementsPage />} />
          <Route path="/debt" element={<DebtPage />} />
          <Route path="/revenue-items" element={<RevenueItemsPage />} />
          <Route path="/consultants" element={<ConsultantsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/stakeholders" element={<StakeholdersPage />} />
          <Route path="/terminals" element={<TerminalsPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>
        {/* Platform-level, not business-role nav — see OnboardCouncilPage's own comment */}
        <Route path="/platform/onboard-council" element={<OnboardCouncilPage />} />
      </Route>
    </Routes>
  );
}
