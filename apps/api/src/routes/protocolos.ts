import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const protocoloSchema = z.object({
  plano_alimentar: z
    .array(
      z.object({
        tipo: z.string(),
        horario: z.string(),
        descricao: z.string(),
        calorias_alvo: z.number().optional(),
        proteina_alvo: z.number().optional(),
      }),
    )
    .default([]),
  planilha_treino: z
    .array(
      z.object({
        dia_semana: z.number().int().min(0).max(6),
        nome: z.string(),
        exercicios: z.array(
          z.object({
            nome: z.string(),
            series: z.number().int().positive(),
            repeticoes: z.string(),
            carga: z.string().optional(),
            descanso_seg: z.number().int().optional(),
            video_url: z.string().url().optional(),
            notas: z.string().optional(),
          }),
        ),
      }),
    )
    .default([]),
  suplementos: z
    .array(
      z.object({
        nome: z.string(),
        dose: z.string(),
        horario_relativo: z.string(),
      }),
    )
    .default([]),
  metas: z
    .object({
      peso_alvo: z.number().optional(),
      gordura_alvo: z.number().optional(),
      prazo: z.string().optional(),
    })
    .default({}),
});

export async function protocolosRoutes(app: FastifyInstance) {
  // ── GET /protocolos/meu — aluno vê seu protocolo ─────────
  app.get("/meu", { preHandler: app.authenticate }, async (req, reply) => {
    const { data, error } = await supabaseAdmin
      .from("protocolos")
      .select("*")
      .eq("agente_id", req.user.id)
      .eq("ativo", true)
      .order("versao", { ascending: false })
      .maybeSingle();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── PUT /protocolos/:agente_id — treinador atualiza ──────
  app.put(
    "/:agente_id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (
        req.user.tipo_usuario !== "treinador" &&
        req.user.tipo_usuario !== "admin"
      ) {
        return reply
          .code(403)
          .send({
            error: "Forbidden",
            message: "Apenas treinadores podem editar protocolos",
          });
      }

      const { agente_id } = req.params as { agente_id: string };
      const body = protocoloSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      // Verify this agente belongs to this treinador
      const { data: agente } = await supabaseAdmin
        .from("perfis")
        .select("treinador_id")
        .eq("id", agente_id)
        .single();

      if (agente?.treinador_id !== req.user.id) {
        return reply
          .code(403)
          .send({ error: "Forbidden", message: "Este aluno não é seu" });
      }

      // Upsert protocol, increment version
      const { data: existing } = await supabaseAdmin
        .from("protocolos")
        .select("id, versao")
        .eq("agente_id", agente_id)
        .eq("ativo", true)
        .maybeSingle();

      const payload = {
        agente_id,
        treinador_id: req.user.id,
        ...body.data,
        versao: (existing?.versao ?? 0) + 1,
        ativo: true,
      };

      let data, error;
      if (existing) {
        ({ data, error } = await supabaseAdmin
          .from("protocolos")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabaseAdmin
          .from("protocolos")
          .insert(payload)
          .select()
          .single());
      }

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });

      // Generate suplementacao_log entries for next 7 days based on suplementos list
      if (body.data.suplementos && body.data.suplementos.length > 0) {
        const today = new Date();
        const entries = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          for (const sup of body.data.suplementos) {
            entries.push({
              agente_id,
              suplemento: `${sup.nome} — ${sup.dose}`,
              horario_alvo: null,
              data_log: dateStr,
            });
          }
        }
        // Only insert if not already exists for this period
        await supabaseAdmin
          .from("suplementacao_log")
          .upsert(entries, { ignoreDuplicates: true });
      }

      return reply.send({ data });
    },
  );

  // ── GET /protocolos/:agente_id — treinador lê protocolo ──
  app.get(
    "/:agente_id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { agente_id } = req.params as { agente_id: string };

      if (req.user.tipo_usuario === "agente" && req.user.id !== agente_id) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("protocolos")
        .select("*")
        .eq("agente_id", agente_id)
        .eq("ativo", true)
        .maybeSingle();

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );
}
