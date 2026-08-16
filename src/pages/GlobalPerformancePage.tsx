import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function GlobalPerformancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-global"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/dashboard/global");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <PageHeader title="Global Performance" />
      {isLoading && <p>Loading…</p>}
      {data && (
        <>
          <div className="card">
            <h2>Collected by consultant</h2>
            <DataTable
              rows={data.by_consultant}
              rowKey={(r) => r.consultant_name}
              emptyMessage="No collections yet."
              columns={[
                { header: "Consultant", render: (r) => r.consultant_name },
                { header: "Collected", render: (r) => <span className="num">{naira(r.collected)}</span> },
              ]}
            />
          </div>
          <div className="card">
            <h2>Collected by ward</h2>
            <DataTable
              rows={data.by_ward}
              rowKey={(r) => r.ward_name ?? "—"}
              emptyMessage="No collections yet."
              columns={[
                { header: "Ward", render: (r) => r.ward_name ?? "—" },
                { header: "Collected", render: (r) => <span className="num">{naira(r.collected)}</span> },
              ]}
            />
          </div>
        </>
      )}
    </AppShell>
  );
}
