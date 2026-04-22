"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Activity, Droplets, Dumbbell, Utensils, Bell } from "lucide-react";

interface AlunoStatus {
  agente_id: string;
  nome: string;
  email: string;
  foto_url?: string;
  treinou_hoje: boolean;
  refeicao_hoje: boolean;
  hidratacao_percentual: number;
  readiness_score: number | null;
  alertas_criticos: number;
  alertas_avisos: number;
  ultimo_treino_dias: number | null;
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
    if (filter === "critical") return a.alertas_criticos > 0;
    if (filter === "inactive")
      return a.ultimo_treino_dias !== null && a.ultimo_treino_dias > 3;
    return true;
  });

  const criticalCount = alunos.filter((a) => a.alertas_criticos > 0).length;

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
            <AlunoCard key={aluno.agente_id} aluno={aluno} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlunoCard({ aluno }: { aluno: AlunoStatus }) {
  const hasCritical = aluno.alertas_criticos > 0;
  const isInactive =
    aluno.ultimo_treino_dias !== null && aluno.ultimo_treino_dias > 3;
  const borderColor = hasCritical
    ? "border-red/40"
    : isInactive
      ? "border-dim3/60"
      : "border-border";

  const readinessColor = !aluno.readiness_score
    ? "text-dim"
    : aluno.readiness_score >= 70
      ? "text-green"
      : aluno.readiness_score >= 40
        ? "text-amber"
        : "text-red";

  return (
    <Link
      href={`/trainer/aluno/${aluno.agente_id}`}
      className={`card p-4 hover:border-cyan/30 transition-colors block ${borderColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center font-bold text-cyan">
            {aluno.nome?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-text text-sm">{aluno.nome}</p>
            <p className="text-xs text-dim">{aluno.email}</p>
          </div>
        </div>

        <div className="flex gap-1">
          {hasCritical && (
            <span className="badge-critical text-[10px] px-1.5 py-0.5">
              {aluno.alertas_criticos > 1 ? `${aluno.alertas_criticos}×` : ""}⚠
            </span>
          )}
          {aluno.alertas_avisos > 0 && (
            <span className="badge-warning text-[10px] px-1.5 py-0.5">
              {aluno.alertas_avisos}
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
          active={aluno.refeicao_hoje}
          label="Comeu"
          color="text-amber"
        />
        <StatusIcon
          icon={Droplets}
          active={aluno.hidratacao_percentual >= 50}
          label={`${aluno.hidratacao_percentual}%`}
          color="text-blue"
        />
        <div className="flex items-center gap-1">
          <Activity className={`w-3.5 h-3.5 ${readinessColor}`} />
          <span className={`text-xs font-medium ${readinessColor}`}>
            {aluno.readiness_score ?? "—"}
          </span>
        </div>
      </div>

      {isInactive && aluno.ultimo_treino_dias !== null && (
        <p className="text-xs text-red/70 mt-2">
          Sem treino há {aluno.ultimo_treino_dias} dias
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
