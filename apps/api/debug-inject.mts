// Temporary debug script - tests inject headers
import { buildApp } from "./src/app.js";

const app = await buildApp();
await app.ready();

for (const url of ["/", "/health"]) {
  const r = await app.inject({ method: "GET", url });
  console.log(`\n=== ${url} (${r.statusCode}) ===`);
  for (const [k, v] of Object.entries(r.headers)) {
    console.log(`  ${k}: [${typeof v}] ${JSON.stringify(v)}`);
  }
}
process.exit(0);
