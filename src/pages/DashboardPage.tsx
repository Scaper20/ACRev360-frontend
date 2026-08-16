import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { StatCard } from "../components/StatCard";

function formatNaira(value: string): string {
  const amount = Number(value);
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/dashboard/summary");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <h1 className="display">Dashboard</h1>

      {isLoading && <p>Loading dashboard…</p>}
      {isError && <div className="error-banner">Couldn't load the dashboard: {String(error)}</div>}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Billed" value={formatNaira(data.billed)} accent="brass" />
            <StatCard label="Collected" value={formatNaira(data.collected)} accent="green" />
            <StatCard label="Outstanding" value={formatNaira(data.outstanding)} accent="teal" />
          </div>

          <div className="card">
            <h2>Bills by status</h2>
            <div className="bills-by-status">
              {data.bills_by_status.length === 0 && <p>No bills yet.</p>}
              {data.bills_by_status.map((row) => (
                <span key={row.status} className="tag tag-ok">
                  {row.status}: {row.count}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
