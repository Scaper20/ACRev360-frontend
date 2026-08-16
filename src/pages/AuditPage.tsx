import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";

export function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/audit");
      if (error) throw error;
      return data;
    },
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="Audit Log" />
      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="No audit events recorded yet."
            columns={[
              { header: "When", render: (r) => new Date(r.created_at).toLocaleString() },
              { header: "Actor", render: (r) => r.actor_username || "—" },
              { header: "Action", render: (r) => r.action.replace(/_/g, " ") },
              { header: "Entity", render: (r) => `${r.entity_type} #${r.entity_id}` },
              { header: "IP", render: (r) => r.actor_ip || "—" },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
