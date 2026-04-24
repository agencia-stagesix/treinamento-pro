"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Upload, Dumbbell, List } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
  equipamento?: string;
  tags?: string[];
  descricao?: string;
  video_url?: string;
  imagem_url?: string;
}

interface SerieExItem {
  exercicio_id: string;
  ordem: number;
  repeticoes: number;
  descanso_seg: number;
}

interface SerieTemplate {
  id: string;
  nome: string;
  descricao?: string;
  exercicios: Array<{
    id: string;
    ordem: number;
    repeticoes: number;
    descanso_seg: number;
    exercicio: Exercicio;
  }>;
}

// ─── Modal helpers ────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-bold text-text">{title}</p>
          <button onClick={onClose} className="text-dim hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── ExercicioModal ───────────────────────────────────────────────────────────

function ExercicioModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Exercicio | null;
  onClose: () => void;
  onSaved: (ex: Exercicio) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    grupo_muscular: initial?.grupo_muscular ?? "",
    equipamento: initial?.equipamento ?? "",
    tags: (initial?.tags ?? []).join("; "),
    descricao: initial?.descricao ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLInputElement>(null);
  const imagemRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        grupo_muscular: form.grupo_muscular.trim(),
        equipamento: form.equipamento.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
        tags: form.tags
          ? form.tags
              .split(";")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      let r: any;
      if (isEdit && initial) {
        r = await api.exercicios.update(initial.id, payload);
      } else {
        r = await api.exercicios.create(payload);
      }
      onSaved(r.data);
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar exercício");
    } finally {
      setSaving(false);
    }
  }

  async function uploadMedia(tipo: "video" | "imagem", file: File | undefined) {
    if (!file || !initial) return;
    try {
      const r = (await api.exercicios.uploadMedia(
        initial.id,
        file,
        tipo,
      )) as any;
      onSaved(r.data);
    } catch (err: any) {
      setError(err.message ?? "Erro no upload");
    }
  }

  async function onImportCsv(file: File | undefined) {
    if (!file) return;
    setSaving(true);
    try {
      await (api.exercicios as any).importCsv(file);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Erro ao importar CSV");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Editar Exercício" : "Cadastrar Exercício"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-dim mb-1 block">Nome *</label>
          <input
            className="input w-full"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-xs text-dim mb-1 block">
            Grupo muscular *
          </label>
          <input
            className="input w-full"
            value={form.grupo_muscular}
            onChange={(e) =>
              setForm((p) => ({ ...p, grupo_muscular: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="text-xs text-dim mb-1 block">Equipamento</label>
          <input
            className="input w-full"
            value={form.equipamento}
            onChange={(e) =>
              setForm((p) => ({ ...p, equipamento: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-dim mb-1 block">
            Tags (separadas por ;)
          </label>
          <input
            className="input w-full"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-dim mb-1 block">
            Descrição de execução
          </label>
          <textarea
            className="input w-full resize-none h-24"
            value={form.descricao}
            onChange={(e) =>
              setForm((p) => ({ ...p, descricao: e.target.value }))
            }
          />
        </div>

        {isEdit && (
          <div className="flex flex-wrap gap-2 pt-1">
            <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload vídeo/gif
              <input
                ref={videoRef}
                type="file"
                accept="video/*,image/gif"
                className="hidden"
                onChange={(e) => uploadMedia("video", e.target.files?.[0])}
              />
            </label>
            <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload imagem
              <input
                ref={imagemRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadMedia("imagem", e.target.files?.[0])}
              />
            </label>
          </div>
        )}

        {error && <p className="text-red text-xs">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
          </button>
          {!isEdit && (
            <label className="btn-secondary cursor-pointer flex items-center gap-1.5 text-sm">
              <Upload className="w-4 h-4" /> CSV
              <input
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => onImportCsv(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      </form>
    </Modal>
  );
}

// ─── SerieModal ───────────────────────────────────────────────────────────────

function SerieModal({
  exercicios,
  onClose,
  onSaved,
}: {
  exercicios: Exercicio[];
  onClose: () => void;
  onSaved: (s: SerieTemplate) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [items, setItems] = useState<SerieExItem[]>([
    { exercicio_id: "", ordem: 1, repeticoes: 10, descanso_seg: 60 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        exercicio_id: "",
        ordem: prev.length + 1,
        repeticoes: 10,
        descanso_seg: 60,
      },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((it, i) => ({ ...it, ordem: i + 1 })),
    );
  }

  function updateItem(idx: number, patch: Partial<SerieExItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const invalid = items.find((it) => !it.exercicio_id);
    if (invalid) {
      setError("Selecione um exercício em todas as linhas.");
      return;
    }
    setSaving(true);
    try {
      const r = (await api.protocolos.treinamento.templates.create({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        exercicios: items,
      })) as any;
      onSaved(r.data);
    } catch (err: any) {
      setError(err.message ?? "Erro ao criar série");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Cadastrar Série" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-dim mb-1 block">Nome da série *</label>
          <input
            className="input w-full"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-dim mb-1 block">Descrição</label>
          <input
            className="input w-full"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-dim mb-2 block">Exercícios</label>
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="border border-border rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dim font-medium">
                    Exercício {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-dim hover:text-red"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <select
                  className="input w-full text-sm"
                  value={item.exercicio_id}
                  onChange={(e) =>
                    updateItem(idx, { exercicio_id: e.target.value })
                  }
                  required
                >
                  <option value="">Selecionar exercício...</option>
                  {exercicios.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nome} — {ex.grupo_muscular}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-dim mb-0.5 block">
                      Repetições
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="input w-full text-sm"
                      value={item.repeticoes}
                      onChange={(e) =>
                        updateItem(idx, {
                          repeticoes: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dim mb-0.5 block">
                      Descanso (seg)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="input w-full text-sm"
                      value={item.descanso_seg}
                      onChange={(e) =>
                        updateItem(idx, {
                          descanso_seg: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="btn-ghost text-xs mt-2 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar exercício
          </button>
        </div>

        {error && <p className="text-red text-xs">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary mt-2">
          {saving ? "Salvando..." : "Criar Série"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExerciciosPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [series, setSeries] = useState<SerieTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [exModal, setExModal] = useState<null | "create" | { edit: Exercicio }>(
    null,
  );
  const [serieModal, setSerieModal] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [exData, serieData] = await Promise.all([
        api.exercicios.search({ limit: 200 }) as any,
        api.protocolos.treinamento.templates.list() as any,
      ]);
      setExercicios(exData.data ?? []);
      setSeries(serieData.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function deleteExercicio(id: string) {
    if (!confirm("Excluir exercício? Esta ação não pode ser desfeita.")) return;
    try {
      await api.exercicios.remove(id);
      setExercicios((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Erro ao excluir");
    }
  }

  async function deleteSerie(id: string) {
    if (!confirm("Excluir série? Esta ação não pode ser desfeita.")) return;
    try {
      await api.protocolos.treinamento.templates.remove(id);
      setSeries((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Erro ao excluir");
    }
  }

  function onExercicioSaved(ex: Exercicio) {
    setExercicios((prev) => {
      const idx = prev.findIndex((e) => e.id === ex.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = ex;
        return next;
      }
      return [ex, ...prev];
    });
    setExModal(null);
  }

  function onSerieSaved(s: SerieTemplate) {
    setSeries((prev) => [s, ...prev]);
    setSerieModal(false);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-cyan" />
          Exercícios
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary flex items-center gap-1.5 text-sm"
            onClick={() => setSerieModal(true)}
          >
            <List className="w-4 h-4" /> Cadastrar Série
          </button>
          <button
            className="btn-primary flex items-center gap-1.5 text-sm"
            onClick={() => setExModal("create")}
          >
            <Plus className="w-4 h-4" /> Cadastrar Exercício
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Biblioteca de Exercícios ── */}
          <section>
            <h2 className="text-sm font-semibold text-dim uppercase tracking-wide mb-3">
              Biblioteca de Exercícios ({exercicios.length})
            </h2>
            {exercicios.length === 0 ? (
              <div className="card p-8 text-center">
                <Dumbbell className="w-10 h-10 text-dim mx-auto mb-3" />
                <p className="text-dim text-sm">
                  Nenhum exercício cadastrado ainda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exercicios.map((ex) => (
                  <div key={ex.id} className="card p-4 flex flex-col gap-2">
                    {ex.video_url && (
                      <video
                        src={ex.video_url}
                        className="w-full h-28 object-cover rounded-lg bg-bg"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) =>
                          (e.currentTarget as HTMLVideoElement).play()
                        }
                        onMouseLeave={(e) => {
                          const v = e.currentTarget as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                    )}
                    {!ex.video_url && ex.imagem_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.imagem_url}
                        alt={ex.nome}
                        className="w-full h-28 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-text text-sm">
                          {ex.nome}
                        </p>
                        <p className="text-xs text-dim">{ex.grupo_muscular}</p>
                        {ex.equipamento && (
                          <p className="text-xs text-dim">{ex.equipamento}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          className="p-1.5 rounded-lg hover:bg-border/60 text-dim hover:text-cyan"
                          title="Editar"
                          onClick={() => setExModal({ edit: ex })}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-border/60 text-dim hover:text-red"
                          title="Excluir"
                          onClick={() => deleteExercicio(ex.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {ex.descricao && (
                      <p className="text-xs text-dim line-clamp-2">
                        {ex.descricao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Séries de Treino ── */}
          <section>
            <h2 className="text-sm font-semibold text-dim uppercase tracking-wide mb-3">
              Séries de Treino ({series.length})
            </h2>
            {series.length === 0 ? (
              <div className="card p-8 text-center">
                <List className="w-10 h-10 text-dim mx-auto mb-3" />
                <p className="text-dim text-sm">
                  Nenhuma série cadastrada ainda.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {series.map((serie) => (
                  <div key={serie.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text">{serie.nome}</p>
                        {serie.descricao && (
                          <p className="text-xs text-dim mt-0.5">
                            {serie.descricao}
                          </p>
                        )}
                        <p className="text-xs text-dim mt-1">
                          {serie.exercicios?.length ?? 0} exercício
                          {(serie.exercicios?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        className="p-1.5 rounded-lg hover:bg-border/60 text-dim hover:text-red shrink-0"
                        title="Excluir série"
                        onClick={() => deleteSerie(serie.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {serie.exercicios?.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1">
                        {serie.exercicios.map((item) => (
                          <div
                            key={item.id}
                            className="text-xs text-dim flex items-center justify-between rounded-lg bg-border/30 px-2.5 py-1.5"
                          >
                            <span className="text-text">
                              {item.ordem}. {item.exercicio?.nome}
                            </span>
                            <span>
                              {item.repeticoes} reps · {item.descanso_seg}s
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Modals */}
      {exModal === "create" && (
        <ExercicioModal
          onClose={() => setExModal(null)}
          onSaved={onExercicioSaved}
        />
      )}
      {exModal && exModal !== "create" && (
        <ExercicioModal
          initial={(exModal as { edit: Exercicio }).edit}
          onClose={() => setExModal(null)}
          onSaved={onExercicioSaved}
        />
      )}
      {serieModal && (
        <SerieModal
          exercicios={exercicios}
          onClose={() => setSerieModal(false)}
          onSaved={onSerieSaved}
        />
      )}
    </div>
  );
}
