import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AgentsPage } from "./pages/AgentsPage";
import { AuditPage } from "./pages/AuditPage";
import { BillsPage } from "./pages/BillsPage";
import { ConsultantsPage } from "./pages/ConsultantsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DebtPage } from "./pages/DebtPage";
import { GlobalPerformancePage } from "./pages/GlobalPerformancePage";
import { LoginPage } from "./pages/LoginPage";
import { PayersPage } from "./pages/PayersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ReceiptsPage } from "./pages/ReceiptsPage";
import { ReconciliationPage } from "./pages/ReconciliationPage";
import { RevenueItemsPage } from "./pages/RevenueItemsPage";
import { SettlementsPage } from "./pages/SettlementsPage";
import { TerminalsPage } from "./pages/TerminalsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/global" element={<GlobalPerformancePage />} />
        <Route path="/payers" element={<PayersPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/reconciliation" element={<ReconciliationPage />} />
        <Route path="/settlements" element={<SettlementsPage />} />
        <Route path="/debt" element={<DebtPage />} />
        <Route path="/revenue-items" element={<RevenueItemsPage />} />
        <Route path="/consultants" element={<ConsultantsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/terminals" element={<TerminalsPage />} />
        <Route path="/audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
