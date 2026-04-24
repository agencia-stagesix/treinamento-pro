import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const exercicioSchema = z.object({
  nome: z.string().min(2).max(255),
  grupo_muscular: z.string().min(2).max(100),
  equipamento: z.string().max(100).optional(),
  tags: z.array(z.string().min(1)).default([]),
  descricao: z.string().max(5000).optional(),
  video_url: z.string().url().optional(),
  imagem_url: z.string().url().optional(),
});

const exercicioUpdateSchema = exercicioSchema.partial();

function canManageExercises(user: { tipo_usuario: string }) {
  return user.tipo_usuario === "treinador" || user.tipo_usuario === "admin";
}

function parseCsv(content: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") {
        i++;
      }
      if (current.length > 0 || row.length > 0) {
        row.push(current.trim());
        rows.push(row);
      }
      current = "";
      row = [];
      continue;
    }

    current += ch;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());

  return rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (cells[idx] ?? "").trim();
    });
    return rec;
  });
}

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

  // ── POST /exercicios — criar exercício ───────────────────
  app.post("/", { preHandler: app.authenticate }, async (req, reply) => {
    if (!canManageExercises(req.user)) {
      return reply
        .code(403)
        .send({ error: "Forbidden", message: "Sem permissão" });
    }

    const body = exercicioSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const payload = {
      ...body.data,
      tags: body.data.tags ?? [],
    };

    const { data, error } = await supabaseAdmin
      .from("exercicios")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return reply.code(500).send({ error: "DBError", message: error.message });
    }

    return reply.code(201).send({ data });
  });

  // ── PUT /exercicios/:id — atualizar exercício ───────────
  app.put("/:id", { preHandler: app.authenticate }, async (req, reply) => {
    if (!canManageExercises(req.user)) {
      return reply
        .code(403)
        .send({ error: "Forbidden", message: "Sem permissão" });
    }

    const { id } = req.params as { id: string };
    const body = exercicioUpdateSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const { data, error } = await supabaseAdmin
      .from("exercicios")
      .update(body.data)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return reply.code(500).send({ error: "DBError", message: error.message });
    }

    return reply.send({ data });
  });

  // ── DELETE /exercicios/:id ───────────────────────────────
  app.delete("/:id", { preHandler: app.authenticate }, async (req, reply) => {
    if (!canManageExercises(req.user)) {
      return reply
        .code(403)
        .send({ error: "Forbidden", message: "Sem permissão" });
    }

    const { id } = req.params as { id: string };
    const { error } = await supabaseAdmin
      .from("exercicios")
      .delete()
      .eq("id", id);

    if (error) {
      return reply.code(500).send({ error: "DBError", message: error.message });
    }

    return reply.send({ data: { id } });
  });

  // ── POST /exercicios/:id/media?tipo=video|imagem ────────
  app.post(
    "/:id/media",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManageExercises(req.user)) {
        return reply
          .code(403)
          .send({ error: "Forbidden", message: "Sem permissão" });
      }

      const { id } = req.params as { id: string };
      const { tipo = "video" } = req.query as { tipo?: "video" | "imagem" };
      const filePart = await req.file();

      if (!filePart) {
        return reply
          .code(400)
          .send({ error: "Validation", message: "Arquivo obrigatório" });
      }

      const buffer = await filePart.toBuffer();
      const safeName = filePart.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${id}/${Date.now()}-${safeName}`;
      const bucket = "exercicios-media";

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, buffer, {
          contentType: filePart.mimetype,
          upsert: false,
        });

      if (uploadError) {
        return reply
          .code(500)
          .send({ error: "StorageError", message: uploadError.message });
      }

      const { data: publicData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(path);

      const patch =
        tipo === "imagem"
          ? { imagem_url: publicData.publicUrl }
          : { video_url: publicData.publicUrl };

      const { data, error } = await supabaseAdmin
        .from("exercicios")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data });
    },
  );

  // ── POST /exercicios/import-csv — upsert por nome ───────
  app.post(
    "/import-csv",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManageExercises(req.user)) {
        return reply
          .code(403)
          .send({ error: "Forbidden", message: "Sem permissão" });
      }

      let csvContent = "";
      const maybeMultipart = req.isMultipart();

      if (maybeMultipart) {
        const filePart = await req.file();
        if (!filePart) {
          return reply
            .code(400)
            .send({ error: "Validation", message: "Arquivo CSV obrigatório" });
        }
        csvContent = (await filePart.toBuffer()).toString("utf-8");
      } else {
        const body = (req.body ?? {}) as { csv?: string };
        csvContent = body.csv ?? "";
      }

      if (!csvContent.trim()) {
        return reply
          .code(400)
          .send({ error: "Validation", message: "Conteúdo CSV vazio" });
      }

      const rows = parseCsv(csvContent);
      if (rows.length === 0) {
        return reply
          .code(400)
          .send({ error: "Validation", message: "CSV sem linhas válidas" });
      }

      const payload = rows
        .filter((row) => row.nome && row.grupo_muscular)
        .map((row) => ({
          nome: row.nome,
          grupo_muscular: row.grupo_muscular,
          equipamento: row.equipamento || null,
          descricao: row.descricao || null,
          video_url: row.video_url || null,
          imagem_url: row.imagem_url || null,
          tags: row.tags
            ? row.tags
                .split(";")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        }));

      if (payload.length === 0) {
        return reply
          .code(400)
          .send({ error: "Validation", message: "CSV sem registros válidos" });
      }

      const { data, error } = await supabaseAdmin
        .from("exercicios")
        .upsert(payload, { onConflict: "nome_normalizado" })
        .select("id, nome, grupo_muscular");

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({
        data: {
          processados: payload.length,
          exercicios: data ?? [],
        },
      });
    },
  );
}
