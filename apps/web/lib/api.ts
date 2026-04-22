const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("sb-token");
  return raw ? (JSON.parse(raw)?.access_token ?? null) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }
  return json;
}

// ── Auth ────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: object) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: object) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () =>
      request("/auth/logout", { method: "POST", body: JSON.stringify({}) }),
    changePassword: (body: object) =>
      request("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  perfil: {
    me: () => request("/perfil/me"),
    update: (body: object) =>
      request("/perfil/me", { method: "PATCH", body: JSON.stringify(body) }),
    associar: (body: object) =>
      request("/perfil/associar", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    gerarConvite: () =>
      request("/perfil/gerar-convite", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    meusAlunos: () => request("/perfil/meus-alunos"),
    meusConvites: () => request("/perfil/meus-convites"),
  },

  biometria: {
    list: (params?: { limit?: number; offset?: number }) =>
      request(`/biometria?${new URLSearchParams(params as any)}`),
    save: (body: object) =>
      request("/biometria", { method: "POST", body: JSON.stringify(body) }),
    summary: () => request("/biometria/summary"),
    listByAgente: (id: string, params?: { limit?: number }) =>
      request(`/biometria/${id}?${new URLSearchParams(params as any)}`),
    getByAgente: (id: string, params?: { limit?: number }) =>
      request(`/biometria/${id}?${new URLSearchParams(params as any)}`),
  },

  treinos: {
    list: (params?: { limit?: number; offset?: number }) =>
      request(`/treinos?${new URLSearchParams(params as any)}`),
    save: (body: object) =>
      request("/treinos", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      request(`/treinos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    volume: (dias?: number, agenteId?: string) =>
      request(
        `/treinos${agenteId ? `/${agenteId}` : ""}/volume?dias=${dias ?? 30}`,
      ),
    volumeByAgente: (agenteId: string, dias?: number) =>
      request(`/treinos/${agenteId}/dashboard?dias=${dias ?? 30}`),
  },

  hidratacao: {
    hoje: () => request("/hidratacao/hoje"),
    add: (volume_ml: number, meta_ml?: number) =>
      request("/hidratacao/add", {
        method: "POST",
        body: JSON.stringify({ volume_ml, meta_ml }),
      }),
    remove: (volume_ml: number) =>
      request("/hidratacao/remove", {
        method: "POST",
        body: JSON.stringify({ volume_ml }),
      }),
    historico: (dias?: number) =>
      request(`/hidratacao/historico?dias=${dias ?? 30}`),
  },

  readiness: {
    hoje: () => request("/readiness/hoje"),
    save: (body: object) =>
      request("/readiness", { method: "POST", body: JSON.stringify(body) }),
    historico: (dias?: number, agenteId?: string) =>
      request(
        `/readiness/historico?dias=${dias ?? 30}${agenteId ? `&agente_id=${agenteId}` : ""}`,
      ),
  },

  refeicoes: {
    hoje: () => request("/refeicoes"),
    list: (params?: { data_inicio?: string; data_fim?: string }) =>
      request(`/refeicoes?${new URLSearchParams(params as any)}`),
    save: (body: object) =>
      request("/refeicoes", { method: "POST", body: JSON.stringify(body) }),
    remove: (id: string) => request(`/refeicoes/${id}`, { method: "DELETE" }),
  },

  suplementacao: {
    hoje: () => request("/suplementacao/hoje"),
    confirmar: (id: string) =>
      request("/suplementacao/confirmar", {
        method: "POST",
        body: JSON.stringify({ id }),
      }),
    aderencia: (dias?: number) =>
      request(`/suplementacao/aderencia?dias=${dias ?? 7}`),
  },

  protocolos: {
    meu: () => request("/protocolos/meu"),
    get: (agente_id: string) => request(`/protocolos/${agente_id}`),
    update: (agente_id: string, body: object) =>
      request(`/protocolos/${agente_id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },

  exercicios: {
    search: (
      params: { q?: string; grupo?: string; limit?: number } | string,
      grupo?: string,
    ) => {
      if (typeof params === "string") {
        return request(
          `/exercicios?q=${encodeURIComponent(params)}${grupo ? `&grupo=${grupo}` : ""}`,
        );
      }
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined),
        ) as any,
      );
      return request(`/exercicios?${qs}`);
    },
    grupos: () => request("/exercicios/grupos"),
    get: (id: string) => request(`/exercicios/${id}`),
  },

  dashboard: {
    esquadrao: () => request("/dashboard/esquadrao"),
    alertas: (params?: { apenasNaoLidos?: boolean } | boolean) => {
      const naoLidos =
        typeof params === "boolean" ? params : (params?.apenasNaoLidos ?? true);
      return request(`/dashboard/alertas?lido=${!naoLidos}`);
    },
    marcarLido: (id: string, acao_tomada?: string) =>
      request(`/dashboard/alertas/${id}/lido`, {
        method: "PUT",
        body: JSON.stringify({ acao_tomada }),
      }),
    marcarAlertaLido: (id: string) =>
      request(`/dashboard/alertas/${id}/lido`, {
        method: "PUT",
        body: JSON.stringify({}),
      }),
    aluno: (id: string) => request(`/dashboard/aluno/${id}`),
  },

  saude: {
    list: () => request("/saude"),
    save: (body: object) =>
      request("/saude", { method: "POST", body: JSON.stringify(body) }),
  },
};

// Store token in localStorage under key 'sb-token'
export function storeTokens(access_token: string, refresh_token: string) {
  localStorage.setItem(
    "sb-token",
    JSON.stringify({ access_token, refresh_token }),
  );
}

export function clearTokens() {
  localStorage.removeItem("sb-token");
  localStorage.removeItem("sb-user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("sb-user");
  return raw ? JSON.parse(raw) : null;
}

export function storeUser(user: object) {
  localStorage.setItem("sb-user", JSON.stringify(user));
}
