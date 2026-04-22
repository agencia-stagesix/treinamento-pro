import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";

import { authRoutes } from "./routes/auth.js";
import { biometriaRoutes } from "./routes/biometria.js";
import { treinosRoutes } from "./routes/treinos.js";
import { hidratacaoRoutes } from "./routes/hidratacao.js";
import { readinessRoutes } from "./routes/readiness.js";
import { refeicoesRoutes } from "./routes/refeicoes.js";
import { suplementacaoRoutes } from "./routes/suplementacao.js";
import { protocolosRoutes } from "./routes/protocolos.js";
import { exerciciosRoutes } from "./routes/exercicios.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { saudeRoutes } from "./routes/saude.js";
import { perfilRoutes } from "./routes/perfil.js";
import { authMiddleware } from "./middleware/auth.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: [
      "http://localhost:3000",
      "https://treinamento-pro-api.vercel.app",
      process.env.FRONTEND_URL ?? "http://localhost:3000",
    ],
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: 500,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.headers.authorization ?? req.ip,
  });

  await app.register(multipart, {
    limits: { fileSize: 100 * 1024 * 1024 },
  });

  app.decorate("authenticate", authMiddleware);

  app.get("/", async () => ({
    message: "API Treinamento Pro",
    version: "1.0.0",
    endpoints: [
      "/v1/auth",
      "/v1/perfil",
      "/v1/biometria",
      "/v1/treinos",
      "/v1/hidratacao",
      "/v1/readiness",
      "/v1/refeicoes",
      "/v1/suplementacao",
      "/v1/protocolos",
      "/v1/exercicios",
      "/v1/dashboard",
      "/v1/saude",
    ],
  }));

  app.get("/health", async () => ({
    status: "ok",
    ts: new Date().toISOString(),
  }));

  const PREFIX = "/v1";
  await app.register(authRoutes, { prefix: `${PREFIX}/auth` });
  await app.register(perfilRoutes, { prefix: `${PREFIX}/perfil` });
  await app.register(biometriaRoutes, { prefix: `${PREFIX}/biometria` });
  await app.register(treinosRoutes, { prefix: `${PREFIX}/treinos` });
  await app.register(hidratacaoRoutes, { prefix: `${PREFIX}/hidratacao` });
  await app.register(readinessRoutes, { prefix: `${PREFIX}/readiness` });
  await app.register(refeicoesRoutes, { prefix: `${PREFIX}/refeicoes` });
  await app.register(suplementacaoRoutes, {
    prefix: `${PREFIX}/suplementacao`,
  });
  await app.register(protocolosRoutes, { prefix: `${PREFIX}/protocolos` });
  await app.register(exerciciosRoutes, { prefix: `${PREFIX}/exercicios` });
  await app.register(dashboardRoutes, { prefix: `${PREFIX}/dashboard` });
  await app.register(saudeRoutes, { prefix: `${PREFIX}/saude` });

  return app;
}
