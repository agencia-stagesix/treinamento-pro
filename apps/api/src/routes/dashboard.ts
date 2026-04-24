import type { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../lib/supabase.js";

export async function dashboardRoutes(app: FastifyInstance) {
  // ── GET /dashboard/esquadrao — todos os alunos do treinador
  app.get(
    "/esquadrao",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (
        req.user.tipo_usuario !== "treinador" &&
        req.user.tipo_usuario !== "admin"
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const today = new Date().toISOString().split("T")[0];

      // Get all agentes of this treinador
      const { data: agentes, error: agentesError } = await supabaseAdmin
        .from("perfis")
        .select("id, nome, foto_url, peso_alvo, gordura_alvo")
        .eq("treinador_id", req.user.id)
        .eq("tipo_usuario", "agente")
        .order("nome");

      if (agentesError)
        return reply
          .code(500)
          .send({ error: "DBError", message: agentesError.message });
      if (!agentes || agentes.length === 0) return reply.send({ data: [] });

      const ids = agentes.map((a: { id: string }) => a.id);

      // Batch queries in parallel
      const [biometrias, treinos, refeicoes, hidratacao, readiness, alertas] =
        await Promise.all([
          supabaseAdmin
            .from("biometria")
            .select("agente_id, peso, data_registro")
            .in("agente_id", ids)
            .order("data_registro", { ascending: false }),

          supabaseAdmin
            .from("treinos_realizados")
            .select("agente_id, data_treino, status")
            .in("agente_id", ids)
            .eq("data_treino", today),

          supabaseAdmin
            .from("refeicoes")
            .select("agente_id")
            .in("agente_id", ids)
            .eq("data_refeicao", today),

          supabaseAdmin
            .from("hidratacao_log")
            .select("agente_id, volume_ml, meta_ml")
            .in("agente_id", ids)
            .eq("data_log", today),

          supabaseAdmin
            .from("readiness_diario")
            .select("agente_id, score_calculado")
            .in("agente_id", ids)
            .eq("data_registro", today),

          supabaseAdmin
            .from("alertas_treinador")
            .select("agente_id, id, tipo_alerta, severidade")
            .eq("treinador_id", req.user.id)
            .eq("lido", false),
        ]);

      // Build status per agente
      const statusMap = new Map<
        string,
        { ultimo_peso?: number; variacao_peso?: number }
      >();

      // Latest weight per agente
      const latestBio = new Map<string, { peso: number; data: string }>();
      for (const b of (biometrias.data ?? []) as any[]) {
        if (!latestBio.has(b.agente_id))
          latestBio.set(b.agente_id, { peso: b.peso, data: b.data_registro });
      }

      const treinosHoje = new Set(
        (treinos.data ?? []).map((t: any) => t.agente_id),
      );
      const refeicoesHoje = new Set(
        (refeicoes.data ?? []).map((r: any) => r.agente_id),
      );

      const hidMap = new Map<string, number>();
      for (const h of (hidratacao.data ?? []) as any[]) {
        hidMap.set(h.agente_id, (hidMap.get(h.agente_id) ?? 0) + h.volume_ml);
      }
      const hidMetaMap = new Map<string, number>();
      for (const h of (hidratacao.data ?? []) as any[]) {
        if (!hidMetaMap.has(h.agente_id))
          hidMetaMap.set(h.agente_id, h.meta_ml ?? 4000);
      }

      const readinessMap = new Map<string, number>();
      for (const r of (readiness.data ?? []) as any[]) {
        readinessMap.set(r.agente_id, r.score_calculado);
      }

      const alertasMap = new Map<string, any[]>();
      for (const a of (alertas.data ?? []) as any[]) {
        const arr = alertasMap.get(a.agente_id) ?? [];
        arr.push({
          id: a.id,
          tipo_alerta: a.tipo_alerta,
          severidade: a.severidade,
        });
        alertasMap.set(a.agente_id, arr);
      }

      // Days since last registration
      const lastRegMap = new Map<string, string>();
      for (const b of (biometrias.data ?? []) as any[]) {
        if (!lastRegMap.has(b.agente_id))
          lastRegMap.set(b.agente_id, b.data_registro);
      }

      const result = agentes.map((agente: any) => {
        const bio = latestBio.get(agente.id);
        const lastDate = lastRegMap.get(agente.id);
        const daysSince = lastDate
          ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
          : 999;

        return {
          agente: {
            id: agente.id,
            nome: agente.nome,
            foto_url: agente.foto_url,
          },
          ultimo_peso: bio?.peso ?? null,
          variacao_peso: null, // computed separately if needed
          treinou_hoje: treinosHoje.has(agente.id),
          registrou_refeicao_hoje: refeicoesHoje.has(agente.id),
          hidratacao_hoje_ml: hidMap.get(agente.id) ?? 0,
          hidratacao_meta_ml: hidMetaMap.get(agente.id) ?? 4000,
          readiness_hoje: readinessMap.get(agente.id) ?? null,
          dias_sem_registro: daysSince,
          alertas_ativos: alertasMap.get(agente.id) ?? [],
        };
      });

      // Sort: critical first, then by attention needed
      result.sort((a: any, b: any) => {
        const aPriority = a.alertas_ativos.some(
          (x: any) => x.severidade === "critical",
        )
          ? 0
          : a.alertas_ativos.some((x: any) => x.severidade === "warning")
            ? 1
            : a.dias_sem_registro > 3
              ? 2
              : 3;
        const bPriority = b.alertas_ativos.some(
          (x: any) => x.severidade === "critical",
        )
          ? 0
          : b.alertas_ativos.some((x: any) => x.severidade === "warning")
            ? 1
            : b.dias_sem_registro > 3
              ? 2
              : 3;
        return aPriority - bPriority;
      });

      return reply.send({ data: result });
    },
  );

  // ── GET /dashboard/alertas ───────────────────────────────
  app.get("/alertas", { preHandler: app.authenticate }, async (req, reply) => {
    if (req.user.tipo_usuario === "agente") {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const { lido = "false" } = req.query as Record<string, string>;

    let query = supabaseAdmin
      .from("alertas_treinador")
      .select("*, agente:perfis!agente_id(id, nome, foto_url)")
      .eq("treinador_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (lido !== "all") {
      query = query.eq("lido", lido === "true");
    }

    const { data, error } = await query;
    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const d3 = new Date(today);
    d3.setDate(today.getDate() + 3);
    const d3Str = d3.toISOString().slice(0, 10);

    const { data: vencimentos } = await supabaseAdmin
      .from("aluno_series_vinculos")
      .select(
        "id, validade_em, agente:perfis!agente_id(id, nome, foto_url), template:series_templates(nome)",
      )
      .eq("treinador_id", req.user.id)
      .eq("status", "ativo")
      .in("validade_em", [todayStr, d3Str]);

    const alertaVencimento = (vencimentos ?? []).map((v: any) => {
      const dias =
        Math.floor(
          (new Date(v.validade_em).getTime() - new Date(todayStr).getTime()) /
            86400000,
        ) || 0;
      return {
        id: `venc-${v.id}`,
        agente_id: v.agente?.id,
        tipo_alerta:
          dias === 0
            ? "vencimento_treinamento_d0"
            : "vencimento_treinamento_d3",
        severidade: dias === 0 ? "critical" : "warning",
        descricao:
          dias === 0
            ? `Treinamento vence hoje (${v.template?.nome ?? "série"})`
            : `Treinamento vence em 3 dias (${v.template?.nome ?? "série"})`,
        created_at: new Date().toISOString(),
        lido: false,
        agente: v.agente,
      };
    });

    return reply.send({ data: [...(data ?? []), ...alertaVencimento] });
  });

  // ── PUT /dashboard/alertas/:id/lido ─────────────────────
  app.put(
    "/alertas/:id/lido",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { acao_tomada } = (req.body ?? {}) as { acao_tomada?: string };

      const { data, error } = await supabaseAdmin
        .from("alertas_treinador")
        .update({ lido: true, acao_tomada })
        .eq("id", id)
        .eq("treinador_id", req.user.id)
        .select()
        .single();

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );

  // ── GET /dashboard/aluno/:id — ficha completa ────────────
  app.get(
    "/aluno/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      if (req.user.tipo_usuario === "agente" && req.user.id !== id) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const [
        perfil,
        biometria,
        treinos,
        readiness,
        protocolo,
        alertas,
        treinoExecucoes,
      ] = await Promise.all([
        supabaseAdmin.from("perfis").select("*").eq("id", id).single(),
        supabaseAdmin
          .from("biometria")
          .select("*")
          .eq("agente_id", id)
          .order("data_registro", { ascending: false })
          .limit(90),
        supabaseAdmin
          .from("treinos_realizados")
          .select("*")
          .eq("agente_id", id)
          .order("data_treino", { ascending: false })
          .limit(30),
        supabaseAdmin
          .from("readiness_diario")
          .select("*")
          .eq("agente_id", id)
          .order("data_registro", { ascending: false })
          .limit(30),
        supabaseAdmin
          .from("protocolos")
          .select("*")
          .eq("agente_id", id)
          .eq("ativo", true)
          .maybeSingle(),
        supabaseAdmin
          .from("alertas_treinador")
          .select("*")
          .eq("agente_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabaseAdmin
          .from("treino_execucoes")
          .select(
            "*, vinculo:aluno_series_vinculos(*), itens:treino_execucao_itens(*, exercicio:exercicios(*))",
          )
          .eq("agente_id", id)
          .order("iniciado_em", { ascending: false })
          .limit(20),
      ]);

      return reply.send({
        data: {
          perfil: perfil.data,
          biometria: biometria.data,
          treinos: treinos.data,
          readiness: readiness.data,
          protocolo: protocolo.data,
          alertas: alertas.data,
          treino_execucoes: treinoExecucoes.data,
        },
      });
    },
  );
}
