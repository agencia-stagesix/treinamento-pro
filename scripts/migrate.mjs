import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  "postgresql://postgres:Spessoto00!%23_net@db.ugcinnhweliqgadwgcuz.supabase.co:5432/postgres";

const client = new pg.Client({ connectionString: DATABASE_URL });

const migrations = [
  join(__dirname, "../supabase/migrations/001_schema.sql"),
  join(__dirname, "../supabase/migrations/002_rls.sql"),
  join(__dirname, "../supabase/seed/001_exercicios.sql"),
];

async function run() {
  console.log("Conectando ao banco...");
  await client.connect();
  console.log("Conectado.\n");

  for (const file of migrations) {
    const name = file.split("/").pop() ?? file.split("\\").pop();
    console.log(`Executando: ${name} ...`);
    const sql = readFileSync(file, "utf8");
    try {
      await client.query(sql);
      console.log(`  ✔ ${name}\n`);
    } catch (err) {
      console.error(`  ✘ Erro em ${name}:`, err.message);
      process.exit(1);
    }
  }

  await client.end();
  console.log("Todas as migrations aplicadas com sucesso!");
}

run().catch((err) => {
  console.error("Falha na conexão:", err.message);
  process.exit(1);
});
