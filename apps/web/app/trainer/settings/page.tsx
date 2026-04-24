"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Copy, Check, Loader, Settings } from "lucide-react";
import Image from "next/image";

interface Trainer {
  id: string;
  nome: string;
  email: string;
  foto_url?: string;
  data_nascimento?: string;
}

interface Convite {
  id: string;
  codigo: string;
  created_at: string;
  expires_at: string;
  usado: boolean;
}

export default function TrainerSettingsPage() {
  const router = useRouter();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    foto_url: "",
    data_nascimento: "",
  });
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [novoExercicio, setNovoExercicio] = useState({
    nome: "",
    grupo_muscular: "",
    equipamento: "",
    tags: "",
    descricao: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const trainerData = (await api.perfil.me()) as any;
      setTrainer(trainerData.data);
      setFormData({
        nome: trainerData.data.nome,
        foto_url: trainerData.data.foto_url || "",
        data_nascimento: trainerData.data.data_nascimento || "",
      });

      // Listar convites
      const convitesData = (await api.perfil.meusConvites()) as any;
      setConvites(convitesData.data || []);

      const exerciciosData = (await api.exercicios.search({
        limit: 200,
      })) as any;
      setExercicios(exerciciosData.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await api.perfil.update({
        nome: formData.nome,
        foto_url: formData.foto_url,
        data_nascimento: formData.data_nascimento,
      });
      setTrainer((prev) => (prev ? { ...prev, ...formData } : null));
      setEditing(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateCode() {
    try {
      const data = (await api.perfil.gerarConvite()) as any;
      setConvites([data.data, ...convites]);
    } catch (error) {
      console.error("Erro ao gerar código:", error);
    }
  }

  function copyToClipboard(codigo: string) {
    navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const validConvites = convites.filter(
    (c) => !c.usado && new Date(c.expires_at) > new Date(),
  );

  async function criarExercicio() {
    if (!novoExercicio.nome || !novoExercicio.grupo_muscular) return;
    const r = (await api.exercicios.create({
      ...novoExercicio,
      tags: novoExercicio.tags
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean),
    })) as any;
    setExercicios((prev) => [r.data, ...prev]);
    setNovoExercicio({
      nome: "",
      grupo_muscular: "",
      equipamento: "",
      tags: "",
      descricao: "",
    });
  }

  async function removerExercicio(id: string) {
    await api.exercicios.remove(id);
    setExercicios((prev) => prev.filter((e) => e.id !== id));
  }

  async function onUploadMedia(
    id: string,
    tipo: "video" | "imagem",
    file?: File | null,
  ) {
    if (!file) return;
    const r = (await api.exercicios.uploadMedia(id, file, tipo)) as any;
    setExercicios((prev) => prev.map((e) => (e.id === id ? r.data : e)));
  }

  async function onImportCsv(file?: File | null) {
    if (!file) return;
    await api.exercicios.importCsv(file);
    const exerciciosData = (await api.exercicios.search({ limit: 200 })) as any;
    setExercicios(exerciciosData.data ?? []);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-cyan" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-6 h-6 text-cyan" />
        <h1 className="text-3xl font-bold text-text">Configurações</h1>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-6 mb-6">
          {trainer?.foto_url && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={trainer.foto_url}
                alt={trainer.nome}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text">{trainer?.nome}</h2>
            <p className="text-dim text-sm">{trainer?.email}</p>
            {editing ? (
              <button
                onClick={() => {
                  setEditing(false);
                  loadData();
                }}
                className="mt-3 px-3 py-1.5 text-sm bg-border hover:bg-border/80 text-text rounded-lg transition-colors"
              >
                Cancelar
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="mt-3 px-3 py-1.5 text-sm bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-lg transition-colors font-medium"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {editing && (
          <div className="space-y-4 border-t border-border pt-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-dim mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text placeholder-dim focus:outline-none focus:border-cyan transition-colors"
              />
            </div>

            {/* Foto URL */}
            <div>
              <label className="block text-sm font-medium text-dim mb-2">
                URL da Foto
              </label>
              <input
                type="url"
                value={formData.foto_url}
                onChange={(e) =>
                  setFormData({ ...formData, foto_url: e.target.value })
                }
                placeholder="https://example.com/foto.jpg"
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text placeholder-dim focus:outline-none focus:border-cyan transition-colors"
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-dim mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    data_nascimento: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text placeholder-dim focus:outline-none focus:border-cyan transition-colors"
              />
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-cyan hover:bg-cyan/90 disabled:bg-cyan/50 text-bg font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invitation Code Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-text mb-4">Código de Convite</h2>
        <p className="text-dim text-sm mb-4">
          Compartilhe um código com seus alunos para que possam se vincular à
          sua conta.
        </p>

        {validConvites.length > 0 ? (
          <div className="space-y-3">
            {validConvites.map((convite) => (
              <div
                key={convite.id}
                className="flex items-center gap-3 p-3 bg-bg border border-border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-mono font-bold text-lg text-cyan">
                    {convite.codigo}
                  </p>
                  <p className="text-xs text-dim mt-1">
                    Criado em{" "}
                    {new Date(convite.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(convite.codigo)}
                  className="p-2 hover:bg-border rounded-lg transition-colors text-dim hover:text-text"
                  title="Copiar código"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dim text-sm mb-4">
            Você não tem códigos de convite ativos. Gere um novo!
          </p>
        )}

        <button
          onClick={handleGenerateCode}
          className="mt-4 w-full px-4 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan font-medium rounded-lg transition-colors"
        >
          Gerar Novo Código
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-text mb-4">
          Biblioteca de Exercícios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <input
            className="input"
            placeholder="Nome"
            value={novoExercicio.nome}
            onChange={(e) =>
              setNovoExercicio((p) => ({ ...p, nome: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Grupo muscular"
            value={novoExercicio.grupo_muscular}
            onChange={(e) =>
              setNovoExercicio((p) => ({
                ...p,
                grupo_muscular: e.target.value,
              }))
            }
          />
          <input
            className="input"
            placeholder="Equipamento"
            value={novoExercicio.equipamento}
            onChange={(e) =>
              setNovoExercicio((p) => ({ ...p, equipamento: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Tags separadas por ;"
            value={novoExercicio.tags}
            onChange={(e) =>
              setNovoExercicio((p) => ({ ...p, tags: e.target.value }))
            }
          />
        </div>
        <textarea
          className="input resize-none h-20 mb-3"
          placeholder="Descrição"
          value={novoExercicio.descricao}
          onChange={(e) =>
            setNovoExercicio((p) => ({ ...p, descricao: e.target.value }))
          }
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <button className="btn-primary" onClick={criarExercicio}>
            Criar exercício
          </button>
          <label className="btn-secondary cursor-pointer">
            Importar CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onImportCsv(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-auto">
          {exercicios.map((ex) => (
            <div key={ex.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">{ex.nome}</p>
                  <p className="text-xs text-dim">{ex.grupo_muscular}</p>
                </div>
                <button
                  className="text-xs text-red hover:opacity-80"
                  onClick={() => removerExercicio(ex.id)}
                >
                  Remover
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <label className="text-xs px-2 py-1 rounded bg-border/60 cursor-pointer">
                  Upload vídeo
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) =>
                      onUploadMedia(ex.id, "video", e.target.files?.[0])
                    }
                  />
                </label>
                <label className="text-xs px-2 py-1 rounded bg-border/60 cursor-pointer">
                  Upload imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      onUploadMedia(ex.id, "imagem", e.target.files?.[0])
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
