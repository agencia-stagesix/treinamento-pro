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
    </div>
  );
}
