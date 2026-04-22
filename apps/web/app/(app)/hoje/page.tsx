"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Droplets,
  Dumbbell,
  Utensils,
  Scale,
  Plus,
  Minus,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { api, getStoredUser } from "@/lib/api";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface HidratacaoData {
  total_ml: number;
  meta_ml: number;
  percentual: number;
}

interface BiometriaSummary {
  ultimo_peso: number | null;
  variacao_peso_7d: number | null;
  ultimo_percentual_gordura: number | null;
  ultima_massa_muscular: number | null;
  tendencia: "subindo" | "descendo" | "estavel";
}

interface ReadinessData {
  score_calculado: number | null;
}

export default function HojePage() {
  const user = getStoredUser();
  const [hidratacao, setHidratacao] = useState<HidratacaoData | null>(null);
  const [biometria, setBiometria] = useState<BiometriaSummary | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [treinosHoje, setTreinosHoje] = useState(0);
  const [refeicoesHoje, setRefeicoesHoje] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBioForm, setShowBioForm] = useState(false);
  const [showTreinoForm, setShowTreinoForm] = useState(false);
  const [showRefeicaoForm, setShowRefeicaoForm] = useState(false);
  const [showReadinessForm, setShowReadinessForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [hid, bio, read, treinos, refeicoes] = await Promise.allSettled([
        api.hidratacao.hoje(),
        api.biometria.summary(),
        api.readiness.hoje(),
        api.treinos.list({ limit: 1 }),
        api.refeicoes.hoje(),
      ]);

      if (hid.status === "fulfilled") setHidratacao((hid.value as any).data);
      if (bio.status === "fulfilled") setBiometria((bio.value as any).data);
      if (read.status === "fulfilled") setReadiness((read.value as any).data);
      if (treinos.status === "fulfilled") {
        const today = new Date().toISOString().split("T")[0];
        const count = ((treinos.value as any).data ?? []).filter(
          (t: any) => t.data_treino === today,
        ).length;
        setTreinosHoje(count);
      }
      if (refeicoes.status === "fulfilled") {
        setRefeicoesHoje(((refeicoes.value as any).data ?? []).length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addAgua(ml: number) {
    if (ml < 0 && !hidratacao?.total_ml) return;
    await api.hidratacao.add(Math.abs(ml));
    loadData();
  }

  const score = readiness?.score_calculado;
  const scoreColor = !score
    ? "text-dim"
    : score >= 70
      ? "text-green"
      : score >= 40
        ? "text-amber"
        : "text-red";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-text">
          Olá, {user?.nome?.split(" ")[0] ?? "Agente"} 👋
        </h2>
        <p className="text-dim text-sm mt-0.5">Aqui está seu resumo de hoje</p>
      </div>

      {/* Readiness Score */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="section-title mb-0">Score de Readiness</span>
          {!readiness ? (
            <button
              onClick={() => setShowReadinessForm(true)}
              className="text-xs text-cyan border border-cyan/30 rounded-lg px-3 py-1 hover:bg-cyan/10"
            >
              Registrar
            </button>
          ) : null}
        </div>
        {readiness ? (
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${scoreColor}`}>
              {readiness.score_calculado}
            </div>
            <div className="flex-1">
              <ProgressBar
                value={readiness.score_calculado ?? 0}
                color={
                  !score
                    ? "cyan"
                    : score >= 70
                      ? "green"
                      : score >= 40
                        ? "amber"
                        : "red"
                }
                size="lg"
              />
              <p className="text-xs text-dim mt-1">
                {!score
                  ? "—"
                  : score >= 70
                    ? "🟢 Pronto para treinar"
                    : score >= 40
                      ? "🟡 Intensidade moderada"
                      : "🔴 Recuperação recomendada"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-dim text-sm">
            Responda o questionário rápido para ver seu readiness
          </p>
        )}
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale className="w-4 h-4 text-cyan" />
            <span className="text-xs text-dim">Último peso</span>
          </div>
          <div className="metric-value text-cyan">
            {biometria?.ultimo_peso ? `${biometria.ultimo_peso} kg` : "—"}
          </div>
          {biometria?.variacao_peso_7d !== null &&
            biometria?.variacao_peso_7d !== undefined && (
              <span
                className={`text-xs font-medium ${biometria.variacao_peso_7d > 0 ? "text-amber" : biometria.variacao_peso_7d < 0 ? "text-green" : "text-dim"}`}
              >
                {biometria.variacao_peso_7d > 0
                  ? "↑"
                  : biometria.variacao_peso_7d < 0
                    ? "↓"
                    : "→"}{" "}
                {Math.abs(biometria.variacao_peso_7d).toFixed(1)} kg (7d)
              </span>
            )}
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-4 h-4 text-green" />
            <span className="text-xs text-dim">Gordura</span>
          </div>
          <div className="metric-value text-green">
            {biometria?.ultimo_percentual_gordura
              ? `${biometria.ultimo_percentual_gordura}%`
              : "—"}
          </div>
          <span className="text-xs text-dim">
            Músculo:{" "}
            {biometria?.ultima_massa_muscular
              ? `${biometria.ultima_massa_muscular} kg`
              : "—"}
          </span>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Dumbbell className="w-4 h-4 text-purple" />
            <span className="text-xs text-dim">Treinos hoje</span>
          </div>
          <div className="metric-value text-purple">{treinosHoje}</div>
          <button
            onClick={() => setShowTreinoForm(true)}
            className="text-xs text-dim hover:text-purple mt-1"
          >
            + Registrar treino
          </button>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Utensils className="w-4 h-4 text-amber" />
            <span className="text-xs text-dim">Refeições</span>
          </div>
          <div className="metric-value text-amber">{refeicoesHoje}</div>
          <button
            onClick={() => setShowRefeicaoForm(true)}
            className="text-xs text-dim hover:text-amber mt-1"
          >
            + Registrar refeição
          </button>
        </div>
      </div>

      {/* Hydration */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-blue" />
          <span className="font-semibold text-text text-sm">Hidratação</span>
          <span className="ml-auto text-sm font-bold text-blue">
            {hidratacao ? `${(hidratacao.total_ml / 1000).toFixed(1)}L` : "0L"}
            <span className="text-dim font-normal">
              {" "}
              / {((hidratacao?.meta_ml ?? 4000) / 1000).toFixed(1)}L
            </span>
          </span>
        </div>

        <ProgressBar
          value={hidratacao?.percentual ?? 0}
          color="blue"
          size="lg"
          className="mb-3"
        />

        {/* Quick add buttons */}
        <div className="flex gap-2 flex-wrap">
          {[200, 350, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => addAgua(ml)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue/10 border border-blue/20 text-blue text-xs font-semibold hover:bg-blue/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> {ml}ml
            </button>
          ))}
          <button
            onClick={() => addAgua(-200)}
            className="px-3 py-2 rounded-xl bg-border border border-dim3 text-dim text-xs hover:text-text"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowBioForm(true)}
          className="card p-3.5 flex items-center gap-3 hover:border-cyan/40 transition-colors text-left w-full"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <p className="text-sm font-medium text-text">Registrar biometria</p>
            <p className="text-xs text-dim">Peso, gordura, músculo, cintura</p>
          </div>
          <Plus className="w-4 h-4 text-dim ml-auto" />
        </button>

        {!readiness && (
          <button
            onClick={() => setShowReadinessForm(true)}
            className="card p-3.5 flex items-center gap-3 hover:border-green/40 transition-colors text-left w-full border-green/20"
          >
            <div className="w-9 h-9 rounded-xl bg-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">
                Como você está hoje?
              </p>
              <p className="text-xs text-dim">Readiness — ~10 segundos</p>
            </div>
            <Plus className="w-4 h-4 text-green ml-auto" />
          </button>
        )}
      </div>

      {/* Modals */}
      {showBioForm && (
        <BiometriaModal
          onClose={() => {
            setShowBioForm(false);
            loadData();
          }}
        />
      )}
      {showTreinoForm && (
        <TreinoModal
          onClose={() => {
            setShowTreinoForm(false);
            loadData();
          }}
        />
      )}
      {showRefeicaoForm && (
        <RefeicaoModal
          onClose={() => {
            setShowRefeicaoForm(false);
            loadData();
          }}
        />
      )}
      {showReadinessForm && (
        <ReadinessModal
          onClose={() => {
            setShowReadinessForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ── Biometria Modal ───────────────────────────────────────────
function BiometriaModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    peso: "",
    percentual_gordura: "",
    massa_muscular: "",
    cintura: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.biometria.save({
        peso: parseFloat(form.peso),
        percentual_gordura: form.percentual_gordura
          ? parseFloat(form.percentual_gordura)
          : undefined,
        massa_muscular: form.massa_muscular
          ? parseFloat(form.massa_muscular)
          : undefined,
        cintura: form.cintura ? parseFloat(form.cintura) : undefined,
        notas: form.notas || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Registrar Biometria" onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-3">
        {error && <p className="text-red text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Peso (kg) *</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="75.5"
              value={form.peso}
              onChange={(e) => setForm((p) => ({ ...p, peso: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Gordura (%)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="18.5"
              value={form.percentual_gordura}
              onChange={(e) =>
                setForm((p) => ({ ...p, percentual_gordura: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Músculo (kg)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="34.2"
              value={form.massa_muscular}
              onChange={(e) =>
                setForm((p) => ({ ...p, massa_muscular: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Cintura (cm)</label>
            <input
              type="number"
              step="0.5"
              className="input"
              placeholder="85"
              value={form.cintura}
              onChange={(e) =>
                setForm((p) => ({ ...p, cintura: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea
            className="input resize-none h-16"
            placeholder="Observações..."
            value={form.notas}
            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Salvando..." : "Salvar biometria"}
        </button>
      </form>
    </Modal>
  );
}

// ── Treino Modal ──────────────────────────────────────────────
const tiposTreino = [
  "Musculação",
  "Cardio",
  "HIIT",
  "Yoga",
  "Pilates",
  "Funcional",
  "Natação",
  "Corrida",
  "Ciclismo",
  "Outro",
];

function TreinoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    tipo: "",
    duracao_minutos: "",
    calorias: "",
    frequencia_cardiaca_media: "",
    frequencia_cardiaca_pico: "",
    esforco_percebido: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.treinos.save({
        tipo: form.tipo || undefined,
        duracao_minutos: form.duracao_minutos
          ? parseInt(form.duracao_minutos)
          : undefined,
        calorias: form.calorias ? parseInt(form.calorias) : undefined,
        frequencia_cardiaca_media: form.frequencia_cardiaca_media
          ? parseInt(form.frequencia_cardiaca_media)
          : undefined,
        frequencia_cardiaca_pico: form.frequencia_cardiaca_pico
          ? parseInt(form.frequencia_cardiaca_pico)
          : undefined,
        esforco_percebido: form.esforco_percebido
          ? parseInt(form.esforco_percebido)
          : undefined,
        notas: form.notas || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Registrar Treino" onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-3">
        {error && <p className="text-red text-sm">{error}</p>}

        {/* Tipo chips */}
        <div>
          <label className="label">Tipo de treino</label>
          <div className="flex flex-wrap gap-2">
            {tiposTreino.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo: t }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.tipo === t ? "bg-cyan/10 border-cyan text-cyan" : "bg-border border-dim3 text-dim hover:text-text"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Duração (min)</label>
            <input
              type="number"
              className="input"
              placeholder="60"
              value={form.duracao_minutos}
              onChange={(e) =>
                setForm((p) => ({ ...p, duracao_minutos: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Calorias (kcal)</label>
            <input
              type="number"
              className="input"
              placeholder="350"
              value={form.calorias}
              onChange={(e) =>
                setForm((p) => ({ ...p, calorias: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">FC Média (bpm)</label>
            <input
              type="number"
              className="input"
              placeholder="130"
              value={form.frequencia_cardiaca_media}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  frequencia_cardiaca_media: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="label">FC Pico (bpm)</label>
            <input
              type="number"
              className="input"
              placeholder="165"
              value={form.frequencia_cardiaca_pico}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  frequencia_cardiaca_pico: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Escala de Borg */}
        <div>
          <label className="label">
            Esforço percebido — Escala Borg (1–10)
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, esforco_percebido: String(n) }))
                }
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${form.esforco_percebido === String(n) ? "bg-cyan/10 border-cyan text-cyan" : "bg-border border-dim3 text-dim"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-dim mt-1">
            {form.esforco_percebido
              ? [
                  "",
                  "Muito leve",
                  "Leve",
                  "Moderado leve",
                  "Moderado",
                  "Moderado forte",
                  "Forte",
                  "Muito forte",
                  "Muito forte+",
                  "Extremamente forte",
                  "Máximo",
                ][parseInt(form.esforco_percebido)]
              : "Selecione o esforço"}
          </p>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea
            className="input resize-none h-16"
            placeholder="Como foi o treino?"
            value={form.notas}
            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Salvando..." : "Salvar treino"}
        </button>
      </form>
    </Modal>
  );
}

// ── Refeição Modal ────────────────────────────────────────────
const tiposRefeicao = [
  "Cafe-da-Manha",
  "Pre-Treino",
  "Pos-Treino",
  "Almoco",
  "Lanche",
  "Jantar",
  "Ceia",
];
const tiposLabel: Record<string, string> = {
  "Cafe-da-Manha": "Café da Manhã",
  "Pre-Treino": "Pré-Treino",
  "Pos-Treino": "Pós-Treino",
  Almoco: "Almoço",
  Lanche: "Lanche",
  Jantar: "Jantar",
  Ceia: "Ceia",
};

function RefeicaoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    tipo: "",
    descricao: "",
    calorias_estimadas: "",
    proteina_g: "",
    carboidrato_g: "",
    gordura_g: "",
  });
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.refeicoes.save({
        tipo: form.tipo || "Lanche",
        descricao: form.descricao || undefined,
        calorias_estimadas: form.calorias_estimadas
          ? parseInt(form.calorias_estimadas)
          : undefined,
        proteina_g: form.proteina_g ? parseFloat(form.proteina_g) : undefined,
        carboidrato_g: form.carboidrato_g
          ? parseFloat(form.carboidrato_g)
          : undefined,
        gordura_g: form.gordura_g ? parseFloat(form.gordura_g) : undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Registrar Refeição" onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-3">
        <div>
          <label className="label">Tipo de refeição</label>
          <div className="flex flex-wrap gap-2">
            {tiposRefeicao.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo: t }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.tipo === t ? "bg-amber/10 border-amber text-amber" : "bg-border border-dim3 text-dim hover:text-text"}`}
              >
                {tiposLabel[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea
            className="input resize-none h-20"
            placeholder="Ex: Arroz, feijão, frango grelhado, salada"
            value={form.descricao}
            onChange={(e) =>
              setForm((p) => ({ ...p, descricao: e.target.value }))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Calorias (kcal)</label>
            <input
              type="number"
              className="input"
              placeholder="450"
              value={form.calorias_estimadas}
              onChange={(e) =>
                setForm((p) => ({ ...p, calorias_estimadas: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Proteína (g)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="35"
              value={form.proteina_g}
              onChange={(e) =>
                setForm((p) => ({ ...p, proteina_g: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Carbo (g)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="50"
              value={form.carboidrato_g}
              onChange={(e) =>
                setForm((p) => ({ ...p, carboidrato_g: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Gordura (g)</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="12"
              value={form.gordura_g}
              onChange={(e) =>
                setForm((p) => ({ ...p, gordura_g: e.target.value }))
              }
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Salvando..." : "Salvar refeição"}
        </button>
      </form>
    </Modal>
  );
}

// ── Readiness Modal ───────────────────────────────────────────
function ReadinessModal({ onClose }: { onClose: () => void }) {
  const [sono, setSono] = useState(3);
  const [estresse, setEstresse] = useState(3);
  const [fadiga, setFadiga] = useState(3);
  const [loading, setLoading] = useState(false);

  const labels5 = ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"];
  const labelsEstresse = [
    "",
    "Zen total",
    "Tranquilo",
    "Normal",
    "Estressado",
    "Muito estressado",
  ];
  const labelsFadiga = [
    "",
    "Sem fadiga",
    "Leve",
    "Moderada",
    "Alta",
    "Exausta",
  ];

  async function save() {
    setLoading(true);
    try {
      await api.readiness.save({
        qualidade_sono: sono,
        nivel_estresse: estresse,
        fadiga_muscular: fadiga,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Como você está hoje?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <ReadinessQuestion
          label="😴 Qualidade do sono"
          value={sono}
          onChange={setSono}
          labels={labels5}
        />
        <ReadinessQuestion
          label="🧠 Nível de estresse"
          value={estresse}
          onChange={setEstresse}
          labels={labelsEstresse}
        />
        <ReadinessQuestion
          label="💪 Fadiga muscular"
          value={fadiga}
          onChange={setFadiga}
          labels={labelsFadiga}
        />
        <button onClick={save} disabled={loading} className="btn-primary">
          {loading ? "Salvando..." : "Calcular meu readiness"}
        </button>
      </div>
    </Modal>
  );
}

function ReadinessQuestion({
  label,
  value,
  onChange,
  labels,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  return (
    <div>
      <p className="text-sm font-medium text-text mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${value === n ? "bg-cyan/10 border-cyan text-cyan" : "bg-border border-dim3 text-dim"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-dim mt-1 text-center">{labels[value]}</p>
    </div>
  );
}

// ── Generic Modal ─────────────────────────────────────────────
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-text">{title}</h3>
          <button
            onClick={onClose}
            className="text-dim hover:text-text text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
