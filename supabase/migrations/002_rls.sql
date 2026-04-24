-- TREINAMENTO PRO - Row Level Security (RLS)
-- Migration 002

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometria ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_realizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suplementacao_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_treinador ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidratacao_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_template_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_series_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_series_vinculo_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino_execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino_execucao_itens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_user_tipo() RETURNS TEXT AS $$ SELECT tipo_usuario FROM perfis WHERE id = auth.uid() $$ LANGUAGE sql SECURITY DEFINER STABLE;
CREATE OR REPLACE FUNCTION auth_user_treinador_id() RETURNS UUID AS $$ SELECT treinador_id FROM perfis WHERE id = auth.uid() $$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PERFIS
DROP POLICY IF EXISTS "perfis_select_own" ON perfis;
CREATE POLICY "perfis_select_own" ON perfis FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "perfis_select_treinador_ve_alunos" ON perfis;
CREATE POLICY "perfis_select_treinador_ve_alunos" ON perfis FOR SELECT USING (treinador_id = auth.uid());
DROP POLICY IF EXISTS "perfis_insert_own" ON perfis;
CREATE POLICY "perfis_insert_own" ON perfis FOR INSERT WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "perfis_update_own" ON perfis;
CREATE POLICY "perfis_update_own" ON perfis FOR UPDATE USING (id = auth.uid());

-- BIOMETRIA
DROP POLICY IF EXISTS "biometria_agente_crud" ON biometria;
CREATE POLICY "biometria_agente_crud" ON biometria FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "biometria_treinador_select" ON biometria;
CREATE POLICY "biometria_treinador_select" ON biometria FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- TREINOS_REALIZADOS
DROP POLICY IF EXISTS "treinos_agente_crud" ON treinos_realizados;
CREATE POLICY "treinos_agente_crud" ON treinos_realizados FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "treinos_treinador_select" ON treinos_realizados;
CREATE POLICY "treinos_treinador_select" ON treinos_realizados FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- SERIES_TREINO
DROP POLICY IF EXISTS "series_agente_crud" ON series_treino;
CREATE POLICY "series_agente_crud" ON series_treino FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "series_treinador_select" ON series_treino;
CREATE POLICY "series_treinador_select" ON series_treino FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- VIDEOS_TREINO
DROP POLICY IF EXISTS "videos_agente_crud" ON videos_treino;
CREATE POLICY "videos_agente_crud" ON videos_treino FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "videos_treinador_select" ON videos_treino;
CREATE POLICY "videos_treinador_select" ON videos_treino FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));
DROP POLICY IF EXISTS "videos_treinador_update_comentario" ON videos_treino;
CREATE POLICY "videos_treinador_update_comentario" ON videos_treino FOR UPDATE USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- REFEICOES
DROP POLICY IF EXISTS "refeicoes_agente_crud" ON refeicoes;
CREATE POLICY "refeicoes_agente_crud" ON refeicoes FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "refeicoes_treinador_select" ON refeicoes;
CREATE POLICY "refeicoes_treinador_select" ON refeicoes FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- SUPLEMENTACAO_LOG
DROP POLICY IF EXISTS "suplementacao_agente_crud" ON suplementacao_log;
CREATE POLICY "suplementacao_agente_crud" ON suplementacao_log FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "suplementacao_treinador_select" ON suplementacao_log;
CREATE POLICY "suplementacao_treinador_select" ON suplementacao_log FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- ALERTAS_TREINADOR
DROP POLICY IF EXISTS "alertas_treinador_crud" ON alertas_treinador;
CREATE POLICY "alertas_treinador_crud" ON alertas_treinador FOR ALL USING (treinador_id = auth.uid());

-- HIDRATACAO_LOG
DROP POLICY IF EXISTS "hidratacao_agente_crud" ON hidratacao_log;
CREATE POLICY "hidratacao_agente_crud" ON hidratacao_log FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "hidratacao_treinador_select" ON hidratacao_log;
CREATE POLICY "hidratacao_treinador_select" ON hidratacao_log FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- READINESS_DIARIO
DROP POLICY IF EXISTS "readiness_agente_crud" ON readiness_diario;
CREATE POLICY "readiness_agente_crud" ON readiness_diario FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "readiness_treinador_select" ON readiness_diario;
CREATE POLICY "readiness_treinador_select" ON readiness_diario FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- PROTOCOLOS
DROP POLICY IF EXISTS "protocolos_agente_select" ON protocolos;
CREATE POLICY "protocolos_agente_select" ON protocolos FOR SELECT USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "protocolos_treinador_crud" ON protocolos;
CREATE POLICY "protocolos_treinador_crud" ON protocolos FOR ALL USING (treinador_id = auth.uid());

-- SAUDE
DROP POLICY IF EXISTS "saude_agente_crud" ON saude;
CREATE POLICY "saude_agente_crud" ON saude FOR ALL USING (agente_id = auth.uid());
DROP POLICY IF EXISTS "saude_treinador_select" ON saude;
CREATE POLICY "saude_treinador_select" ON saude FOR SELECT USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()));

-- CONVITES
DROP POLICY IF EXISTS "convites_treinador_crud" ON convites;
CREATE POLICY "convites_treinador_crud" ON convites FOR ALL USING (treinador_id = auth.uid());
DROP POLICY IF EXISTS "convites_public_select_por_codigo" ON convites;
CREATE POLICY "convites_public_select_por_codigo" ON convites FOR SELECT USING (true);

