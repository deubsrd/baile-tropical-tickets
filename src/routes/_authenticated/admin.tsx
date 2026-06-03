import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAdminDashboard, listAllTickets, updateEventConfig, deleteTicket } from "@/lib/admin.functions";
import { formatBRL } from "@/lib/event";
import { maskCPFForDisplay } from "@/lib/cpf";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Baile do Havaí" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const dashFn = useServerFn(getAdminDashboard);
  const ticketsFn = useServerFn(listAllTickets);
  const updateFn = useServerFn(updateEventConfig);
  const deleteFn = useServerFn(deleteTicket);
  const qc = useQueryClient();

  const dash = useQuery({ queryKey: ["admin-dash"], queryFn: () => dashFn() });
  const tix = useQuery({ queryKey: ["admin-tickets"], queryFn: () => ticketsFn() });

  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "military" | "civil">("all");
  const [search, setSearch] = useState("");
  const [limitDraft, setLimitDraft] = useState<string>("");

  const filtered = useMemo(() => {
    return (tix.data ?? []).filter((t) => {
      const status = (t.orders as { status: string }).status;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (typeFilter !== "all" && t.participant_type !== typeFilter) return false;
      if (search && !t.participant_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tix.data, statusFilter, typeFilter, search]);

  const exportCsv = () => {
    const header = ["Nome", "Tipo", "Posto", "CPF", "Email", "Telefone", "Nascimento", "Valor", "Status", "Compra"];
    const rows = filtered.map((t) => [
      t.participant_name,
      t.participant_type === "military" ? "Militar" : "Civil",
      t.military_rank ?? "",
      maskCPFForDisplay(t.participant_cpf),
      t.participant_email,
      t.participant_phone,
      t.participant_birthdate,
      formatBRL(t.amount),
      (t.orders as { status: string }).status,
      new Date(t.created_at).toLocaleString("pt-BR"),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baile-havai-inscritos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveLimit = async () => {
    const n = parseInt(limitDraft);
    if (!n) return;
    try {
      await updateFn({ data: { ticket_limit: n } });
      toast.success("Limite atualizado");
      qc.invalidateQueries({ queryKey: ["admin-dash"] });
      setLimitDraft("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleFrozen = async () => {
    if (!dash.data) return;
    try {
      await updateFn({ data: { sales_frozen: !dash.data.frozen } });
      qc.invalidateQueries({ queryKey: ["admin-dash"] });
      qc.invalidateQueries({ queryKey: ["sales-availability"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (ticketId: string, name: string) => {
    if (!confirm(`Excluir ingresso de ${name}? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteFn({ data: { ticketId } });
      toast.success("Ingresso excluído");
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-dash"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  if (dash.isLoading) return <div className="p-8 text-sand">Carregando...</div>;
  if (dash.error) return <div className="p-8 text-destructive">{(dash.error as Error).message}</div>;
  const d = dash.data!;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-4xl text-gold">PAINEL ADMIN</h1>
        <button onClick={logout} className="text-sand text-sm underline">Sair</button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat icon="💰" label="Arrecadado" value={formatBRL(d.revenueCents)} />
        <Stat icon="🎟️" label="Vendidos" value={String(d.adultSold)} />
        <Stat icon="👥" label="Vagas restantes" value={String(d.remaining)} />
        <Stat icon="📊" label="Ocupação" value={`${d.occupancy}%`} />
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="text-sm text-sand mb-2">Ocupação: {d.adultSold} / {d.limit}</div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-tropical" style={{ width: `${d.occupancy}%` }} />
        </div>
      </div>

      {/* CONFIG */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-sand">Limite de ingressos (atual: {d.limit})</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number" value={limitDraft} onChange={(e) => setLimitDraft(e.target.value)}
              placeholder={String(d.limit)}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2"
            />
            <button onClick={saveLimit} className="bg-gold text-gold-foreground px-4 rounded-lg">Salvar</button>
          </div>
        </div>
        <div>
          <label className="text-sm text-sand">Estado das vendas</label>
          <button
            onClick={toggleFrozen}
            className={`mt-1 w-full py-2 rounded-lg font-display tracking-wider ${
              d.frozen ? "bg-hibiscus text-white" : "bg-tropical text-white"
            }`}
          >
            {d.frozen ? "🛑 VENDAS CONGELADAS (clique p/ abrir)" : "✅ VENDAS ABERTAS (clique p/ congelar)"}
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-input border border-border rounded-lg px-3 py-2"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-input border border-border rounded-lg px-3 py-2">
          <option value="all">Todos status</option>
          <option value="confirmed">Confirmados</option>
          <option value="pending">Pendentes</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="bg-input border border-border rounded-lg px-3 py-2">
          <option value="all">Todos tipos</option>
          <option value="military">Militar</option>
          <option value="civil">Civil</option>
        </select>
        <button onClick={exportCsv} className="bg-gold text-gold-foreground px-4 py-2 rounded-lg">📥 Exportar CSV</button>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-sand">
            <tr>
              {["Nome", "Tipo", "Posto", "CPF", "Email", "Telefone", "Nasc.", "Valor", "Status", "Compra", "Ações"].map((h) => (
                <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const status = (t.orders as { status: string }).status;
              return (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2">{t.participant_name}</td>
                  <td className="px-3 py-2">{t.participant_type === "military" ? "Militar" : "Civil"}</td>
                  <td className="px-3 py-2">{t.military_rank ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">{maskCPFForDisplay(t.participant_cpf)}</td>
                  <td className="px-3 py-2">{t.participant_email}</td>
                  <td className="px-3 py-2">{t.participant_phone}</td>
                  <td className="px-3 py-2">{t.participant_birthdate}</td>
                  <td className="px-3 py-2">{formatBRL(t.amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      status === "confirmed" ? "bg-tropical/30 text-tropical" :
                      status === "pending" ? "bg-gold/30 text-gold" : "bg-destructive/30 text-destructive"
                    }`}>{status}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-8 text-sand/60">Nenhum registro</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-2xl">{icon}</div>
      <div className="text-xs text-sand uppercase tracking-wider mt-1">{label}</div>
      <div className="font-display text-2xl text-gold mt-1">{value}</div>
    </div>
  );
}
