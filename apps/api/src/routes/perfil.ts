import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { randomBytes } from "crypto";

const updateSchema = z.object({
  nome: z.string().min(2).max(255).optional(),
  foto_url: z.string().url().optional(),
  data_nascimento: z.string().optional(),
  peso_alvo: z.number().positive().optional(),
  gordura_alvo: z.number().min(1).max(60).optional(),
});

const associarSchema = z.object({
  codigo: z.string().min(1),
});

export async function perfilRoutes(app: FastifyInstance) {
  // ── GET /perfil/me ───────────────────────────────────────
  app.get("/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { data, error } = await supabaseAdmin
      .from("perfis")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── PATCH /perfil/me ─────────────────────────────────────
  app.patch("/me", { preHandler: app.authenticate }, async (req, reply) => {
    const body = updateSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const { data, error } = await supabaseAdmin
      .from("perfis")
      .update(body.data)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── POST /perfil/associar — aluno se associa ao treinador via código
  app.post(
    "/associar",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (req.user.tipo_usuario !== "agente") {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Apenas agentes podem se associar",
        });
      }

      const body = associarSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { data: convite, error: conviteError } = await supabaseAdmin
        .from("convites")
        .select("*")
        .eq("codigo", body.data.codigo)
        .eq("usado", false)
        .single();

      if (conviteError || !convite) {
        return reply
          .code(404)
          .send({ error: "NotFound", message: "Código inválido ou expirado" });
      }

      if (new Date(convite.expires_at) < new Date()) {
        return reply
          .code(400)
          .send({ error: "Expired", message: "Código de convite expirado" });
      }

      await Promise.all([
        supabaseAdmin
          .from("perfis")
          .update({ treinador_id: convite.treinador_id })
          .eq("id", req.user.id),
        supabaseAdmin
          .from("convites")
          .update({ usado: true, agente_id: req.user.id })
          .eq("id", convite.id),
      ]);

      const { data: treinador } = await supabaseAdmin
        .from("perfis")
        .select("id, nome, foto_url")
        .eq("id", convite.treinador_id)
        .single();

      return reply.send({
        data: { message: "Associado com sucesso", treinador },
      });
    },
  );

  // ── POST /perfil/gerar-convite — treinador gera código ───
  app.post(
    "/gerar-convite",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (
        req.user.tipo_usuario !== "treinador" &&
        req.user.tipo_usuario !== "admin"
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const codigo = randomBytes(6).toString("hex").toUpperCase();

      const { data, error } = await supabaseAdmin
        .from("convites")
        .insert({ treinador_id: req.user.id, codigo })
        .select()
        .single();

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.code(201).send({ data });
    },
  );

  // ── GET /perfil/meus-alunos — treinador lista alunos ─────
  app.get(
    "/meus-alunos",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (
        req.user.tipo_usuario !== "treinador" &&
        req.user.tipo_usuario !== "admin"
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("perfis")
        .select("id, nome, email, foto_url, data_criacao")
        .eq("treinador_id", req.user.id)
        .eq("tipo_usuario", "agente")
        .order("nome");

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );

  // ── GET /perfil/meus-convites — treinador lista seus convites ─
  app.get(
    "/meus-convites",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (
        req.user.tipo_usuario !== "treinador" &&
        req.user.tipo_usuario !== "admin"
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("convites")
        .select("*")
        .eq("treinador_id", req.user.id)
        .order("criado_em", { ascending: false });

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );
}