-- EXERCICIOS
DROP POLICY IF EXISTS "exercicios_public_select" ON exercicios;
CREATE POLICY "exercicios_public_select" ON exercicios FOR SELECT USING (true);
DROP POLICY IF EXISTS "exercicios_admin_crud" ON exercicios;
CREATE POLICY "exercicios_admin_crud" ON exercicios FOR ALL USING (auth_user_tipo() = 'admin');
DROP POLICY IF EXISTS "exercicios_treinador_crud" ON exercicios;
CREATE POLICY "exercicios_treinador_crud" ON exercicios FOR ALL USING (auth_user_tipo() IN ('treinador', 'admin'));

-- SERIES_TEMPLATES
DROP POLICY IF EXISTS "series_templates_treinador_crud" ON series_templates;
CREATE POLICY "series_templates_treinador_crud" ON series_templates
FOR ALL USING (treinador_id = auth.uid() OR auth_user_tipo() = 'admin')
WITH CHECK (treinador_id = auth.uid() OR auth_user_tipo() = 'admin');

-- SERIES_TEMPLATE_EXERCICIOS
DROP POLICY IF EXISTS "series_template_exercicios_treinador_crud" ON series_template_exercicios;
CREATE POLICY "series_template_exercicios_treinador_crud" ON series_template_exercicios
FOR ALL USING (
	serie_template_id IN (
		SELECT id FROM series_templates
		WHERE treinador_id = auth.uid() OR auth_user_tipo() = 'admin'
	)
)
WITH CHECK (
	serie_template_id IN (
		SELECT id FROM series_templates
		WHERE treinador_id = auth.uid() OR auth_user_tipo() = 'admin'
	)
);

-- ALUNO_SERIES_VINCULOS
DROP POLICY IF EXISTS "aluno_series_vinculos_treinador_crud" ON aluno_series_vinculos;
CREATE POLICY "aluno_series_vinculos_treinador_crud" ON aluno_series_vinculos
FOR ALL USING (treinador_id = auth.uid() OR auth_user_tipo() = 'admin')
WITH CHECK (treinador_id = auth.uid() OR auth_user_tipo() = 'admin');

DROP POLICY IF EXISTS "aluno_series_vinculos_agente_select" ON aluno_series_vinculos;
CREATE POLICY "aluno_series_vinculos_agente_select" ON aluno_series_vinculos
FOR SELECT USING (agente_id = auth.uid());

-- ALUNO_SERIES_VINCULO_EXERCICIOS
DROP POLICY IF EXISTS "aluno_series_vinculo_exercicios_treinador_crud" ON aluno_series_vinculo_exercicios;
CREATE POLICY "aluno_series_vinculo_exercicios_treinador_crud" ON aluno_series_vinculo_exercicios
FOR ALL USING (
	aluno_serie_vinculo_id IN (
		SELECT id FROM aluno_series_vinculos
		WHERE treinador_id = auth.uid() OR auth_user_tipo() = 'admin'
	)
)
WITH CHECK (
	aluno_serie_vinculo_id IN (
		SELECT id FROM aluno_series_vinculos
		WHERE treinador_id = auth.uid() OR auth_user_tipo() = 'admin'
	)
);

DROP POLICY IF EXISTS "aluno_series_vinculo_exercicios_agente_select" ON aluno_series_vinculo_exercicios;
CREATE POLICY "aluno_series_vinculo_exercicios_agente_select" ON aluno_series_vinculo_exercicios
FOR SELECT USING (
	aluno_serie_vinculo_id IN (
		SELECT id FROM aluno_series_vinculos
		WHERE agente_id = auth.uid()
	)
);

-- TREINO_EXECUCOES
DROP POLICY IF EXISTS "treino_execucoes_treinador_select" ON treino_execucoes;
CREATE POLICY "treino_execucoes_treinador_select" ON treino_execucoes
FOR SELECT USING (treinador_id = auth.uid() OR auth_user_tipo() = 'admin');

DROP POLICY IF EXISTS "treino_execucoes_agente_crud" ON treino_execucoes;
CREATE POLICY "treino_execucoes_agente_crud" ON treino_execucoes
FOR ALL USING (agente_id = auth.uid())
WITH CHECK (agente_id = auth.uid());

-- TREINO_EXECUCAO_ITENS
DROP POLICY IF EXISTS "treino_execucao_itens_agente_crud" ON treino_execucao_itens;
CREATE POLICY "treino_execucao_itens_agente_crud" ON treino_execucao_itens
FOR ALL USING (
	treino_execucao_id IN (
		SELECT id FROM treino_execucoes
		WHERE agente_id = auth.uid()
	)
)
WITH CHECK (
	treino_execucao_id IN (
		SELECT id FROM treino_execucoes
		WHERE agente_id = auth.uid()
	)
);

DROP POLICY IF EXISTS "treino_execucao_itens_treinador_select" ON treino_execucao_itens;
CREATE POLICY "treino_execucao_itens_treinador_select" ON treino_execucao_itens
FOR SELECT USING (
	treino_execucao_id IN (
		SELECT id FROM treino_execucoes
		WHERE treinador_id = auth.uid() OR auth_user_tipo() = 'admin'
	)
);
