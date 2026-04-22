"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api, storeTokens, storeUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = (await api.auth.login({ email, senha })) as any;
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.svg"
            alt="Treinamento Pro"
            width={280}
            height={56}
          />
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text mb-5">Entrar</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red/10 border border-red/20 text-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 py-3 text-base"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-dim text-sm mt-4">
          Não tem conta?{" "}
          <Link
            href="/auth/register"
            className="text-cyan hover:underline font-medium"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
