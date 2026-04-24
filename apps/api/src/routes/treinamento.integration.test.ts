import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, any>;

function createDb() {
  const db: Record<string, Row[]> = {
    perfis: [
      {
        id: "trainer-1",
        treinador_id: null,
        tipo_usuario: "treinador",
        nome: "Trainer",
      },
      {
        id: "agent-1",
        treinador_id: "trainer-1",
        tipo_usuario: "agente",
        nome: "Aluno",
      },
    ],
    exercicios: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        nome: "Supino Reto",
        nome_normalizado: "supino reto",
        grupo_muscular: "Peito",
        equipamento: "Barra",
        tags: ["peito"],
      },
    ],
    series_templates: [],
    series_template_exercicios: [],
    aluno_series_vinculos: [],
    aluno_series_vinculo_exercicios: [],
    treino_execucoes: [],
    treino_execucao_itens: [],
    alertas_treinador: [],
  };

  let seq = 100;
  const nextId = () => {
    const n = String(seq++).padStart(12, "0");
    return `00000000-0000-4000-8000-${n}`;
  };

  class Builder {
    table: string;
    filters: Array<(row: Row) => boolean> = [];
    op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
    payload: any = null;
    singleMode = false;
    maybeSingleMode = false;
    selected = "*";

    constructor(table: string) {
      this.table = table;
    }

    select(cols = "*") {
      this.selected = cols;
      return this;
    }

    insert(payload: any) {
      this.op = "insert";
      this.payload = payload;
      return this;
    }

    update(payload: any) {
      this.op = "update";
      this.payload = payload;
      return this;
    }

    delete() {
      this.op = "delete";
      return this;
    }

    upsert(payload: any) {
      this.op = "upsert";
      this.payload = payload;
      return this;
    }

    eq(column: string, value: any) {
      this.filters.push((row) => row[column] === value);
      return this;
    }

    in(column: string, values: any[]) {
      this.filters.push((row) => values.includes(row[column]));
      return this;
    }

    gte(column: string, value: any) {
      this.filters.push((row) => row[column] >= value);
      return this;
    }

    ilike(column: string, value: string) {
      const q = value.replace(/%/g, "").toLowerCase();
      this.filters.push((row) =>
        String(row[column] ?? "")
          .toLowerCase()
          .includes(q),
      );
      return this;
    }

    or() {
      return this;
    }

    order() {
      return this;
    }

    limit() {
      return this;
    }

    range() {
      return this;
    }

    single() {
      this.singleMode = true;
      return this.execute();
    }

    maybeSingle() {
      this.maybeSingleMode = true;
      return this.execute();
    }

    then(resolve: any, reject: any) {
      return this.execute().then(resolve, reject);
    }

    private execute(): Promise<{ data: any; error: any }> {
      const rows = (db[this.table] ?? []).filter((row) =>
        this.filters.every((f) => f(row)),
      );

      if (this.op === "insert") {
        const items = Array.isArray(this.payload)
          ? this.payload
          : [this.payload];
        const inserted = items.map((i) => {
          const row = { ...i };
          if (!row.id) row.id = nextId();
          if (row.nome) row.nome_normalizado = String(row.nome).toLowerCase();
          db[this.table].push(row);
          return row;
        });
        return Promise.resolve({
          data: this.singleMode ? inserted[0] : inserted,
          error: null,
        });
      }

      if (this.op === "update") {
        const out = rows.map((row) => {
          Object.assign(row, this.payload);
          if (row.nome) row.nome_normalizado = String(row.nome).toLowerCase();
          return row;
        });
        return Promise.resolve({
          data: this.singleMode ? (out[0] ?? null) : out,
          error: null,
        });
      }

      if (this.op === "delete") {
        const ids = new Set(rows.map((r) => r.id));
        db[this.table] = (db[this.table] ?? []).filter((r) => !ids.has(r.id));
        return Promise.resolve({ data: null, error: null });
      }

      if (this.op === "upsert") {
        const items = Array.isArray(this.payload)
          ? this.payload
          : [this.payload];
        const out: Row[] = [];
        for (const item of items) {
          const key = String(item.nome).toLowerCase();
          const existing = db.exercicios.find(
            (e) => e.nome_normalizado === key,
          );
          if (existing) {
            Object.assign(existing, item, { nome_normalizado: key });
            out.push(existing);
          } else {
            const row = { ...item, id: nextId(), nome_normalizado: key };
            db.exercicios.push(row);
            out.push(row);
          }
        }
        return Promise.resolve({ data: out, error: null });
      }

      let out: any = rows;

      if (
        this.table === "series_templates" &&
        this.selected.includes("exercicios:")
      ) {
        out = rows.map((t) => ({
          ...t,
          exercicios: db.series_template_exercicios
            .filter((x) => x.serie_template_id === t.id)
            .map((x) => ({
              ...x,
              exercicio:
                db.exercicios.find((e) => e.id === x.exercicio_id) ?? null,
            })),
        }));
      }

      if (
        this.table === "aluno_series_vinculos" &&
        this.selected.includes("template:")
      ) {
        out = rows.map((v) => ({
          ...v,
          template:
            db.series_templates.find((t) => t.id === v.serie_template_id) ??
            null,
          template_exercicios: db.series_template_exercicios.filter(
            (x) => x.serie_template_id === v.serie_template_id,
          ),
          overrides: db.aluno_series_vinculo_exercicios.filter(
            (x) => x.aluno_serie_vinculo_id === v.id,
          ),
        }));
      }

      if (
        this.table === "treino_execucoes" &&
        this.selected.includes("itens:")
      ) {
        out = rows.map((e) => ({
          ...e,
          vinculo:
            db.aluno_series_vinculos.find(
              (v) => v.id === e.aluno_serie_vinculo_id,
            ) ?? null,
          itens: db.treino_execucao_itens
            .filter((x) => x.treino_execucao_id === e.id)
            .map((x) => ({
              ...x,
              exercicio:
                db.exercicios.find((ex) => ex.id === x.exercicio_id) ?? null,
            })),
        }));
      }

      if (this.singleMode || this.maybeSingleMode) {
        return Promise.resolve({ data: out[0] ?? null, error: null });
      }

      return Promise.resolve({ data: out, error: null });
    }
  }

  return {
    supabaseAdmin: {
      from(table: string) {
        return new Builder(table);
      },
      storage: {
        from() {
          return {
            upload: async () => ({ data: { path: "ok" }, error: null }),
            getPublicUrl: () => ({
              data: { publicUrl: "https://cdn.test/media.mp4" },
            }),
          };
        },
      },
    },
  };
}

