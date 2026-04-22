import type { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../lib/supabase.js";

export async function exerciciosRoutes(app: FastifyInstance) {
  // ── GET /exercicios?q= — busca semântica por tags/nome ───
  app.get("/", async (req, reply) => {
    const { q, grupo, limit = "20" } = req.query as Record<string, string>;

    let query = supabaseAdmin
      .from("exercicios")
      .select(
        "id, nome, grupo_muscular, equipamento, tags, descricao, video_url",
      )
      .order("nome", { ascending: true })
      .limit(parseInt(limit));

    if (grupo) {
      query = query.eq("grupo_muscular", grupo);
    }

    if (q) {
      const term = q.toLowerCase().trim();
      // Search by name (ilike) OR tags (array contains)
      query = query.or(`nome.ilike.%${term}%,tags.cs.{${term}}`);
    }

    const { data, error } = await query;
    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });

    // If tags search yields no results, try partial tag match
    if ((!data || data.length === 0) && q) {
      const { data: fallback } = await supabaseAdmin
        .from("exercicios")
        .select("id, nome, grupo_muscular, equipamento, tags, descricao")
        .textSearch("tags", q.split(" ").join(" | "))
        .limit(parseInt(limit));

      return reply.send({ data: fallback ?? [] });
    }

    return reply.send({ data });
  });

  // ── GET /exercicios/grupos — lista grupos musculares ─────
  app.get("/grupos", async (_req, reply) => {
    const { data, error } = await supabaseAdmin
      .from("exercicios")
      .select("grupo_muscular");

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });

    const grupos = [
      ...new Set(
        (data ?? []).map((d: { grupo_muscular: string }) => d.grupo_muscular),
      ),
    ].sort();
    return reply.send({ data: grupos });
  });

  // ── GET /exercicios/:id ──────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { data, error } = await supabaseAdmin
      .from("exercicios")
      .select("*")
      .eq("id", id)
      .single();

    if (error)
      return reply
        .code(404)
        .send({ error: "NotFound", message: "Exercício não encontrado" });
    return reply.send({ data });
  });
}
