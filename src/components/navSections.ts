// Per-role navigation map — docs/APP_FLOW.md §2. A role never sees a nav item
// it isn't allowed to act on. "Reports" (custom report builder) is omitted:
// it's V2_ARCHITECTURE.md §11 phase 4, not built yet on the backend.
export interface NavItem {
  label: string;
  to: string;
}
export interface NavSection {
  section: string;
  items: NavItem[];
}

const DASHBOARD: NavItem = { label: "Dashboard", to: "/" };
const GLOBAL_PERFORMANCE: NavItem = { label: "Global Performance", to: "/global" };
const PAYER_REGISTRY: NavItem = { label: "Payer Registry", to: "/payers" };
const BILLING: NavItem = { label: "Assessment & e-Billing", to: "/bills" };
const PAYMENTS: NavItem = { label: "Payments", to: "/payments" };
const RECEIPTS: NavItem = { label: "e-Receipts", to: "/receipts" };
const RECONCILIATION: NavItem = { label: "Reconciliation", to: "/reconciliation" };
const SETTLEMENTS: NavItem = { label: "Commission Settlements", to: "/settlements" };
const DEBT: NavItem = { label: "Debt Management", to: "/debt" };
const REVENUE_ITEMS: NavItem = { label: "Revenue Items", to: "/revenue-items" };
const CONSULTANTS: NavItem = { label: "Sub-Consultants", to: "/consultants" };
const AGENTS: NavItem = { label: "Field Agents", to: "/agents" };
const TERMINALS: NavItem = { label: "POS Terminal Fleet", to: "/terminals" };
const AUDIT: NavItem = { label: "Audit Log", to: "/audit" };

export const NAV_SECTIONS: Record<string, NavSection[]> = {
  COUNCIL_ADMIN: [
    { section: "Overview", items: [DASHBOARD, GLOBAL_PERFORMANCE] },
    { section: "Revenue Ops", items: [PAYER_REGISTRY, BILLING, PAYMENTS, RECEIPTS] },
    { section: "Finance", items: [RECONCILIATION, SETTLEMENTS, DEBT] },
    { section: "Administration", items: [REVENUE_ITEMS, CONSULTANTS, AGENTS, TERMINALS, AUDIT] },
  ],
  CONSULTANT: [
    { section: "Overview", items: [DASHBOARD] },
    { section: "Revenue Ops", items: [PAYER_REGISTRY, BILLING, PAYMENTS, RECEIPTS] },
    { section: "Finance", items: [RECONCILIATION, SETTLEMENTS, DEBT] },
    { section: "Team", items: [AGENTS, TERMINALS] },
  ],
  GLOBAL_VIEW: [
    { section: "Overview", items: [DASHBOARD, GLOBAL_PERFORMANCE] },
    { section: "Administration", items: [CONSULTANTS] },
  ],
};
