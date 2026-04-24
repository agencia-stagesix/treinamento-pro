"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Activity, Droplets, Dumbbell, Utensils } from "lucide-react";

interface AlunoStatus {
  agente: { id: string; nome: string; foto_url?: string };
  ultimo_peso?: number;
  treinou_hoje: boolean;
  registrou_refeicao_hoje: boolean;
  hidratacao_hoje_ml: number;
  hidratacao_meta_ml: number;
  readiness_hoje: number | null;
  dias_sem_registro: number;
  alertas_ativos: Array<{
    id: string;
    severidade: "info" | "warning" | "critical";
  }>;
}

export default function TrainerDashboardPage() {
  const [alunos, setAlunos] = useState<AlunoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "inactive">("all");

  const load = useCallback(async () => {
    const r = (await api.dashboard.esquadrao()) as any;
    setAlunos(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = alunos.filter((a) => {
    if (filter === "critical")
      return a.alertas_ativos.some((x) => x.severidade === "critical");
    if (filter === "inactive") return a.dias_sem_registro > 3;
    return true;
  });

  const criticalCount = alunos.filter((a) =>
    a.alertas_ativos.some((x) => x.severidade === "critical"),
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text">Esquadrão</h2>
          <p className="text-dim text-sm mt-0.5">
            {alunos.length} alunos ativos
            {criticalCount > 0 ? ` · ${criticalCount} alertas críticos` : ""}
          </p>
        </div>
        <div className="flex gap-1 bg-border rounded-xl p-1">
          {(
            [
              ["all", "Todos"],
              ["critical", "🔴 Críticos"],
              ["inactive", "⚪ Inativos"],
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
          <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-dim">
            Nenhum aluno{" "}
            {filter !== "all" ? "nessa categoria" : "cadastrado ainda"}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((aluno) => (
            <AlunoCard key={aluno.agente.id} aluno={aluno} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlunoCard({ aluno }: { aluno: AlunoStatus }) {
  const alertasCriticos = aluno.alertas_ativos.filter(
    (x) => x.severidade === "critical",
  ).length;
  const alertasAviso = aluno.alertas_ativos.filter(
    (x) => x.severidade === "warning",
  ).length;
  const hasCritical = alertasCriticos > 0;
  const isInactive = aluno.dias_sem_registro > 3;
  const borderColor = hasCritical
    ? "border-red/40"
    : isInactive
      ? "border-dim3/60"
      : "border-border";

  const readinessColor = !aluno.readiness_hoje
    ? "text-dim"
    : aluno.readiness_hoje >= 70
      ? "text-green"
      : aluno.readiness_hoje >= 40
        ? "text-amber"
        : "text-red";

  return (
    <Link
      href={`/trainer/aluno/${aluno.agente.id}`}
      className={`card p-4 hover:border-cyan/30 transition-colors block ${borderColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center font-bold text-cyan">
            {aluno.agente.nome?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-text text-sm">
              {aluno.agente.nome}
            </p>
            <p className="text-xs text-dim">
              Peso atual: {aluno.ultimo_peso ? `${aluno.ultimo_peso} kg` : "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {hasCritical && (
            <span className="badge-critical text-[10px] px-1.5 py-0.5">
              {alertasCriticos > 1 ? `${alertasCriticos}×` : ""}⚠
            </span>
          )}
          {alertasAviso > 0 && (
            <span className="badge-warning text-[10px] px-1.5 py-0.5">
              {alertasAviso}
            </span>
          )}
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-4 flex-wrap">
        <StatusIcon
          icon={Dumbbell}
          active={aluno.treinou_hoje}
          label="Treinou"
          color="text-purple"
        />
        <StatusIcon
          icon={Utensils}
          active={aluno.registrou_refeicao_hoje}
          label="Comeu"
          color="text-amber"
        />
        <StatusIcon
          icon={Droplets}
          active={
            aluno.hidratacao_hoje_ml >=
            Math.round((aluno.hidratacao_meta_ml ?? 4000) * 0.5)
          }
          label={`${Math.round(((aluno.hidratacao_hoje_ml ?? 0) * 100) / Math.max(aluno.hidratacao_meta_ml ?? 1, 1))}%`}
          color="text-blue"
        />
        <div className="flex items-center gap-1">
          <Activity className={`w-3.5 h-3.5 ${readinessColor}`} />
          <span className={`text-xs font-medium ${readinessColor}`}>
            {aluno.readiness_hoje ?? "—"}
          </span>
        </div>
      </div>

      {isInactive && (
        <p className="text-xs text-red/70 mt-2">
          Sem registro há {aluno.dias_sem_registro} dias
        </p>
      )}
    </Link>
  );
}

function StatusIcon({
  icon: Icon,
  active,
  label,
  color,
}: {
  icon: any;
  active: boolean;
  label: string;
  color: string;
}) {
  return (
    <div
      className={`flex items-center gap-1 ${active ? color : "text-dim/40"}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
