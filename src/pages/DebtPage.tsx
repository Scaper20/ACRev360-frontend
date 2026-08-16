import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { StatusTag } from "../components/StatusTag";

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

const LADDER = ["NONE", "FIRST_NOTICE", "FINAL_NOTICE", "ENFORCEMENT", "LEGAL", "CLOSED"];

export function DebtPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["debt"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/debt");
      if (error) throw error;
      return data;
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/debt/refresh");
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["debt"] }),
  });

  const escalate = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await api.POST("/api/v1/debt/{id}/escalate", { params: { path: { id: String(id) } } });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["debt"] }),
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Debt Management"
        actions={
          <Button variant="ghost" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            {refresh.isPending ? "Refreshing…" : "Refresh Ageing"}
          </Button>
        }
      />

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="No open debt cases."
            columns={[
              { header: "Bill Ref", render: (r) => <span className="num">{r.bill_ref}</span> },
              { header: "Payer", render: (r) => r.full_name },
              { header: "Balance", render: (r) => <span className="num">{naira(r.balance)}</span> },
              { header: "Ageing", render: (r) => r.ageing_bucket.replace(/_/g, "-") },
              { header: "Stage", render: (r) => <StatusTag status={r.enforcement_stage} /> },
              { header: "Reminders", render: (r) => r.reminder_count },
              {
                header: "",
                render: (r) => {
                  const idx = LADDER.indexOf(r.enforcement_stage);
                  const next = LADDER[idx + 1];
                  return next && next !== "CLOSED" ? (
                    <Button variant="ghost" disabled={escalate.isPending} onClick={() => escalate.mutate(r.id)}>
                      Escalate → {next.replace(/_/g, " ")}
                    </Button>
                  ) : null;
                },
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
