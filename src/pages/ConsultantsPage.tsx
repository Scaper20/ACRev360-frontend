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

type SubConsultant = components["schemas"]["SubConsultant"];
const STATUSES: components["schemas"]["StatusC83Enum"][] = ["PENDING", "ACTIVE", "SUSPENDED", "EXITED"];

export function ConsultantsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === "COUNCIL_ADMIN";
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubConsultant | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["consultants"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/consultants");
      if (error) throw error;
      return data;
    },
  });

  const { data: revenueItems } = useQuery({
    queryKey: ["revenue-items"],
    queryFn: async () => (await api.GET("/api/v1/revenue-items")).data,
  });

  const { data: portfolio, refetch: refetchPortfolio } = useQuery({
    queryKey: ["portfolio", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/consultants/{id}/portfolio", {
        params: { path: { id: String(selected!.id) } },
      });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/v1/consultants", {
        body: { consultant_name: name, contract_ref: contractRef, commission_rate: commissionRate },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultants"] });
      setCreating(false);
      setName(""); setContractRef(""); setCommissionRate("");
    },
    onError: () => setError("Couldn't onboard this consultant — check the contract reference is unique."),
  });

  const changeStatus = useMutation({
    mutationFn: async (vars: { id: number; status: components["schemas"]["StatusC83Enum"] }) => {
      const { error } = await api.POST("/api/v1/consultants/{id}/status_change", {
        params: { path: { id: String(vars.id) } },
        body: { status: vars.status },
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
  });

  const [newPortfolioItem, setNewPortfolioItem] = useState<number | null>(null);
  const assignPortfolio = useMutation({
    mutationFn: async () => {
      if (!selected || !newPortfolioItem) return;
      const { error } = await api.POST("/api/v1/consultants/{id}/portfolio", {
        params: { path: { id: String(selected.id) } },
        body: { consultant: selected.id, council_revenue_item: newPortfolioItem },
      });
      if (error) throw error;
    },
    onSuccess: () => { refetchPortfolio(); setNewPortfolioItem(null); },
  });

  const revokePortfolio = useMutation({
    mutationFn: async (portfolioId: number) => {
      if (!selected) return;
      const { error } = await api.POST("/api/v1/consultants/{id}/portfolio/{portfolio_id}/end", {
        params: { path: { id: String(selected.id), portfolio_id: portfolioId } },
      });
      if (error) throw error;
    },
    onSuccess: () => refetchPortfolio(),
  });

  const rows = data?.results ?? [];
  const revenueItemOptions = revenueItems?.results ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Sub-Consultants"
        actions={isAdmin && <Button onClick={() => setCreating(true)}>Onboard Consultant</Button>}
      />

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            emptyMessage="No sub-consultants onboarded yet."
            columns={[
              { header: "Name", render: (r) => r.consultant_name },
              { header: "Contract Ref", render: (r) => <span className="num">{r.contract_ref}</span> },
              { header: "Commission", render: (r) => <span className="num">{r.commission_rate}%</span> },
              { header: "Status", render: (r) => <StatusTag status={r.status} /> },
            ]}
          />
        )}
      </div>

      {creating && (
        <Modal
          title="Onboard Consultant"
          onClose={() => setCreating(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button disabled={create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? "Onboarding…" : "Onboard"}
              </Button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <label className="field"><span>Consultant name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="field"><span>Contract reference</span><input value={contractRef} onChange={(e) => setContractRef(e.target.value)} /></label>
          <label className="field"><span>Commission rate (%)</span><input type="number" min="0" max="100" step="0.01" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></label>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.consultant_name} onClose={() => setSelected(null)} wide>
          <div className="detail-grid">
            <div className="detail-item"><span className="label">Contract</span><span className="value num">{selected.contract_ref}</span></div>
            <div className="detail-item"><span className="label">Commission</span><span className="value num">{selected.commission_rate}%</span></div>
            <div className="detail-item"><span className="label">Status</span><span className="value"><StatusTag status={selected.status} /></span></div>
          </div>

          {isAdmin && (
            <div className="toolbar">
              {STATUSES.filter((s) => s !== selected.status).map((s) => (
                <Button key={s} variant="ghost" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: selected.id, status: s })}>
                  Mark {s}
                </Button>
              ))}
            </div>
          )}

          <div>
            <h2>Portfolio</h2>
            {isAdmin && (
              <div className="line-row">
                <select value={newPortfolioItem ?? ""} onChange={(e) => setNewPortfolioItem(Number(e.target.value))}>
                  <option value="">Select a revenue item to assign…</option>
                  {revenueItemOptions.map((item) => (
                    <option key={item.id} value={item.id}>{item.harmonised_code} — {item.item_name}</option>
                  ))}
                </select>
                <Button disabled={!newPortfolioItem || assignPortfolio.isPending} onClick={() => assignPortfolio.mutate()}>Assign</Button>
              </div>
            )}
            <DataTable
              rows={portfolio ?? []}
              rowKey={(p) => p.id}
              emptyMessage="No revenue items assigned to this consultant yet."
              columns={[
                {
                  header: "Item",
                  render: (p) => {
                    const item = revenueItemOptions.find((i) => i.id === p.council_revenue_item);
                    return item ? `${item.harmonised_code} — ${item.item_name}` : p.council_revenue_item;
                  },
                },
                { header: "Since", render: (p) => p.effective_from },
                ...(isAdmin
                  ? [{
                      header: "",
                      render: (p: components["schemas"]["ConsultantPortfolio"]) => (
                        <Button variant="ghost" disabled={revokePortfolio.isPending} onClick={() => revokePortfolio.mutate(p.id)}>Revoke</Button>
                      ),
                    }]
                  : []),
              ]}
            />
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
