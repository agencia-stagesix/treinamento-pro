"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCheck } from "lucide-react";

const SEV_LABEL: Record<string, string> = {
  critico: "🔴 Crítico",
  aviso: "🟡 Aviso",
  info: "⚪ Info",
};
const SEV_CLASS: Record<string, string> = {
  critico: "badge-critical",
  aviso: "badge-warning",
  info: "badge-info",
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"nao_lidas" | "todas">("nao_lidas");

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    const r = (await api.dashboard.alertas({
      apenasNaoLidos: filter === "nao_lidas",
    })) as any;
    setAlertas(r.data ?? []);
    setLoading(false);
  }

  async function marcarLido(id: string) {
    await api.dashboard.marcarAlertaLido(id);
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-text">Alertas</h2>
        <div className="flex gap-1 bg-border rounded-xl p-1">
          {(
            [
              ["nao_lidas", "Não lidas"],
              ["todas", "Todas"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === val ? "bg-cyan text-bg" : "text-dim hover:text-text"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alertas.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCheck className="w-10 h-10 text-green mx-auto mb-3" />
          <p className="text-text font-medium">
            Sem alertas {filter === "nao_lidas" ? "não lidos" : ""}
          </p>
          <p className="text-dim text-sm mt-1">
            Tudo sob controle no esquadrão 💪
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alertas.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`${SEV_CLASS[a.severidade] ?? "badge-info"} text-xs`}
                    >
                      {SEV_LABEL[a.severidade] ?? a.severidade}
                    </span>
                    <span className="text-xs text-dim">
                      {a.tipo?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-dim ml-auto">
                      {new Date(a.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {a.agente && (
                    <p className="text-sm font-semibold text-text mb-1">
                      {a.agente.nome}
                    </p>
                  )}
                  <p className="text-sm text-dim">{a.mensagem}</p>
                </div>
                {!a.lido && (
                  <button
                    onClick={() => marcarLido(a.id)}
                    className="shrink-0 text-dim hover:text-green p-1"
                    title="Marcar como lido"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
