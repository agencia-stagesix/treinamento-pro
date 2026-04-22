"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const diasSemana = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

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

interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
}
interface SerieEx {
  nome: string;
  series: number;
  repeticoes: string;
  carga: string;
  descanso_seg: number;
  notas: string;
}
interface DiaTreino {
  dia_semana: number;
  nome: string;
  exercicios: SerieEx[];
}
interface Suplemento {
  nome: string;
  dose: string;
  horario_relativo: string;
}
interface RefeicaoProto {
  tipo: string;
  horario: string;
  descricao: string;
  calorias_alvo: number | "";
  proteina_alvo: number | "";
}

export default function ProtocoloEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aluno, setAluno] = useState<any>(null);

  const [diasTreino, setDiasTreino] = useState<DiaTreino[]>([]);
  const [planoAlimentar, setPlanoAlimentar] = useState<RefeicaoProto[]>([]);
  const [suplementos, setSuplementos] = useState<Suplemento[]>([]);
  const [metas, setMetas] = useState({
    peso_alvo: "",
    gordura_alvo: "",
    prazo: "",
  });
  const [activeSection, setActiveSection] = useState<string | null>("treino");
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  // Exercise search
  const [exSearch, setExSearch] = useState("");
  const [exResults, setExResults] = useState<Exercicio[]>([]);
  const [exLoading, setExLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!id) return;
    Promise.all([api.perfil.meusAlunos(), api.protocolos.get(id)])
      .then(([, proto]) => {
        const p = (proto as any).data;
        if (p) {
          setDiasTreino(p.planilha_treino ?? []);
          setPlanoAlimentar(p.plano_alimentar ?? []);
          setSuplementos(p.suplementos ?? []);
          setMetas({
            peso_alvo: p.metas?.peso_alvo ?? "",
            gordura_alvo: p.metas?.gordura_alvo ?? "",
            prazo: p.metas?.prazo ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function searchExercicios(q: string) {
    clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setExResults([]);
      return;
    }
    setExLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const r = (await api.exercicios.search({ q })) as any;
      setExResults(r.data ?? []);
      setExLoading(false);
    }, 300);
  }

  async function save() {
    setSaving(true);
    try {
      await api.protocolos.update(id!, {
        planilha_treino: diasTreino,
        plano_alimentar: planoAlimentar,
        suplementos,
        metas: {
          peso_alvo: metas.peso_alvo ? parseFloat(metas.peso_alvo) : undefined,
          gordura_alvo: metas.gordura_alvo
            ? parseFloat(metas.gordura_alvo)
            : undefined,
          prazo: metas.prazo || undefined,
        },
      });
      router.push(`/trainer/aluno/${id}`);
    } finally {
      setSaving(false);
    }
  }

  function addDia() {
    const existing = diasTreino.map((d) => d.dia_semana);
    const next = [1, 2, 3, 4, 5, 6, 0].find((d) => !existing.includes(d)) ?? 0;
    setDiasTreino((prev) => [
      ...prev,
      { dia_semana: next, nome: "Treino A", exercicios: [] },
    ]);
  }

  function removeDia(i: number) {
    setDiasTreino((prev) => prev.filter((_, idx) => idx !== i));
    if (activeDayIdx === i) setActiveDayIdx(null);
  }

  function addExToDay(dayIdx: number, ex: Exercicio) {
    setDiasTreino((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercicios: [
                ...d.exercicios,
                {
                  nome: ex.nome,
                  series: 3,
                  repeticoes: "10",
                  carga: "",
                  descanso_seg: 60,
                  notas: "",
                },
              ],
            },
      ),
    );
    setExSearch("");
    setExResults([]);
  }

  function removeEx(dayIdx: number, exIdx: number) {
    setDiasTreino((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : { ...d, exercicios: d.exercicios.filter((_, j) => j !== exIdx) },
      ),
    );
  }

  function updateEx(
    dayIdx: number,
    exIdx: number,
    field: keyof SerieEx,
    value: any,
  ) {
    setDiasTreino((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              exercicios: d.exercicios.map((e, j) =>
                j !== exIdx ? e : { ...e, [field]: value },
              ),
            },
      ),
    );
  }

  function addRefeicao() {
    setPlanoAlimentar((prev) => [
      ...prev,
      {
        tipo: "Almoco",
        horario: "12:00",
        descricao: "",
        calorias_alvo: "",
        proteina_alvo: "",
      },
    ]);
  }

  function addSuplemento() {
    setSuplementos((prev) => [
      ...prev,
      { nome: "", dose: "", horario_relativo: "Pós-Treino" },
    ]);
  }

  function SectionHeader({ id, label }: { id: string; label: string }) {
    const isOpen = activeSection === id;
    return (
      <button
        className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-cyan/30 transition-colors"
        onClick={() => setActiveSection(isOpen ? null : id)}
      >
        <span className="font-semibold text-text">{label}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-dim" />
        ) : (
          <ChevronDown className="w-4 h-4 text-dim" />
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-dim hover:text-text"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text flex-1">
          Editor de Protocolo
        </h2>
        <button onClick={save} disabled={saving} className="btn-primary px-5">
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Metas */}
      <div>
        <SectionHeader id="metas" label="🎯 Metas" />
        {activeSection === "metas" && (
          <div className="card p-4 mt-2 grid grid-cols-3 gap-3">
            <div>
              <label className="label">Peso alvo (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={metas.peso_alvo}
                onChange={(e) =>
                  setMetas((p) => ({ ...p, peso_alvo: e.target.value }))
                }
                placeholder="75.0"
              />
            </div>
            <div>
              <label className="label">Gordura alvo (%)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={metas.gordura_alvo}
                onChange={(e) =>
                  setMetas((p) => ({ ...p, gordura_alvo: e.target.value }))
                }
                placeholder="15.0"
              />
            </div>
            <div>
              <label className="label">Prazo</label>
              <input
                type="text"
                className="input"
                value={metas.prazo}
                onChange={(e) =>
                  setMetas((p) => ({ ...p, prazo: e.target.value }))
                }
                placeholder="3 meses"
              />
            </div>
          </div>
        )}
      </div>

      {/* Treino */}
      <div>
        <SectionHeader id="treino" label="🏋️ Planilha de Treino" />
        {activeSection === "treino" && (
          <div className="card p-4 mt-2 flex flex-col gap-3">
            {diasTreino.map((dia, dayIdx) => (
              <div
                key={dayIdx}
                className="border border-border rounded-xl overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center gap-2 p-3 bg-border/30">
                  <select
                    className="input py-1 px-2 text-xs w-28"
                    value={dia.dia_semana}
                    onChange={(e) =>
                      setDiasTreino((prev) =>
                        prev.map((d, i) =>
                          i === dayIdx
                            ? { ...d, dia_semana: parseInt(e.target.value) }
                            : d,
                        ),
                      )
                    }
                  >
                    {diasSemana.map((n, v) => (
                      <option key={v} value={v}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input py-1 px-2 text-xs flex-1"
                    value={dia.nome}
                    onChange={(e) =>
                      setDiasTreino((prev) =>
                        prev.map((d, i) =>
                          i === dayIdx ? { ...d, nome: e.target.value } : d,
                        ),
                      )
                    }
                    placeholder="Nome do treino"
                  />
                  <button
                    className="p-1.5 text-dim hover:text-red"
                    onClick={() => removeDia(dayIdx)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 text-dim hover:text-text"
                    onClick={() =>
                      setActiveDayIdx(activeDayIdx === dayIdx ? null : dayIdx)
                    }
                  >
                    {activeDayIdx === dayIdx ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {activeDayIdx === dayIdx && (
                  <div className="p-3 flex flex-col gap-3">
                    {/* Exercise search */}
                    <div className="relative">
                      <div className="flex items-center gap-2 input px-3">
                        <Search className="w-3.5 h-3.5 text-dim shrink-0" />
                        <input
                          className="flex-1 bg-transparent text-sm outline-none text-text placeholder:text-dim"
                          placeholder="Buscar exercício..."
                          value={exSearch}
                          onChange={(e) => {
                            setExSearch(e.target.value);
                            searchExercicios(e.target.value);
                          }}
                        />
                        {exLoading && (
                          <div className="w-3 h-3 border border-cyan border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      {exResults.length > 0 && (
                        <div className="absolute left-0 right-0 z-10 mt-1 bg-card border border-border rounded-xl shadow-card max-h-48 overflow-y-auto">
                          {exResults.map((ex) => (
                            <button
                              key={ex.id}
                              onClick={() => addExToDay(dayIdx, ex)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-border/50 transition-colors"
                            >
                              <span className="text-text">{ex.nome}</span>
                              <span className="text-dim text-xs ml-2">
                                {ex.grupo_muscular}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Exercises list */}
                    {dia.exercicios.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-border/30 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-text">
                            {ex.nome}
                          </p>
                          <button
                            onClick={() => removeEx(dayIdx, exIdx)}
                            className="text-dim hover:text-red"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="label text-[10px]">Séries</label>
                            <input
                              type="number"
                              className="input py-1 px-2 text-xs"
                              value={ex.series}
                              min={1}
                              onChange={(e) =>
                                updateEx(
                                  dayIdx,
                                  exIdx,
                                  "series",
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="label text-[10px]">Reps</label>
                            <input
                              className="input py-1 px-2 text-xs"
                              value={ex.repeticoes}
                              onChange={(e) =>
                                updateEx(
                                  dayIdx,
                                  exIdx,
                                  "repeticoes",
                                  e.target.value,
                                )
                              }
                              placeholder="10-12"
                            />
                          </div>
                          <div>
                            <label className="label text-[10px]">Carga</label>
                            <input
                              className="input py-1 px-2 text-xs"
                              value={ex.carga}
                              onChange={(e) =>
                                updateEx(dayIdx, exIdx, "carga", e.target.value)
                              }
                              placeholder="20kg"
                            />
                          </div>
                          <div>
                            <label className="label text-[10px]">Desc(s)</label>
                            <input
                              type="number"
                              className="input py-1 px-2 text-xs"
                              value={ex.descanso_seg}
                              onChange={(e) =>
                                updateEx(
                                  dayIdx,
                                  exIdx,
                                  "descanso_seg",
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>
                        <input
                          className="input py-1 px-2 text-xs mt-2 w-full"
                          value={ex.notas}
                          onChange={(e) =>
                            updateEx(dayIdx, exIdx, "notas", e.target.value)
                          }
                          placeholder="Notas..."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addDia}
              className="btn-secondary flex items-center justify-center gap-2 w-full"
            >
              <Plus className="w-4 h-4" /> Adicionar dia de treino
            </button>
          </div>
        )}
      </div>

      {/* Plano alimentar */}
      <div>
        <SectionHeader id="alimentar" label="🍽️ Plano Alimentar" />
        {activeSection === "alimentar" && (
          <div className="card p-4 mt-2 flex flex-col gap-3">
            {planoAlimentar.map((ref, i) => (
              <div
                key={i}
                className="border border-border rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <select
                    className="input py-1 px-2 text-xs flex-1"
                    value={ref.tipo}
                    onChange={(e) =>
                      setPlanoAlimentar((prev) =>
                        prev.map((r, j) =>
                          j !== i ? r : { ...r, tipo: e.target.value },
                        ),
                      )
                    }
                  >
                    {tiposRefeicao.map((t) => (
                      <option key={t} value={t}>
                        {tiposLabel[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className="input py-1 px-2 text-xs w-28"
                    value={ref.horario}
                    onChange={(e) =>
                      setPlanoAlimentar((prev) =>
                        prev.map((r, j) =>
                          j !== i ? r : { ...r, horario: e.target.value },
                        ),
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      setPlanoAlimentar((prev) =>
                        prev.filter((_, j) => j !== i),
                      )
                    }
                    className="text-dim hover:text-red"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  className="input resize-none h-16 text-sm"
                  placeholder="Descrição dos alimentos..."
                  value={ref.descricao}
                  onChange={(e) =>
                    setPlanoAlimentar((prev) =>
                      prev.map((r, j) =>
                        j !== i ? r : { ...r, descricao: e.target.value },
                      ),
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Calorias alvo</label>
                    <input
                      type="number"
                      className="input py-1 px-2 text-xs"
                      value={ref.calorias_alvo}
                      onChange={(e) =>
                        setPlanoAlimentar((prev) =>
                          prev.map((r, j) =>
                            j !== i
                              ? r
                              : {
                                  ...r,
                                  calorias_alvo: e.target.value
                                    ? parseInt(e.target.value)
                                    : "",
                                },
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="label text-[10px]">
                      Proteína alvo (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input py-1 px-2 text-xs"
                      value={ref.proteina_alvo}
                      onChange={(e) =>
                        setPlanoAlimentar((prev) =>
                          prev.map((r, j) =>
                            j !== i
                              ? r
                              : {
                                  ...r,
                                  proteina_alvo: e.target.value
                                    ? parseFloat(e.target.value)
                                    : "",
                                },
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addRefeicao}
              className="btn-secondary flex items-center justify-center gap-2 w-full"
            >
              <Plus className="w-4 h-4" /> Adicionar refeição
            </button>
          </div>
        )}
      </div>

      {/* Suplementação */}
      <div>
        <SectionHeader id="suplements" label="💊 Suplementação" />
        {activeSection === "suplements" && (
          <div className="card p-4 mt-2 flex flex-col gap-3">
            {suplementos.map((sup, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="input py-1 px-2 text-sm flex-1"
                  value={sup.nome}
                  placeholder="Nome do suplemento"
                  onChange={(e) =>
                    setSuplementos((prev) =>
                      prev.map((s, j) =>
                        j !== i ? s : { ...s, nome: e.target.value },
                      ),
                    )
                  }
                />
                <input
                  className="input py-1 px-2 text-sm w-20"
                  value={sup.dose}
                  placeholder="Dose"
                  onChange={(e) =>
                    setSuplementos((prev) =>
                      prev.map((s, j) =>
                        j !== i ? s : { ...s, dose: e.target.value },
                      ),
                    )
                  }
                />
                <input
                  className="input py-1 px-2 text-sm w-28"
                  value={sup.horario_relativo}
                  placeholder="Horário"
                  onChange={(e) =>
                    setSuplementos((prev) =>
                      prev.map((s, j) =>
                        j !== i
                          ? s
                          : { ...s, horario_relativo: e.target.value },
                      ),
                    )
                  }
                />
                <button
                  onClick={() =>
                    setSuplementos((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-dim hover:text-red"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addSuplemento}
              className="btn-secondary flex items-center justify-center gap-2 w-full"
            >
              <Plus className="w-4 h-4" /> Adicionar suplemento
            </button>
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary py-3 text-base font-bold"
      >
        {saving ? "Salvando protocolo..." : "✓ Salvar protocolo"}
      </button>
    </div>
  );
}
