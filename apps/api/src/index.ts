import { buildApp } from "./app.js";

const app = await buildApp();

// ── Start ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "3001", 10);
try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`API running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
