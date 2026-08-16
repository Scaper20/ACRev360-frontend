import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StatusTag } from "../components/StatusTag";
import type { components } from "../api/schema";

const NEXT_STATUS: Record<string, components["schemas"]["Status5d5Enum"] | null> = {
  COMPUTED: "APPROVED",
  APPROVED: "SETTLED",
  SETTLED: null,
  DISPUTED: null,
};

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function SettlementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === "COUNCIL_ADMIN";
  const queryClient = useQueryClient();
  const [computing, setComputing] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["settlements"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/settlements");
      if (error) throw error;
      return data;
    },
  });

  const compute = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/settlements/compute", {
        body: { period_start: periodStart, period_end: periodEnd },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      setComputing(false);
    },
    onError: () => setError("Couldn't compute settlements for that period."),
  });

  const advanceStatus = useMutation({
    mutationFn: async (vars: { id: number; status: components["schemas"]["Status5d5Enum"] }) => {
      const { error } = await api.POST("/api/v1/settlements/{id}/status_change", {
        params: { path: { id: String(vars.id) } },
        body: { status: vars.status },
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Commission Settlements"
        actions={isAdmin && <Button onClick={() => setComputing(true)}>Compute Settlements</Button>}
      />

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="No settlements computed yet."
            columns={[
              { header: "Consultant", render: (r) => r.consultant_name },
              { header: "Period", render: (r) => `${r.period_start} → ${r.period_end}` },
              { header: "Gross collections", render: (r) => <span className="num">{naira(r.gross_collections)}</span> },
              { header: "Rate", render: (r) => <span className="num">{r.commission_rate}%</span> },
              { header: "Commission", render: (r) => <span className="num">{naira(r.commission_amount)}</span> },
              { header: "Status", render: (r) => <StatusTag status={r.status} /> },
              ...(isAdmin
                ? [{
                    header: "",
                    render: (r: components["schemas"]["CommissionSettlement"]) => {
                      const next = NEXT_STATUS[r.status];
                      return next ? (
                        <Button variant="ghost" onClick={() => advanceStatus.mutate({ id: r.id, status: next })} disabled={advanceStatus.isPending}>
                          Mark {next}
                        </Button>
                      ) : null;
                    },
                  }]
                : []),
            ]}
          />
        )}
      </div>

      {computing && (
        <Modal
          title="Compute Settlements"
          onClose={() => setComputing(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setComputing(false)}>Cancel</Button>
              <Button disabled={compute.isPending || !periodStart || !periodEnd} onClick={() => compute.mutate()}>
                {compute.isPending ? "Computing…" : "Compute"}
              </Button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <label className="field">
            <span>Period start</span>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </label>
          <label className="field">
            <span>Period end</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </label>
        </Modal>
      )}
    </AppShell>
  );
}
