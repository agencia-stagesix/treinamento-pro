import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const addSchema = z.object({
  volume_ml: z.number().int().positive(),
  meta_ml: z.number().int().positive().default(4000),
  data_log: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const removeSchema = z.object({
  volume_ml: z.number().int().positive(),
  data_log: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function hidratacaoRoutes(app: FastifyInstance) {
  // ── GET /hidratacao/hoje ─────────────────────────────────
  app.get("/hoje", { preHandler: app.authenticate }, async (req, reply) => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("hidratacao_log")
      .select("*")
      .eq("agente_id", req.user.id)
      .eq("data_log", today)
      .order("created_at", { ascending: true });

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });

    const total_ml = (data ?? []).reduce(
      (sum: number, r: { volume_ml: number }) => sum + r.volume_ml,
      0,
    );
    const meta_ml = data?.[0]?.meta_ml ?? 4000;

    return reply.send({
      data: {
        registros: data,
        total_ml,
        meta_ml,
        percentual: Math.min(100, Math.round((total_ml / meta_ml) * 100)),
      },
    });
  });

  // ── POST /hidratacao/add ─────────────────────────────────
  app.post("/add", { preHandler: app.authenticate }, async (req, reply) => {
    const body = addSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const date = body.data.data_log ?? new Date().toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin
      .from("hidratacao_log")
      .insert({ agente_id: req.user.id, ...body.data, data_log: date })
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.code(201).send({ data });
  });

  // ── POST /hidratacao/remove — remove último registro ─────
  app.post("/remove", { preHandler: app.authenticate }, async (req, reply) => {
    const body = removeSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const date = body.data.data_log ?? new Date().toISOString().split("T")[0];

    // Find most recent log entry that is >= volume_ml to remove
    const { data: logs } = await supabaseAdmin
      .from("hidratacao_log")
      .select("id, volume_ml")
      .eq("agente_id", req.user.id)
      .eq("data_log", date)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!logs || logs.length === 0) {
      return reply
        .code(404)
        .send({ error: "NotFound", message: "Nenhum registro encontrado" });
    }

    await supabaseAdmin.from("hidratacao_log").delete().eq("id", logs[0].id);
    return reply.send({ data: { removed: logs[0] } });
  });

  // ── GET /hidratacao/historico ────────────────────────────
  app.get(
    "/historico",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { dias = "30" } = req.query as Record<string, string>;
      const since = new Date(Date.now() - parseInt(dias) * 86400000)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabaseAdmin
        .from("hidratacao_log")
        .select("data_log, volume_ml, meta_ml")
        .eq("agente_id", req.user.id)
        .gte("data_log", since)
        .order("data_log", { ascending: false });

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });

      // Aggregate by date
      const map = new Map<string, { total_ml: number; meta_ml: number }>();
      for (const row of (data ?? []) as any[]) {
        const cur = map.get(row.data_log) ?? {
          total_ml: 0,
          meta_ml: row.meta_ml ?? 4000,
        };
        map.set(row.data_log, {
          total_ml: cur.total_ml + row.volume_ml,
          meta_ml: cur.meta_ml,
        });
      }

      return reply.send({
        data: Array.from(map.entries()).map(([date, v]) => ({
          data_log: date,
          ...v,
          percentual: Math.min(100, Math.round((v.total_ml / v.meta_ml) * 100)),
        })),
      });
    },
  );
}
