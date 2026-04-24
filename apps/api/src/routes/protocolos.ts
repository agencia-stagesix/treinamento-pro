import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";

const protocoloSchema = z.object({
  plano_alimentar: z
    .array(
      z.object({
        tipo: z.string(),
        horario: z.string(),
        descricao: z.string(),
        calorias_alvo: z.number().optional(),
        proteina_alvo: z.number().optional(),
      }),
    )
    .default([]),
  planilha_treino: z
    .array(
      z.object({
        dia_semana: z.number().int().min(0).max(6),
        nome: z.string(),
        exercicios: z.array(
          z.object({
            nome: z.string(),
            series: z.number().int().positive(),
            repeticoes: z.string(),
            carga: z.string().optional(),
            descanso_seg: z.number().int().optional(),
            video_url: z.string().url().optional(),
            notas: z.string().optional(),
          }),
        ),
      }),
    )
    .default([]),
  suplementos: z
    .array(
      z.object({
        nome: z.string(),
        dose: z.string(),
        horario_relativo: z.string(),
      }),
    )
    .default([]),
  metas: z
    .object({
      peso_alvo: z.number().optional(),
      gordura_alvo: z.number().optional(),
      prazo: z.string().optional(),
    })
    .default({}),
});

const templateSchema = z.object({
  nome: z.string().min(2).max(255),
  descricao: z.string().max(5000).optional(),
  ativo: z.boolean().default(true),
  exercicios: z
    .array(
      z.object({
        exercicio_id: z.string().uuid(),
        ordem: z.number().int().positive(),
        repeticoes: z.number().int().positive(),
        descanso_seg: z.number().int().min(0).default(60),
        observacoes: z.string().optional(),
      }),
    )
    .min(1),
});

const templateUpdateSchema = templateSchema.partial();

const vinculoSchema = z.object({
  serie_template_id: z.string().uuid(),
  inicio_em: z.string().date().optional(),
  validade_em: z.string().date(),
  status: z
    .enum(["ativo", "pausado", "concluido", "expirado"])
    .default("ativo"),
  overrides: z
    .array(
      z.object({
        serie_template_exercicio_id: z.string().uuid(),
        repeticoes_override: z.number().int().positive().optional(),
        descanso_seg_override: z.number().int().min(0).optional(),
      }),
    )
    .default([]),
});

const vinculoUpdateSchema = vinculoSchema.partial();

const startExecucaoSchema = z.object({
  aluno_serie_vinculo_id: z.string().uuid(),
});

const itemExecucaoSchema = z.object({
  repeticoes_realizadas: z.number().int().nonnegative().optional(),
  descanso_real_seg: z.number().int().nonnegative().optional(),
  carga_kg: z.number().nonnegative().optional(),
  esforco_percebido: z.number().int().min(6).max(10).optional(),
  pulado: z.boolean().optional(),
  observacoes: z.string().max(1000).optional(),
  concluido: z.boolean().default(true),
});

async function assertTrainerOwnsAluno(
  trainerId: string,
  agenteId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("perfis")
    .select("id")
    .eq("id", agenteId)
    .eq("treinador_id", trainerId)
    .single();
  return Boolean(data);
}

function canManage(reqUser: { tipo_usuario: string }) {
  return (
    reqUser.tipo_usuario === "treinador" || reqUser.tipo_usuario === "admin"
  );
}

