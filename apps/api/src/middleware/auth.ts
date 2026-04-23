import type { FastifyRequest, FastifyReply } from "fastify";
import { supabaseAdmin, supabaseAdminAuth } from "../lib/supabase.js";

export interface AuthUser {
  id: string;
  email: string;
  tipo_usuario: "treinador" | "agente" | "admin";
  treinador_id?: string;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: AuthUser;
    jwt: string;
  }
}

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply
      .code(401)
      .send({ error: "Unauthorized", message: "Token não fornecido" });
  }

  const token = authHeader.slice(7);

  // Verify JWT with Supabase
  const { data, error } = await supabaseAdminAuth.getUser(token);
  if (error || !data.user) {
    return reply
      .code(401)
      .send({ error: "Unauthorized", message: "Token inválido ou expirado" });
  }

  // Load profile from DB
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from("perfis")
    .select("id, tipo_usuario, treinador_id")
    .eq("id", data.user.id)
    .single();

  if (perfilError || !perfil) {
    return reply
      .code(401)
      .send({ error: "Unauthorized", message: "Perfil não encontrado" });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? "",
    tipo_usuario: perfil.tipo_usuario,
    treinador_id: perfil.treinador_id,
  };
  req.jwt = token;
}

export function requireRole(...roles: AuthUser["tipo_usuario"][]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(req.user?.tipo_usuario)) {
      return reply
        .code(403)
        .send({ error: "Forbidden", message: "Acesso negado" });
    }
  };
}
