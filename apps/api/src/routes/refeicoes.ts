import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const schema = z.object({
  tipo: z.enum([
    "Pre-Treino",
    "Pos-Treino",
    "Cafe-da-Manha",
    "Almoco",
    "Lanche",
    "Jantar",
    "Ceia",
  ]),
  descricao: z.string().max(1000).optional(),
  calorias_estimadas: z.number().int().positive().optional(),
  proteina_g: z.number().nonnegative().optional(),
  carboidrato_g: z.number().nonnegative().optional(),
  gordura_g: z.number().nonnegative().optional(),
  fibra_g: z.number().nonnegative().optional(),
  dentro_protocolo: z.boolean().optional(),
  data_refeicao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function refeicoesRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.authenticate }, async (req, reply) => {
    const { data_inicio, data_fim } = req.query as Record<string, string>;
    const today = new Date().toISOString().split("T")[0];

    let query = supabaseAdmin
      .from("refeicoes")
      .select("*")
      .eq("agente_id", req.user.id)
      .order("created_at", { ascending: false });

    if (data_inicio) query = query.gte("data_refeicao", data_inicio);
    if (data_fim) query = query.lte("data_refeicao", data_fim);
    if (!data_inicio && !data_fim) query = query.eq("data_refeicao", today);

    const { data, error } = await query;
    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  app.post("/", { preHandler: app.authenticate }, async (req, reply) => {
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const date =
      body.data.data_refeicao ?? new Date().toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin
      .from("refeicoes")
      .insert({ agente_id: req.user.id, ...body.data, data_refeicao: date })
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.code(201).send({ data });
  });

  app.delete("/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { error } = await supabaseAdmin
      .from("refeicoes")
      .delete()
      .eq("id", id)
      .eq("agente_id", req.user.id);

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.code(204).send();
  });
}