export async function protocolosRoutes(app: FastifyInstance) {
  // ── GET /protocolos/meu — aluno vê seu protocolo ─────────
  app.get("/meu", { preHandler: app.authenticate }, async (req, reply) => {
    const { data, error } = await supabaseAdmin
      .from("protocolos")
      .select("*")
      .eq("agente_id", req.user.id)
      .eq("ativo", true)
      .order("versao", { ascending: false })
      .maybeSingle();

    if (error)
      return reply.code(500).send({ error: "DBError", message: error.message });
    return reply.send({ data });
  });

  // ── PUT /protocolos/:agente_id — treinador atualiza ──────
  app.put(
    "/:agente_id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (
        req.user.tipo_usuario !== "treinador" &&
        req.user.tipo_usuario !== "admin"
      ) {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Apenas treinadores podem editar protocolos",
        });
      }

      const { agente_id } = req.params as { agente_id: string };
      const body = protocoloSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      // Verify this agente belongs to this treinador
      const { data: agente } = await supabaseAdmin
        .from("perfis")
        .select("treinador_id")
        .eq("id", agente_id)
        .single();

      if (agente?.treinador_id !== req.user.id) {
        return reply
          .code(403)
          .send({ error: "Forbidden", message: "Este aluno não é seu" });
      }

      // Upsert protocol, increment version
      const { data: existing } = await supabaseAdmin
        .from("protocolos")
        .select("id, versao")
        .eq("agente_id", agente_id)
        .eq("ativo", true)
        .maybeSingle();

      const payload = {
        agente_id,
        treinador_id: req.user.id,
        ...body.data,
        versao: (existing?.versao ?? 0) + 1,
        ativo: true,
      };

      let data, error;
      if (existing) {
        ({ data, error } = await supabaseAdmin
          .from("protocolos")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabaseAdmin
          .from("protocolos")
          .insert(payload)
          .select()
          .single());
      }

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });

      // Generate suplementacao_log entries for next 7 days based on suplementos list
      if (body.data.suplementos && body.data.suplementos.length > 0) {
        const today = new Date();
        const entries = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          for (const sup of body.data.suplementos) {
            entries.push({
              agente_id,
              suplemento: `${sup.nome} — ${sup.dose}`,
              horario_alvo: null,
              data_log: dateStr,
            });
          }
        }
        // Only insert if not already exists for this period
        await supabaseAdmin
          .from("suplementacao_log")
          .upsert(entries, { ignoreDuplicates: true });
      }

      return reply.send({ data });
    },
  );

  // ── GET /protocolos/:agente_id — treinador lê protocolo ──
  app.get(
    "/:agente_id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { agente_id } = req.params as { agente_id: string };

      if (req.user.tipo_usuario === "agente" && req.user.id !== agente_id) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("protocolos")
        .select("*")
        .eq("agente_id", agente_id)
        .eq("ativo", true)
        .maybeSingle();

      if (error)
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      return reply.send({ data });
    },
  );

  // ── TREINAMENTO: templates (CRUD) ───────────────────────
  app.get(
    "/treinamento/templates",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("series_templates")
        .select(
          "*, exercicios:series_template_exercicios(*, exercicio:exercicios(*))",
        )
        .eq("treinador_id", req.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data });
    },
  );

  app.post(
    "/treinamento/templates",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const body = templateSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { exercicios, ...templateBody } = body.data;
      const { data: template, error } = await supabaseAdmin
        .from("series_templates")
        .insert({ ...templateBody, treinador_id: req.user.id })
        .select("*")
        .single();

      if (error || !template) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error?.message });
      }

      const items = exercicios.map((e) => ({
        ...e,
        serie_template_id: template.id,
      }));
      const { error: itemsError } = await supabaseAdmin
        .from("series_template_exercicios")
        .insert(items);

      if (itemsError) {
        return reply
          .code(500)
          .send({ error: "DBError", message: itemsError.message });
      }

      const { data: full } = await supabaseAdmin
        .from("series_templates")
        .select(
          "*, exercicios:series_template_exercicios(*, exercicio:exercicios(*))",
        )
        .eq("id", template.id)
        .single();

      return reply.code(201).send({ data: full });
    },
  );

  app.get(
    "/treinamento/templates/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const { data, error } = await supabaseAdmin
        .from("series_templates")
        .select(
          "*, exercicios:series_template_exercicios(*, exercicio:exercicios(*))",
        )
        .eq("id", id)
        .eq("treinador_id", req.user.id)
        .single();

      if (error) {
        return reply
          .code(404)
          .send({ error: "NotFound", message: "Template não encontrado" });
      }

      return reply.send({ data });
    },
  );

  app.put(
    "/treinamento/templates/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const body = templateUpdateSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { exercicios, ...templatePatch } = body.data;
      if (Object.keys(templatePatch).length > 0) {
        const { error } = await supabaseAdmin
          .from("series_templates")
          .update(templatePatch)
          .eq("id", id)
          .eq("treinador_id", req.user.id);
        if (error) {
          return reply
            .code(500)
            .send({ error: "DBError", message: error.message });
        }
      }

      if (exercicios) {
        await supabaseAdmin
          .from("series_template_exercicios")
          .delete()
          .eq("serie_template_id", id);
        if (exercicios.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from("series_template_exercicios")
            .insert(exercicios.map((e) => ({ ...e, serie_template_id: id })));
          if (insertError) {
            return reply
              .code(500)
              .send({ error: "DBError", message: insertError.message });
          }
        }
      }

      const { data: full } = await supabaseAdmin
        .from("series_templates")
        .select(
          "*, exercicios:series_template_exercicios(*, exercicio:exercicios(*))",
        )
        .eq("id", id)
        .eq("treinador_id", req.user.id)
        .single();

      return reply.send({ data: full });
    },
  );

  app.delete(
    "/treinamento/templates/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const { error } = await supabaseAdmin
        .from("series_templates")
        .delete()
        .eq("id", id)
        .eq("treinador_id", req.user.id);

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data: { id } });
    },
  );

  // ── TREINAMENTO: vínculo série-aluno ─────────────────────
  app.get(
    "/treinamento/alunos/:agente_id/vinculos",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { agente_id } = req.params as { agente_id: string };
      if (req.user.tipo_usuario === "agente" && req.user.id !== agente_id) {
        return reply.code(403).send({ error: "Forbidden" });
      }
      if (canManage(req.user)) {
        const owns = await assertTrainerOwnsAluno(req.user.id, agente_id);
        if (!owns && req.user.tipo_usuario !== "admin") {
          return reply
            .code(403)
            .send({
              error: "Forbidden",
              message: "Aluno não pertence ao treinador",
            });
        }
      }

      const { data, error } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .select(
          "*, template:series_templates(*), overrides:aluno_series_vinculo_exercicios(*, template_exercicio:series_template_exercicios(*, exercicio:exercicios(*)))",
        )
        .eq("agente_id", agente_id)
        .order("created_at", { ascending: false });

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data });
    },
  );

  app.post(
    "/treinamento/alunos/:agente_id/vinculos",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { agente_id } = req.params as { agente_id: string };
      const owns = await assertTrainerOwnsAluno(req.user.id, agente_id);
      if (!owns && req.user.tipo_usuario !== "admin") {
        return reply
          .code(403)
          .send({
            error: "Forbidden",
            message: "Aluno não pertence ao treinador",
          });
      }

      const body = vinculoSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { overrides, ...payload } = body.data;
      const { data: vinculo, error } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .insert({
          ...payload,
          inicio_em: payload.inicio_em ?? new Date().toISOString().slice(0, 10),
          agente_id,
          treinador_id: req.user.id,
        })
        .select("*")
        .single();

      if (error || !vinculo) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error?.message });
      }

      if (overrides.length > 0) {
        const { error: overrideError } = await supabaseAdmin
          .from("aluno_series_vinculo_exercicios")
          .insert(
            overrides.map((o) => ({
              ...o,
              aluno_serie_vinculo_id: vinculo.id,
            })),
          );
        if (overrideError) {
          return reply
            .code(500)
            .send({ error: "DBError", message: overrideError.message });
        }
      }

      const { data: full } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .select(
          "*, template:series_templates(*), overrides:aluno_series_vinculo_exercicios(*, template_exercicio:series_template_exercicios(*, exercicio:exercicios(*)))",
        )
        .eq("id", vinculo.id)
        .single();

      return reply.code(201).send({ data: full });
    },
  );

  app.put(
    "/treinamento/vinculos/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const body = vinculoUpdateSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { overrides, ...patch } = body.data;

      if (Object.keys(patch).length > 0) {
        const { error } = await supabaseAdmin
          .from("aluno_series_vinculos")
          .update(patch)
          .eq("id", id)
          .eq("treinador_id", req.user.id);
        if (error) {
          return reply
            .code(500)
            .send({ error: "DBError", message: error.message });
        }
      }

      if (overrides) {
        await supabaseAdmin
          .from("aluno_series_vinculo_exercicios")
          .delete()
          .eq("aluno_serie_vinculo_id", id);

        if (overrides.length > 0) {
          const { error: ovError } = await supabaseAdmin
            .from("aluno_series_vinculo_exercicios")
            .insert(
              overrides.map((o) => ({ ...o, aluno_serie_vinculo_id: id })),
            );
          if (ovError) {
            return reply
              .code(500)
              .send({ error: "DBError", message: ovError.message });
          }
        }
      }

      const { data } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .select(
          "*, template:series_templates(*), overrides:aluno_series_vinculo_exercicios(*, template_exercicio:series_template_exercicios(*, exercicio:exercicios(*)))",
        )
        .eq("id", id)
        .single();

      return reply.send({ data });
    },
  );

  app.delete(
    "/treinamento/vinculos/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const { error } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .delete()
        .eq("id", id)
        .eq("treinador_id", req.user.id);

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data: { id } });
    },
  );

  app.get(
    "/treinamento/me/ativos",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { data, error } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .select(
          "*, template:series_templates(*), template_exercicios:series_template_exercicios(*, exercicio:exercicios(*)), overrides:aluno_series_vinculo_exercicios(*)",
        )
        .eq("agente_id", req.user.id)
        .eq("status", "ativo")
        .gte("validade_em", new Date().toISOString().slice(0, 10))
        .order("validade_em", { ascending: true });

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data });
    },
  );

  // ── TREINAMENTO: execução guiada do aluno ────────────────
  app.post(
    "/treinamento/execucoes/start",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const body = startExecucaoSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { aluno_serie_vinculo_id } = body.data;
      const { data: vinculo, error: vinculoError } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .select("*")
        .eq("id", aluno_serie_vinculo_id)
        .single();

      if (vinculoError || !vinculo) {
        return reply
          .code(404)
          .send({ error: "NotFound", message: "Vínculo não encontrado" });
      }

      if (
        req.user.tipo_usuario === "agente" &&
        vinculo.agente_id !== req.user.id
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      if (vinculo.status !== "ativo") {
        return reply
          .code(400)
          .send({ error: "Validation", message: "Vínculo não está ativo" });
      }

      const [{ data: templateItems }, { data: overrides }] = await Promise.all([
        supabaseAdmin
          .from("series_template_exercicios")
          .select("*, exercicio:exercicios(*)")
          .eq("serie_template_id", vinculo.serie_template_id)
          .order("ordem", { ascending: true }),
        supabaseAdmin
          .from("aluno_series_vinculo_exercicios")
          .select("*")
          .eq("aluno_serie_vinculo_id", vinculo.id),
      ]);

      const overrideMap = new Map<
        string,
        {
          repeticoes_override: number | null;
          descanso_seg_override: number | null;
        }
      >();
      for (const ov of (overrides ?? []) as Array<{
        serie_template_exercicio_id: string;
        repeticoes_override: number | null;
        descanso_seg_override: number | null;
      }>) {
        overrideMap.set(ov.serie_template_exercicio_id, {
          repeticoes_override: ov.repeticoes_override,
          descanso_seg_override: ov.descanso_seg_override,
        });
      }

      const { data: execucao, error: execucaoError } = await supabaseAdmin
        .from("treino_execucoes")
        .insert({
          aluno_serie_vinculo_id: vinculo.id,
          agente_id: vinculo.agente_id,
          treinador_id: vinculo.treinador_id,
        })
        .select("*")
        .single();

      if (execucaoError || !execucao) {
        return reply
          .code(500)
          .send({ error: "DBError", message: execucaoError?.message });
      }

      const itemsPayload = (templateItems ?? []).map((item: any) => {
        const ov = overrideMap.get(item.id);
        return {
          treino_execucao_id: execucao.id,
          serie_template_exercicio_id: item.id,
          exercicio_id: item.exercicio_id,
          ordem: item.ordem,
          repeticoes_planejadas: ov?.repeticoes_override ?? item.repeticoes,
          descanso_planejado_seg:
            ov?.descanso_seg_override ?? item.descanso_seg,
        };
      });

      const { data: itens, error: itensError } = await supabaseAdmin
        .from("treino_execucao_itens")
        .insert(itemsPayload)
        .select("*, exercicio:exercicios(*)");

      if (itensError) {
        return reply
          .code(500)
          .send({ error: "DBError", message: itensError.message });
      }

      return reply.code(201).send({ data: { execucao, itens } });
    },
  );

  app.put(
    "/treinamento/execucoes/:execucao_id/itens/:item_id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { execucao_id, item_id } = req.params as {
        execucao_id: string;
        item_id: string;
      };

      const body = itemExecucaoSchema.safeParse(req.body);
      if (!body.success) {
        return reply
          .code(400)
          .send({ error: "Validation", message: body.error.message });
      }

      const { data: execucao } = await supabaseAdmin
        .from("treino_execucoes")
        .select("*")
        .eq("id", execucao_id)
        .single();

      if (!execucao) {
        return reply
          .code(404)
          .send({ error: "NotFound", message: "Execução não encontrada" });
      }

      if (
        req.user.tipo_usuario === "agente" &&
        execucao.agente_id !== req.user.id
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const patch = {
        repeticoes_realizadas: body.data.repeticoes_realizadas,
        descanso_real_seg: body.data.descanso_real_seg,
        carga_kg: body.data.carga_kg,
        esforco_percebido: body.data.esforco_percebido,
        pulado: body.data.pulado,
        observacoes: body.data.observacoes,
        concluido_em: body.data.concluido ? new Date().toISOString() : null,
      };

      const { data, error } = await supabaseAdmin
        .from("treino_execucao_itens")
        .update(patch)
        .eq("id", item_id)
        .eq("treino_execucao_id", execucao_id)
        .select("*, exercicio:exercicios(*)")
        .single();

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data });
    },
  );

  app.post(
    "/treinamento/execucoes/:execucao_id/finalizar",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { execucao_id } = req.params as { execucao_id: string };

      const { data: execucao } = await supabaseAdmin
        .from("treino_execucoes")
        .select("*")
        .eq("id", execucao_id)
        .single();

      if (!execucao) {
        return reply
          .code(404)
          .send({ error: "NotFound", message: "Execução não encontrada" });
      }
      if (
        req.user.tipo_usuario === "agente" &&
        execucao.agente_id !== req.user.id
      ) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { data, error } = await supabaseAdmin
        .from("treino_execucoes")
        .update({
          status: "concluida",
          finalizado_em: new Date().toISOString(),
        })
        .eq("id", execucao_id)
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

  app.get(
    "/treinamento/aluno/:agente_id/resultados",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { agente_id } = req.params as { agente_id: string };
      if (!canManage(req.user) && req.user.id !== agente_id) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      if (canManage(req.user)) {
        const owns = await assertTrainerOwnsAluno(req.user.id, agente_id);
        if (!owns && req.user.tipo_usuario !== "admin") {
          return reply.code(403).send({ error: "Forbidden" });
        }
      }

      const { data: execucoes, error } = await supabaseAdmin
        .from("treino_execucoes")
        .select(
          "*, vinculo:aluno_series_vinculos(*), itens:treino_execucao_itens(*, exercicio:exercicios(*))",
        )
        .eq("agente_id", agente_id)
        .order("iniciado_em", { ascending: false })
        .limit(20);

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      return reply.send({ data: execucoes ?? [] });
    },
  );

  app.get(
    "/treinamento/alertas-vencimento",
    { preHandler: app.authenticate },
    async (req, reply) => {
      if (!canManage(req.user)) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const d3 = new Date(today);
      d3.setDate(today.getDate() + 3);
      const d3Str = d3.toISOString().slice(0, 10);

      const { data, error } = await supabaseAdmin
        .from("aluno_series_vinculos")
        .select(
          "id, validade_em, agente:perfis!agente_id(id, nome), template:series_templates(nome)",
        )
        .eq("treinador_id", req.user.id)
        .eq("status", "ativo")
        .in("validade_em", [todayStr, d3Str]);

      if (error) {
        return reply
          .code(500)
          .send({ error: "DBError", message: error.message });
      }

      const alertas = (data ?? []).map((item: any) => {
        const dias =
          Math.floor(
            (new Date(item.validade_em).getTime() -
              new Date(todayStr).getTime()) /
              86400000,
          ) || 0;
        return {
          id: item.id,
          tipo_alerta:
            dias === 0
              ? "vencimento_treinamento_d0"
              : "vencimento_treinamento_d3",
          severidade: dias === 0 ? "critical" : "warning",
          dias_para_vencer: dias,
          validade_em: item.validade_em,
          agente: item.agente,
          template: item.template,
          descricao:
            dias === 0
              ? `Treinamento vence hoje (${item.template?.nome ?? "série"})`
              : `Treinamento vence em 3 dias (${item.template?.nome ?? "série"})`,
        };
      });

      return reply.send({ data: alertas });
    },
  );
}
