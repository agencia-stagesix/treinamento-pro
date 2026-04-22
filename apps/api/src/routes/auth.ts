import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const registerSchema = z.object({
  nome: z.string().min(2).max(255),
  email: z.string().email(),
  senha: z.string().min(8),
  tipo_usuario: z.enum(["agente", "treinador"]),
  codigo_convite: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const changePasswordSchema = z.object({
  senha_atual: z.string().min(1),
  nova_senha: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  // ── POST /auth/register ──────────────────────────────────
  app.post("/register", async (req, reply) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }
    const { nome, email, senha, tipo_usuario, codigo_convite } = body.data;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });
    if (authError || !authData.user) {
      return reply
        .code(400)
        .send({
          error: "AuthError",
          message: authError?.message ?? "Erro ao criar usuário",
        });
    }

    // Resolve treinador_id se tiver código de convite
    let treinador_id: string | null = null;
    if (codigo_convite) {
      const { data: convite } = await supabaseAdmin
        .from("convites")
        .select("treinador_id, usado, expires_at")
        .eq("codigo", codigo_convite)
        .single();

      if (
        convite &&
        !convite.usado &&
        new Date(convite.expires_at) > new Date()
      ) {
        treinador_id = convite.treinador_id;
        await supabaseAdmin
          .from("convites")
          .update({ usado: true, agente_id: authData.user.id })
          .eq("codigo", codigo_convite);
      }
    }

    // Create profile
    const { error: perfilError } = await supabaseAdmin.from("perfis").insert({
      id: authData.user.id,
      nome,
      email,
      tipo_usuario,
      treinador_id,
    });

    if (perfilError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return reply
        .code(500)
        .send({ error: "DBError", message: "Erro ao criar perfil" });
    }

    // Sign in to get tokens
    const { data: signIn, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password: senha,
      });
    if (signInError || !signIn.session) {
      return reply
        .code(500)
        .send({
          error: "SignInError",
          message: "Erro ao autenticar após registro",
        });
    }

    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return reply.code(201).send({
      data: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
        user: perfil,
      },
    });
  });

  // ── POST /auth/login ─────────────────────────────────────
  app.post("/login", async (req, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply
        .code(400)
        .send({ error: "Validation", message: body.error.message });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: body.data.email,
      password: body.data.senha,
    });

    if (error || !data.session) {
      return reply
        .code(401)
        .send({ error: "AuthError", message: "Email ou senha incorretos" });
    }

    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return reply.send({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: perfil,
      },
    });
  });

  // ── POST /auth/refresh ───────────────────────────────────
  app.post("/refresh", async (req, reply) => {
    const { refresh_token } = req.body as { refresh_token?: string };
    if (!refresh_token) {
      return reply
        .code(400)
        .send({ error: "Validation", message: "refresh_token obrigatório" });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });
    if (error || !data.session) {
      return reply
        .code(401)
        .send({ error: "AuthError", message: "Refresh token inválido" });
    }

    return reply.send({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  });

  // ── POST /auth/logout ────────────────────────────────────
  app.post("/logout", { preHandler: app.authenticate }, async (req, reply) => {
    await supabaseAdmin.auth.admin.signOut(req.jwt);
    return reply.send({ data: { message: "Sessão encerrada" } });
  });

  // ── POST /auth/change-password ───────────────────────────
  app.post(
    "/change-password",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const body = changePasswordSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      // Verify current password
      const { data: user } = await supabaseAdmin
        .from("perfis")
        .select("email")
        .eq("id", req.user.id)
        .single();
      const { error: verifyError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: user!.email,
          password: body.data.senha_atual,
        });
      if (verifyError) {
        return reply
          .code(401)
          .send({ error: "AuthError", message: "Senha atual incorreta" });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        req.user.id,
        {
          password: body.data.nova_senha,
        },
      );
      if (error) {
        return reply
          .code(500)
          .send({ error: "UpdateError", message: error.message });
      }

      return reply.send({ data: { message: "Senha alterada com sucesso" } });
    },
  );
}
