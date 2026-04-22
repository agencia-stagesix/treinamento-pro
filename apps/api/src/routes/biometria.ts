import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const upsertSchema = z.object({
  peso: z.number().positive(),
  percentual_gordura: z.number().min(1).max(60).optional(),
  massa_muscular: z.number().positive().optional(),
  percentual_agua: z.number().min(0).max(100).optional(),
  gordura_visceral: z.number().int().min(1).max(30).optional(),
  cintura: z.number().positive().optional(),
  notas: z.string().max(1000).optional(),
  data_registro: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fonte: z.enum(["manual", "wearable", "balanca"]).default("manual"),
});

export async function biometriaRoutes(app: FastifyInstance) {
  // ── GET /biometria — histórico do agente logado ──────────
  app.get("/", { preHandler: app.authenticate }, async (req, reply) => {
    const { limit = "90", offset = "0" } = req.query as Record<string, string>;

    const { data, error } = await supabaseAdmin
      .from("biometria")
      .select("*")
      .eq("agente_id", req.user.id)
      .order("data_registro", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── POST /biometria — upsert por data ────────────────────
  app.post("/", { preHandler: app.authenticate }, async (req, reply) => {
    const body = upsertSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const date =
      body.data.data_registro ?? new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("biometria")
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

  // ── GET /biometria/summary — variação e tendência ────────
  app.get("/summary", { preHandler: app.authenticate }, async (req, reply) => {
    const { data, error } = await supabaseAdmin
      .from("biometria")
      .select("peso, percentual_gordura, massa_muscular, data_registro")
      .eq("agente_id", req.user.id)
      .order("data_registro", { ascending: false })
      .limit(30);

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    if (!data || data.length === 0) return reply.send({ data: null });

    const latest = data[0];
    const week = data.find(
      (d: { data_registro: string }) =>
        new Date(d.data_registro) <= new Date(Date.now() - 7 * 86400000),
    );
    const month = data[data.length - 1];

    const diff7 = week ? parseFloat(latest.peso) - parseFloat(week.peso) : 0;
    const diff30 = month ? parseFloat(latest.peso) - parseFloat(month.peso) : 0;

    return reply.send({
      data: {
        ultimo_peso: parseFloat(latest.peso),
        variacao_peso_7d: parseFloat(diff7.toFixed(2)),
        variacao_peso_30d: parseFloat(diff30.toFixed(2)),
        ultimo_percentual_gordura: latest.percentual_gordura
          ? parseFloat(latest.percentual_gordura)
          : null,
        ultima_massa_muscular: latest.massa_muscular
          ? parseFloat(latest.massa_muscular)
          : null,
        tendencia:
          diff7 > 0.2 ? "subindo" : diff7 < -0.2 ? "descendo" : "estavel",
      },
    });
  });

  // ── GET /biometria/:agente_id — treinador vê aluno ───────
  app.get(
    "/:agente_id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { agente_id } = req.params as { agente_id: string };

      // Verify access: treinador must own this agente
      if (req.user.tipo_usuario === "agente" && req.user.id !== agente_id) {
        return reply
          .code(403)
          .send({ error: "Forbidden", message: "Acesso negado" });
      }

      if (req.user.tipo_usuario === "treinador") {
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
      }

      const { limit = "90" } = req.query as Record<string, string>;
      const { data, error } = await supabaseAdmin
        .from("biometria")
        .select("*")
        .eq("agente_id", agente_id)
        .order("data_registro", { ascending: false })
        .limit(parseInt(limit));

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );
}
