"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Target, LogOut, Link2, Copy, CheckCheck } from "lucide-react";
import { api, clearTokens, getStoredUser, storeUser } from "@/lib/api";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(getStoredUser());
  const [convite, setConvite] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [associarCodigo, setAssociarCodigo] = useState("");
  const [associarLoading, setAssociarLoading] = useState(false);
  const [associarMsg, setAssociarMsg] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nome: user?.nome ?? "",
    peso_alvo: user?.peso_alvo ?? "",
    gordura_alvo: user?.gordura_alvo ?? "",
  });

  useEffect(() => {
    api.perfil.me().then((r: any) => {
      setUser(r.data);
      storeUser(r.data);
      setForm({
        nome: r.data.nome,
        peso_alvo: r.data.peso_alvo ?? "",
        gordura_alvo: r.data.gordura_alvo ?? "",
      });
    });
  }, []);

  async function logout() {
    await api.auth.logout().catch(() => {});
    clearTokens();
    router.push("/auth/login");
  }

  async function gerarConvite() {
    const r = (await api.perfil.gerarConvite()) as any;
    setConvite(r.data);
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function associar() {
    if (!associarCodigo.trim()) return;
    setAssociarLoading(true);
    setAssociarMsg("");
    try {
      const r = (await api.perfil.associar({ codigo: associarCodigo })) as any;
      setAssociarMsg(`✓ Associado ao treinador ${r.data.treinador?.nome}!`);
      const updated = (await api.perfil.me()) as any;
      setUser(updated.data);
      storeUser(updated.data);
    } catch (err: any) {
      setAssociarMsg(`✗ ${err.message}`);
    } finally {
      setAssociarLoading(false);
    }
  }

  async function saveProfile() {
    const r = (await api.perfil.update({
      nome: form.nome,
      peso_alvo: form.peso_alvo
        ? parseFloat(String(form.peso_alvo))
        : undefined,
      gordura_alvo: form.gordura_alvo
        ? parseFloat(String(form.gordura_alvo))
        : undefined,
    })) as any;
    setUser(r.data);
    storeUser(r.data);
    setEditMode(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text">Perfil</h2>

      {/* User card */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
            <User className="w-7 h-7 text-cyan" />
          </div>
          <div>
            <p className="font-bold text-text text-lg">{user?.nome}</p>
            <p className="text-dim text-sm">{user?.email}</p>
            <span
              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${user?.tipo_usuario === "treinador" ? "bg-purple/10 text-purple border border-purple/20" : "bg-cyan/10 text-cyan border border-cyan/20"}`}
            >
              {user?.tipo_usuario === "treinador"
                ? "📊 Treinador"
                : "🏋️ Agente"}
            </span>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="ml-auto btn-ghost text-xs"
          >
            {editMode ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editMode ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={form.nome}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nome: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Peso alvo (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={form.peso_alvo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, peso_alvo: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Gordura alvo (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={form.gordura_alvo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gordura_alvo: e.target.value }))
                  }
                />
              </div>
            </div>
            <button onClick={saveProfile} className="btn-primary">
              Salvar alterações
            </button>
          </div>
        ) : (
          <div className="flex gap-4 border-t border-border pt-4">
            <MetaItem
              label="Peso alvo"
              value={user?.peso_alvo ? `${user.peso_alvo} kg` : "—"}
              color="text-cyan"
            />
            <MetaItem
              label="Gordura alvo"
              value={user?.gordura_alvo ? `${user.gordura_alvo}%` : "—"}
              color="text-amber"
            />
          </div>
        )}
      </div>

      {/* Trainer association (agente only) */}
      {user?.tipo_usuario === "agente" && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-cyan" />
            <span className="text-sm font-semibold text-text">
              Treinador vinculado
            </span>
          </div>
          {user?.treinador_id ? (
            <p className="text-green text-sm">✓ Vinculado ao seu treinador</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-dim text-sm">
                Insira o código de convite do seu treinador:
              </p>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Ex: ABC123"
                  value={associarCodigo}
                  onChange={(e) =>
                    setAssociarCodigo(e.target.value.toUpperCase())
                  }
                />
                <button
                  onClick={associar}
                  disabled={associarLoading}
                  className="btn-primary px-4"
                >
                  {associarLoading ? "..." : "Vincular"}
                </button>
              </div>
              {associarMsg && (
                <p
                  className={`text-sm ${associarMsg.startsWith("✓") ? "text-green" : "text-red"}`}
                >
                  {associarMsg}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invite code (trainer only) */}
      {user?.tipo_usuario === "treinador" && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-purple" />
            <span className="text-sm font-semibold text-text">
              Convidar aluno
            </span>
          </div>
          <p className="text-dim text-sm mb-3">
            Gere um código para seu aluno se cadastrar vinculado a você.
          </p>
          {convite ? (
            <div className="flex items-center gap-2 bg-border rounded-xl p-3">
              <code className="flex-1 text-lg font-bold text-cyan tracking-widest">
                {convite.codigo}
              </code>
              <button
                onClick={() => copyCode(convite.codigo)}
                className="text-dim hover:text-text"
              >
                {copied ? (
                  <CheckCheck className="w-4 h-4 text-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <button onClick={gerarConvite} className="btn-primary w-full">
              Gerar código de convite
            </button>
          )}
        </div>
      )}

      {/* Metas */}
      {user?.tipo_usuario === "treinador" && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-cyan" />
            <span className="text-sm font-semibold text-text">
              Acesso ao dashboard
            </span>
          </div>
          <a
            href="/trainer/dashboard"
            className="btn-primary block text-center w-full"
          >
            Abrir Base de Comando →
          </a>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center justify-center gap-2 text-red/70 hover:text-red text-sm py-3 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>
    </div>
  );
}

function MetaItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-dim">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
