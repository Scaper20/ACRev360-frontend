import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { StatusTag } from "../components/StatusTag";

export function TerminalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["terminals"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/terminals");
      if (error) throw error;
      return data;
    },
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="POS Terminal Fleet" />
      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="No POS terminals registered yet."
            columns={[
              { header: "Terminal ID", render: (r) => <span className="num">{r.terminal_id}</span> },
              { header: "Status", render: (r) => <StatusTag status={r.status ?? "ACTIVE"} /> },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
