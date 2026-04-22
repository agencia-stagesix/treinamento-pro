import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const schema = z.object({
  qualidade_sono: z.number().int().min(1).max(5),
  nivel_estresse: z.number().int().min(1).max(5),
  fadiga_muscular: z.number().int().min(1).max(5),
  data_registro: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function readinessRoutes(app: FastifyInstance) {
  // ── POST /readiness ──────────────────────────────────────
  app.post("/", { preHandler: app.authenticate }, async (req, reply) => {
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const date =
      body.data.data_registro ?? new Date().toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin
      .from("readiness_diario")
      .upsert(
        { agente_id: req.user.id, ...body.data, data_registro: date },
        { onConflict: "agente_id,data_registro" },
      )
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.code(201).send({ data });
  });

  // ── GET /readiness/hoje ──────────────────────────────────
  app.get("/hoje", { preHandler: app.authenticate }, async (req, reply) => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin
      .from("readiness_diario")
      .select("*")
      .eq("agente_id", req.user.id)
      .eq("data_registro", today)
      .maybeSingle();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── GET /readiness/historico ─────────────────────────────
  app.get(
    "/historico",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { dias = "30" } = req.query as Record<string, string>;
      const since = new Date(Date.now() - parseInt(dias) * 86400000)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabaseAdmin
        .from("readiness_diario")
        .select("*")
        .eq("agente_id", req.user.id)
        .gte("data_registro", since)
        .order("data_registro", { ascending: false });

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );
}
