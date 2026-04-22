import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const confirmarSchema = z.object({ id: z.string().uuid() });

export async function suplementacaoRoutes(app: FastifyInstance) {
  // ── GET /suplementacao/hoje ──────────────────────────────
  app.get("/hoje", { preHandler: app.authenticate }, async (req, reply) => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin
      .from("suplementacao_log")
      .select("*")
      .eq("agente_id", req.user.id)
      .eq("data_log", today)
      .order("horario_alvo", { ascending: true });

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── POST /suplementacao/confirmar ────────────────────────
  app.post(
    "/confirmar",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const body = confirmarSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { data, error } = await supabaseAdmin
        .from("suplementacao_log")
        .update({ confirmado: true, horario_real: new Date().toISOString() })
        .eq("id", body.data.id)
        .eq("agente_id", req.user.id)
        .select()
        .single();

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );

  // ── GET /suplementacao/aderencia ─────────────────────────
  app.get(
    "/aderencia",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { dias = "7" } = req.query as Record<string, string>;
      const since = new Date(Date.now() - parseInt(dias) * 86400000)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabaseAdmin
        .from("suplementacao_log")
        .select("suplemento, confirmado, data_log")
        .eq("agente_id", req.user.id)
        .gte("data_log", since);

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });

      const total = (data ?? []).length;
      const confirmados = (data ?? []).filter(
        (d: { confirmado: boolean }) => d.confirmado,
      ).length;

      return reply.send({
        data: {
          total,
          confirmados,
          percentual: total > 0 ? Math.round((confirmados / total) * 100) : 0,
          registros: data,
        },
      });
    },
  );
}