const mock = vi.hoisted(() => createDb());

vi.mock("../lib/supabase.js", () => ({
  supabaseAdmin: mock.supabaseAdmin,
}));

import { exerciciosRoutes } from "./exercicios.js";
import { protocolosRoutes } from "./protocolos.js";

describe("Treinamento integration", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(multipart);
    app.decorate("authenticate", async (req: any) => {
      req.user = {
        id: (req.headers["x-user-id"] as string) ?? "trainer-1",
        tipo_usuario: (req.headers["x-user-role"] as string) ?? "treinador",
      };
      req.jwt = "token";
    });

    await app.register(exerciciosRoutes, { prefix: "/exercicios" });
    await app.register(protocolosRoutes, { prefix: "/protocolos" });
  });

  afterEach(async () => {
    await app.close();
  });

  it("CRUD de exercicios + CSV", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/exercicios",
      headers: { "x-user-role": "treinador" },
      payload: { nome: "Remada", grupo_muscular: "Costas", tags: ["costas"] },
    });
    expect(created.statusCode).toBe(201);
    const createdBody = created.json();

    const id = createdBody.data.id;

    const listed = await app.inject({
      method: "GET",
      url: "/exercicios?q=Remada",
    });
    expect(listed.statusCode).toBe(200);

    const updated = await app.inject({
      method: "PUT",
      url: `/exercicios/${id}`,
      headers: { "x-user-role": "treinador" },
      payload: { equipamento: "Halter" },
    });
    expect(updated.statusCode).toBe(200);

    const imported = await app.inject({
      method: "POST",
      url: "/exercicios/import-csv",
      headers: { "x-user-role": "treinador" },
      payload: { csv: "nome,grupo_muscular,tags\nAgachamento,Pernas,pernas" },
    });
    expect(imported.statusCode).toBe(200);
    expect(imported.json().data.processados).toBe(1);

    const removed = await app.inject({
      method: "DELETE",
      url: `/exercicios/${id}`,
      headers: { "x-user-role": "treinador" },
    });
    expect(removed.statusCode).toBe(200);
  });

  it("fluxo de template, vinculo, execucao e resultados", async () => {
    const tpl = await app.inject({
      method: "POST",
      url: "/protocolos/treinamento/templates",
      headers: { "x-user-role": "treinador", "x-user-id": "trainer-1" },
      payload: {
        nome: "Template A",
        exercicios: [
          {
            exercicio_id: "11111111-1111-4111-8111-111111111111",
            ordem: 1,
            repeticoes: 10,
            descanso_seg: 45,
          },
        ],
      },
    });
    expect(tpl.statusCode).toBe(201);
    const tplBody = tpl.json();

    const templateId = tplBody.data.id;
    const templateExId = tplBody.data.exercicios[0].id;

    const vinc = await app.inject({
      method: "POST",
      url: "/protocolos/treinamento/alunos/agent-1/vinculos",
      headers: { "x-user-role": "treinador", "x-user-id": "trainer-1" },
      payload: {
        serie_template_id: templateId,
        validade_em: "2099-12-31",
        overrides: [
          {
            serie_template_exercicio_id: templateExId,
            repeticoes_override: 12,
            descanso_seg_override: 60,
          },
        ],
      },
    });
    expect(vinc.statusCode).toBe(201);
    const vincBody = vinc.json();

    const start = await app.inject({
      method: "POST",
      url: "/protocolos/treinamento/execucoes/start",
      headers: { "x-user-role": "agente", "x-user-id": "agent-1" },
      payload: { aluno_serie_vinculo_id: vincBody.data.id },
    });
    expect(start.statusCode).toBe(201);
    const startBody = start.json();

    const execucaoId = startBody.data.execucao.id;
    const itemId = startBody.data.itens[0].id;

    const item = await app.inject({
      method: "PUT",
      url: `/protocolos/treinamento/execucoes/${execucaoId}/itens/${itemId}`,
      headers: { "x-user-role": "agente", "x-user-id": "agent-1" },
      payload: {
        repeticoes_realizadas: 12,
        carga_kg: 30,
        esforco_percebido: 8,
        concluido: true,
      },
    });
    expect(item.statusCode).toBe(200);

    const fim = await app.inject({
      method: "POST",
      url: `/protocolos/treinamento/execucoes/${execucaoId}/finalizar`,
      headers: { "x-user-role": "agente", "x-user-id": "agent-1" },
      payload: {},
    });
    expect(fim.statusCode).toBe(200);

    const resultados = await app.inject({
      method: "GET",
      url: "/protocolos/treinamento/aluno/agent-1/resultados",
      headers: { "x-user-role": "treinador", "x-user-id": "trainer-1" },
    });
    expect(resultados.statusCode).toBe(200);
    expect(resultados.json().data.length).toBeGreaterThan(0);

    const alertas = await app.inject({
      method: "GET",
      url: "/protocolos/treinamento/alertas-vencimento",
      headers: { "x-user-role": "treinador", "x-user-id": "trainer-1" },
    });
    expect(alertas.statusCode).toBe(200);
  });
});
