"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api, storeTokens, storeUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    tipo_usuario: "agente" as "agente" | "treinador",
    codigo_convite: "",
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.senha.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = { ...form };
      if (!payload.codigo_convite) delete (payload as any).codigo_convite;

      const res = (await api.auth.register(payload)) as any;
      storeTokens(res.data.access_token, res.data.refresh_token);
      storeUser(res.data.user);

      if (res.data.user.tipo_usuario === "treinador") {
        router.push("/trainer/dashboard");
      } else {
        router.push("/hoje");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.svg"
            alt="Treinamento Pro"
            width={280}
            height={56}
          />
          <h1 className="text-2xl font-bold text-text">Criar conta</h1>
          <p className="text-dim text-sm mt-1">Treinamento Pro</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red/10 border border-red/20 text-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                className="input"
                placeholder="Seu nome"
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Senha (mín. 8 caracteres)</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text"
                >
                  {show ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Sou...</label>
              <div className="flex gap-2">
                {(["agente", "treinador"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => update("tipo_usuario", tipo)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.tipo_usuario === tipo
                        ? "bg-cyan/10 border-cyan text-cyan"
                        : "bg-border border-dim3 text-dim hover:text-text"
                    }`}
                  >
                    {tipo === "agente" ? "🏋️ Aluno / Agente" : "📊 Treinador"}
                  </button>
                ))}
              </div>
            </div>

            {form.tipo_usuario === "agente" && (
              <div>
                <label className="label">Código do treinador (opcional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: ABC123"
                  value={form.codigo_convite}
                  onChange={(e) =>
                    update("codigo_convite", e.target.value.toUpperCase())
                  }
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 py-3 text-base"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-dim text-sm mt-4">
          Já tem conta?{" "}
          <Link
            href="/auth/login"
            className="text-cyan hover:underline font-medium"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
