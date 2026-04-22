import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const treinoSchema = z.object({
  data_treino: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  tipo: z.string().optional(),
  duracao_minutos: z.number().int().positive().optional(),
  calorias: z.number().int().positive().optional(),
  frequencia_cardiaca_media: z.number().int().positive().optional(),
  frequencia_cardiaca_pico: z.number().int().positive().optional(),
  esforco_percebido: z.number().int().min(1).max(10).optional(),
  notas: z.string().max(2000).optional(),
  status: z.enum(["concluido", "cancelado", "parcial"]).default("concluido"),
  fonte_fc: z.enum(["manual", "wearable"]).default("manual"),
  series: z
    .array(
      z.object({
        exercicio: z.string(),
        serie_num: z.number().int().positive(),
        repeticoes: z.number().int().positive().optional(),
        carga_kg: z.number().nonnegative().optional(),
        notas: z.string().optional(),
      }),
    )
    .optional(),
});

const updateSchema = treinoSchema.partial();

export async function treinosRoutes(app: FastifyInstance) {
  // ── GET /treinos ─────────────────────────────────────────
  app.get("/", { preHandler: app.authenticate }, async (req, reply) => {
    const { limit = "30", offset = "0" } = req.query as Record<string, string>;

    const { data, error } = await supabaseAdmin
      .from("treinos_realizados")
      .select("*, series_treino(*)")
      .eq("agente_id", req.user.id)
      .order("data_treino", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── POST /treinos ────────────────────────────────────────
  app.post("/", { preHandler: app.authenticate }, async (req, reply) => {
    const body = treinoSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const { series, ...treinoData } = body.data;
    const date =
      treinoData.data_treino ?? new Date().toISOString().split("T")[0];

    const { data: treino, error } = await supabaseAdmin
      .from("treinos_realizados")
      .insert({ agente_id: req.user.id, ...treinoData, data_treino: date })
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });

    // Insert series if provided
    if (series && series.length > 0) {
      await supabaseAdmin
        .from("series_treino")
        .insert(
          series.map((s) => ({
            ...s,
            treino_id: treino.id,
            agente_id: req.user.id,
          })),
        );
    }

    // Fetch with series
    const { data: full } = await supabaseAdmin
      .from("treinos_realizados")
      .select("*, series_treino(*)")
      .eq("id", treino.id)
      .single();

    return reply.code(201).send({ data: full });
  });

  // ── PUT /treinos/:id ─────────────────────────────────────
  app.put("/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = updateSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const { series, ...treinoData } = body.data;

    const { data, error } = await supabaseAdmin
      .from("treinos_realizados")
      .update(treinoData)
      .eq("id", id)
      .eq("agente_id", req.user.id)
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── GET /treinos/volume — volume total (séries×reps×carga) ─
  app.get("/volume", { preHandler: app.authenticate }, async (req, reply) => {
    const { dias = "30" } = req.query as Record<string, string>;
    const since = new Date(Date.now() - parseInt(dias) * 86400000)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("series_treino")
      .select(
        "carga_kg, repeticoes, treino_id, treinos_realizados!inner(data_treino, agente_id)",
      )
      .eq("treinos_realizados.agente_id", req.user.id)
      .gte("treinos_realizados.data_treino", since);

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });

    // Group by treino date and calculate volume
    const volumeMap = new Map<
      string,
      { volume_total: number; total_series: number; total_repeticoes: number }
    >();

    for (const row of data as any[]) {
      const date = row.treinos_realizados?.data_treino ?? "unknown";
      const vol = (row.carga_kg ?? 0) * (row.repeticoes ?? 1);
      const current = volumeMap.get(date) ?? {
        volume_total: 0,
        total_series: 0,
        total_repeticoes: 0,
      };
      volumeMap.set(date, {
        volume_total: current.volume_total + vol,
        total_series: current.total_series + 1,
        total_repeticoes: current.total_repeticoes + (row.repeticoes ?? 0),
      });
    }

    const result = Array.from(volumeMap.entries())
      .map(([date, v]) => ({ data_treino: date, ...v }))
      .sort((a, b) => a.data_treino.localeCompare(b.data_treino));

    return reply.send({ data: result });
  });

  // ── GET /treinos/:agente_id/dashboard — treinador ────────
  app.get(
    "/:agente_id/dashboard",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { agente_id } = req.params as { agente_id: string };
      if (req.user.tipo_usuario !== "treinador" && req.user.id !== agente_id) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("treinos_realizados")
        .select("*")
        .eq("agente_id", agente_id)
        .order("data_treino", { ascending: false })
        .limit(30);

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );
}
