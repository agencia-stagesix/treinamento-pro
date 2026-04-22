-- ============================================================
-- TREINAMENTO PRO — Row Level Security (RLS)
-- Migration 002
-- ============================================================

-- Habilitar RLS em todas as tabelas sensíveis
ALTER TABLE perfis              ENABLE ROW LEVEL SECURITY;
ALTER TABLE saude               ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometria           ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos_realizados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_treino       ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos_treino       ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE suplementacao_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_treinador   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidratacao_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_diario    ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios          ENABLE ROW LEVEL SECURITY;

-- ─── Helper: obter tipo do usuário logado ──────────────────
CREATE OR REPLACE FUNCTION auth_user_tipo()
RETURNS TEXT AS $$
  SELECT tipo_usuario FROM perfis WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Helper: obter treinador do usuário logado ─────────────
CREATE OR REPLACE FUNCTION auth_user_treinador_id()
RETURNS UUID AS $$
  SELECT treinador_id FROM perfis WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── PERFIS ────────────────────────────────────────────────
-- Qualquer um pode ler perfis públicos básicos (para associação treinador)
CREATE OR REPLACE POLICY "perfis_select_own" ON perfis
  FOR SELECT USING (id = auth.uid());

CREATE OR REPLACE POLICY "perfis_select_treinador_vê_alunos" ON perfis
  FOR SELECT USING (treinador_id = auth.uid());

CREATE OR REPLACE POLICY "perfis_insert_own" ON perfis
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE OR REPLACE POLICY "perfis_update_own" ON perfis
  FOR UPDATE USING (id = auth.uid());

-- ─── BIOMETRIA ─────────────────────────────────────────────
CREATE OR REPLACE POLICY "biometria_agente_crud" ON biometria
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "biometria_treinador_select" ON biometria
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── TREINOS ───────────────────────────────────────────────
CREATE OR REPLACE POLICY "treinos_agente_crud" ON treinos_realizados
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "treinos_treinador_select" ON treinos_realizados
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── SÉRIES ────────────────────────────────────────────────
CREATE OR REPLACE POLICY "series_agente_crud" ON series_treino
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "series_treinador_select" ON series_treino
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── VÍDEOS ────────────────────────────────────────────────
CREATE OR REPLACE POLICY "videos_agente_crud" ON videos_treino
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "videos_treinador_select" ON videos_treino
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

CREATE OR REPLACE POLICY "videos_treinador_update_comentario" ON videos_treino
  FOR UPDATE USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── REFEIÇÕES ─────────────────────────────────────────────
CREATE OR REPLACE POLICY "refeicoes_agente_crud" ON refeicoes
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "refeicoes_treinador_select" ON refeicoes
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── SUPLEMENTAÇÃO ─────────────────────────────────────────
CREATE OR REPLACE POLICY "suplementacao_agente_crud" ON suplementacao_log
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "suplementacao_treinador_select" ON suplementacao_log
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── ALERTAS ───────────────────────────────────────────────
-- Apenas o treinador dono vê e gerencia alertas
CREATE OR REPLACE POLICY "alertas_treinador_crud" ON alertas_treinador
  FOR ALL USING (treinador_id = auth.uid());

-- ─── HIDRATAÇÃO ────────────────────────────────────────────
CREATE OR REPLACE POLICY "hidratacao_agente_crud" ON hidratacao_log
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "hidratacao_treinador_select" ON hidratacao_log
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── READINESS ─────────────────────────────────────────────
CREATE OR REPLACE POLICY "readiness_agente_crud" ON readiness_diario
  FOR ALL USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "readiness_treinador_select" ON readiness_diario
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── PROTOCOLOS ────────────────────────────────────────────
CREATE OR REPLACE POLICY "protocolos_agente_select" ON protocolos
  FOR SELECT USING (agente_id = auth.uid());

CREATE OR REPLACE POLICY "protocolos_treinador_crud" ON protocolos
  FOR ALL USING (treinador_id = auth.uid());

-- ─── SAÚDE ─────────────────────────────────────────────────
CREATE OR REPLACE POLICY "saude_agente_crud" ON saude
  FOR ALL USING (agente_id = auth.uid());

-- Treinador vê apenas dados extraídos (não o PDF bruto — lógica no backend)
CREATE OR REPLACE POLICY "saude_treinador_select" ON saude
  FOR SELECT USING (
    agente_id IN (
      SELECT id FROM perfis WHERE treinador_id = auth.uid()
    )
  );

-- ─── CONVITES ──────────────────────────────────────────────
CREATE OR REPLACE POLICY "convites_treinador_crud" ON convites
  FOR ALL USING (treinador_id = auth.uid());

CREATE OR REPLACE POLICY "convites_public_select_por_codigo" ON convites
  FOR SELECT USING (true); -- código é validado no backend

-- ─── EXERCÍCIOS (público para leitura) ─────────────────────
CREATE OR REPLACE POLICY "exercicios_public_select" ON exercicios
  FOR SELECT USING (true);

-- Apenas admin insere/edita exercícios
CREATE OR REPLACE POLICY "exercicios_admin_crud" ON exercicios
  FOR ALL USING (auth_user_tipo() = 'admin');
