import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const PROJECT_REF = "ugcinnhweliqgadwgcuz";
const ACCESS_TOKEN = "sbp_235818fd77c414a0cc6679f6d6896ade0f5ab996";
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function runSQL(sql) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return text;
}

const migrations = [
  join(root, "supabase/migrations/001_schema.sql"),
  join(root, "supabase/migrations/002_rls.sql"),
  join(root, "supabase/seed/001_exercicios.sql"),
];

async function run() {
  // Test connection first
  await runSQL("SELECT 1");
  console.log("Conectado ao Supabase via Management API.\n");

  for (const file of migrations) {
    const name = file.split("\\").pop() ?? file.split("/").pop();
    console.log(`Executando: ${name} ...`);
    const sql = readFileSync(file, "utf8");
    try {
      await runSQL(sql);
      console.log(`  OK ${name}\n`);
    } catch (err) {
      console.error(`  ERRO em ${name}:`, err.message);
      process.exit(1);
    }
  }

  console.log("Todas as migrations aplicadas com sucesso!");
}

run().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
