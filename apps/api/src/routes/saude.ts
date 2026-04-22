import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const saudeSchema = z.object({
  frequencia_cardiaca_maxima_teste: z.number().int().positive().optional(),
  frequencia_cardiaca_repouso: z.number().int().positive().optional(),
  data_exame: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function saudeRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.authenticate }, async (req, reply) => {
    const { data, error } = await supabaseAdmin
      .from("saude")
      .select(
        "id, agente_id, frequencia_cardiaca_maxima_teste, frequencia_cardiaca_repouso, frequencia_cardiaca_limite_alerta, data_exame, dados_extraidos_ia, created_at",
      )
      .eq("agente_id", req.user.id)
      .order("data_exame", { ascending: false });

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  app.post("/", { preHandler: app.authenticate }, async (req, reply) => {
    const body = saudeSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const { data, error } = await supabaseAdmin
      .from("saude")
      .insert({ agente_id: req.user.id, ...body.data })
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.code(201).send({ data });
  });
}
