-- ============================================================
-- TREINAMENTO PRO — Schema Completo
-- Migration 001 — Tabelas, Triggers, Índices
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. PERFIS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfis (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_usuario    VARCHAR(50) NOT NULL CHECK (tipo_usuario IN ('treinador', 'agente', 'admin')),
  nome            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  foto_url        TEXT,
  treinador_id    UUID REFERENCES perfis(id) ON DELETE SET NULL,
  data_nascimento DATE,
  peso_alvo       DECIMAL(5,2),
  gordura_alvo    DECIMAL(4,2),
  data_criacao    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 2. SAÚDE / COFRE MÉDICO ───────────────────────────────
CREATE TABLE IF NOT EXISTS saude (
  id                                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id                           UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  frequencia_cardiaca_maxima_teste    INTEGER,  -- bpm registrado em Holter/Ergométrico
  frequencia_cardiaca_repouso         INTEGER,
  frequencia_cardiaca_limite_alerta   INTEGER GENERATED ALWAYS AS
    (ROUND(frequencia_cardiaca_maxima_teste * 0.95)::INTEGER) STORED,
  data_exame                          DATE NOT NULL,
  exame_pdf_url                       TEXT,
  dados_extraidos_ia                  JSONB,
  created_at                          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 3. BIOMETRIA ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS biometria (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id           UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  peso                DECIMAL(5,2) NOT NULL,
  percentual_gordura  DECIMAL(4,2),
  massa_muscular      DECIMAL(5,2),
  percentual_agua     DECIMAL(4,2),
  gordura_visceral    INTEGER,
  cintura             DECIMAL(5,2),
  notas               TEXT,
  data_registro       DATE NOT NULL,
  fonte               VARCHAR(50) DEFAULT 'manual' CHECK (fonte IN ('manual', 'wearable', 'balanca')),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (agente_id, data_registro)
);

-- ─── 4. TREINOS REALIZADOS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS treinos_realizados (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id                   UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  data_treino                 DATE NOT NULL,
  tipo                        VARCHAR(100),
  duracao_minutos             INTEGER,
  calorias                    INTEGER,
  frequencia_cardiaca_media   INTEGER,
  frequencia_cardiaca_pico    INTEGER,
  esforco_percebido           INTEGER CHECK (esforco_percebido BETWEEN 1 AND 10),
  readiness_score             INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
  notas                       TEXT,
  status                      VARCHAR(50) DEFAULT 'concluido' CHECK (status IN ('concluido', 'cancelado', 'parcial')),
  fonte_fc                    VARCHAR(50) DEFAULT 'manual' CHECK (fonte_fc IN ('manual', 'wearable')),
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 5. SÉRIES DE TREINO (volume tracking) ─────────────────
CREATE TABLE IF NOT EXISTS series_treino (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treino_id   UUID NOT NULL REFERENCES treinos_realizados(id) ON DELETE CASCADE,
  agente_id   UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  exercicio   VARCHAR(255) NOT NULL,
  serie_num   INTEGER NOT NULL,
  repeticoes  INTEGER,
  carga_kg    DECIMAL(6,2),
  notas       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 6. VÍDEOS DE TREINO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS videos_treino (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treino_id               UUID REFERENCES treinos_realizados(id) ON DELETE CASCADE,
  agente_id               UUID NOT NULL REFERENCES perfis(id),
  exercicio               VARCHAR(255),
  video_url               TEXT NOT NULL,
  video_size_bytes        BIGINT,
  duracao_segundos        INTEGER,
  angulo_tripe_correto    BOOLEAN DEFAULT false,
  falha_postural_detectada BOOLEAN DEFAULT false,
  analise_ia_resultado    JSONB,
  status_analise          VARCHAR(50) DEFAULT 'aguardando'
    CHECK (status_analise IN ('aguardando', 'processando', 'concluido', 'reenvio')),
  comentario_treinador    TEXT,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 7. REFEIÇÕES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refeicoes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id           UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  tipo                VARCHAR(100) CHECK (tipo IN (
    'Pre-Treino', 'Pos-Treino', 'Cafe-da-Manha', 'Almoco', 'Lanche', 'Jantar', 'Ceia'
  )),
  descricao           TEXT,
  foto_url            TEXT,
  calorias_estimadas  INTEGER,
  proteina_g          DECIMAL(6,1),
  carboidrato_g       DECIMAL(6,1),
  gordura_g           DECIMAL(6,1),
  fibra_g             DECIMAL(6,1),
  dentro_protocolo    BOOLEAN,
  analise_ia          JSONB,
  data_refeicao       DATE NOT NULL,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 8. SUPLEMENTAÇÃO LOG ──────────────────────────────────
CREATE TABLE IF NOT EXISTS suplementacao_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id       UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  suplemento      VARCHAR(100) NOT NULL,
  confirmado      BOOLEAN DEFAULT false,
  horario_alvo    TIME,
  horario_real    TIMESTAMP WITH TIME ZONE,
  data_log        DATE NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 9. ALERTAS DO TREINADOR ───────────────────────────────
CREATE TABLE IF NOT EXISTS alertas_treinador (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treinador_id    UUID NOT NULL REFERENCES perfis(id),
  agente_id       UUID NOT NULL REFERENCES perfis(id),
  tipo_alerta     VARCHAR(100) NOT NULL
    CHECK (tipo_alerta IN ('estagnacao', 'risco_cardiologico', 'ausencia', 'dieta', 'vencimento_treinamento_d3', 'vencimento_treinamento_d0')),
  severidade      VARCHAR(20) DEFAULT 'info'
    CHECK (severidade IN ('info', 'warning', 'critical')),
  descricao       TEXT,
  dados_contexto  JSONB,
  lido            BOOLEAN DEFAULT false,
  acao_tomada     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 10. HIDRATAÇÃO LOG ────────────────────────────────────
CREATE TABLE IF NOT EXISTS hidratacao_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id   UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  volume_ml   INTEGER NOT NULL CHECK (volume_ml > 0),
  meta_ml     INTEGER DEFAULT 4000,
  data_log    DATE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 11. READINESS DIÁRIO ──────────────────────────────────
CREATE TABLE IF NOT EXISTS readiness_diario (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id         UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  qualidade_sono    INTEGER NOT NULL CHECK (qualidade_sono BETWEEN 1 AND 5),
  nivel_estresse    INTEGER NOT NULL CHECK (nivel_estresse BETWEEN 1 AND 5),
  fadiga_muscular   INTEGER NOT NULL CHECK (fadiga_muscular BETWEEN 1 AND 5),
  score_calculado   INTEGER GENERATED ALWAYS AS (
    GREATEST(0, LEAST(100, 100 - ((nivel_estresse + fadiga_muscular - qualidade_sono + 3) * 10)))
  ) STORED,
  data_registro     DATE NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (agente_id, data_registro)
);

-- ─── 12. PROTOCOLOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocolos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id       UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  treinador_id    UUID NOT NULL REFERENCES perfis(id),
  plano_alimentar JSONB DEFAULT '[]'::JSONB,
  planilha_treino JSONB DEFAULT '[]'::JSONB,
  suplementos     JSONB DEFAULT '[]'::JSONB,
  metas           JSONB DEFAULT '{}'::JSONB,
  ativo           BOOLEAN DEFAULT true,
  versao          INTEGER DEFAULT 1,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 13. BIBLIOTECA DE EXERCÍCIOS ──────────────────────────
CREATE TABLE IF NOT EXISTS exercicios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            VARCHAR(255) NOT NULL,
  nome_normalizado VARCHAR(255) GENERATED ALWAYS AS (LOWER(nome)) STORED,
  grupo_muscular  VARCHAR(100) NOT NULL,
  equipamento     VARCHAR(100),
  tags            TEXT[] DEFAULT '{}',
  descricao       TEXT,
  video_url       TEXT,
  imagem_url      TEXT,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 13.1 SÉRIES TEMPLATE (Treinamento) ───────────────────
CREATE TABLE IF NOT EXISTS series_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treinador_id    UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  nome            VARCHAR(255) NOT NULL,
  descricao       TEXT,
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series_template_exercicios (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serie_template_id   UUID NOT NULL REFERENCES series_templates(id) ON DELETE CASCADE,
  exercicio_id        UUID NOT NULL REFERENCES exercicios(id) ON DELETE RESTRICT,
  ordem               INTEGER NOT NULL CHECK (ordem > 0),
  repeticoes          INTEGER NOT NULL CHECK (repeticoes > 0),
  descanso_seg        INTEGER NOT NULL DEFAULT 60 CHECK (descanso_seg >= 0),
  observacoes         TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (serie_template_id, ordem)
);

-- ─── 13.2 VÍNCULO SÉRIE-ALUNO ─────────────────────────────
CREATE TABLE IF NOT EXISTS aluno_series_vinculos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agente_id       UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  treinador_id    UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  serie_template_id UUID NOT NULL REFERENCES series_templates(id) ON DELETE RESTRICT,
  inicio_em       DATE NOT NULL DEFAULT CURRENT_DATE,
  validade_em     DATE NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'pausado', 'concluido', 'expirado')),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (validade_em >= inicio_em)
);

CREATE TABLE IF NOT EXISTS aluno_series_vinculo_exercicios (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_serie_vinculo_id    UUID NOT NULL REFERENCES aluno_series_vinculos(id) ON DELETE CASCADE,
  serie_template_exercicio_id UUID NOT NULL REFERENCES series_template_exercicios(id) ON DELETE CASCADE,
  repeticoes_override       INTEGER CHECK (repeticoes_override > 0),
  descanso_seg_override     INTEGER CHECK (descanso_seg_override >= 0),
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (aluno_serie_vinculo_id, serie_template_exercicio_id)
);

-- ─── 13.3 EXECUÇÃO GUIADA (Aluno) ─────────────────────────
CREATE TABLE IF NOT EXISTS treino_execucoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_serie_vinculo_id UUID NOT NULL REFERENCES aluno_series_vinculos(id) ON DELETE CASCADE,
  agente_id       UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  treinador_id    UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  iniciado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalizado_em   TIMESTAMP WITH TIME ZONE,
  status          VARCHAR(30) NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento', 'concluida', 'abandonada')),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treino_execucao_itens (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treino_execucao_id            UUID NOT NULL REFERENCES treino_execucoes(id) ON DELETE CASCADE,
  serie_template_exercicio_id   UUID NOT NULL REFERENCES series_template_exercicios(id) ON DELETE RESTRICT,
  exercicio_id                  UUID NOT NULL REFERENCES exercicios(id) ON DELETE RESTRICT,
  ordem                         INTEGER NOT NULL CHECK (ordem > 0),
  repeticoes_planejadas         INTEGER NOT NULL CHECK (repeticoes_planejadas > 0),
  repeticoes_realizadas         INTEGER,
  descanso_planejado_seg        INTEGER NOT NULL DEFAULT 60 CHECK (descanso_planejado_seg >= 0),
  descanso_real_seg             INTEGER,
  carga_kg                      DECIMAL(6,2),
  esforco_percebido             INTEGER CHECK (esforco_percebido BETWEEN 6 AND 10),
  pulado                        BOOLEAN DEFAULT false,
  concluido_em                  TIMESTAMP WITH TIME ZONE,
  observacoes                   TEXT,
  created_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (treino_execucao_id, ordem)
);

-- ─── 14. CONVITES DE TREINADOR ─────────────────────────────
CREATE TABLE IF NOT EXISTS convites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treinador_id    UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  codigo          VARCHAR(12) NOT NULL UNIQUE,
  usado           BOOLEAN DEFAULT false,
  agente_id       UUID REFERENCES perfis(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at      TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_biometria_agente_data
  ON biometria (agente_id, data_registro DESC);

CREATE INDEX IF NOT EXISTS idx_treinos_agente_data
  ON treinos_realizados (agente_id, data_treino DESC);

CREATE INDEX IF NOT EXISTS idx_alertas_treinador_lido
  ON alertas_treinador (treinador_id, lido, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refeicoes_agente_data
  ON refeicoes (agente_id, data_refeicao DESC);

CREATE INDEX IF NOT EXISTS idx_readiness_agente_data
  ON readiness_diario (agente_id, data_registro DESC);

CREATE INDEX IF NOT EXISTS idx_hidratacao_agente_data
  ON hidratacao_log (agente_id, data_log DESC);

CREATE INDEX IF NOT EXISTS idx_series_treino
  ON series_treino (treino_id);

CREATE INDEX IF NOT EXISTS idx_suplementacao_agente_data
  ON suplementacao_log (agente_id, data_log DESC);

CREATE INDEX IF NOT EXISTS idx_exercicios_grupo
  ON exercicios (grupo_muscular);

CREATE INDEX IF NOT EXISTS idx_exercicios_tags
  ON exercicios USING GIN (tags);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercicios_nome_unique
  ON exercicios (nome_normalizado);

CREATE INDEX IF NOT EXISTS idx_series_templates_treinador
  ON series_templates (treinador_id, ativo, nome);

CREATE INDEX IF NOT EXISTS idx_series_template_exercicios_template
  ON series_template_exercicios (serie_template_id, ordem);

CREATE INDEX IF NOT EXISTS idx_aluno_series_vinculos_agente
  ON aluno_series_vinculos (agente_id, status, validade_em);

CREATE INDEX IF NOT EXISTS idx_aluno_series_vinculos_treinador
  ON aluno_series_vinculos (treinador_id, status, validade_em);

CREATE INDEX IF NOT EXISTS idx_treino_execucoes_agente
  ON treino_execucoes (agente_id, iniciado_em DESC);

CREATE INDEX IF NOT EXISTS idx_treino_execucao_itens_execucao
  ON treino_execucao_itens (treino_execucao_id, ordem);

-- ============================================================
-- TRIGGER: ALERTA DE ESTAGNAÇÃO
-- Condição: variação de peso < 0.5kg nos últimos 15 dias
--           E presença em treinos > 90%
-- ============================================================
CREATE OR REPLACE FUNCTION fn_verificar_estagnacao()
RETURNS TRIGGER AS $$
DECLARE
  v_variacao    DECIMAL;
  v_presenca    DECIMAL;
  v_treinador   UUID;
  v_alerta_existe BOOLEAN;
BEGIN
  -- Variação de peso nos últimos 15 dias
  SELECT MAX(peso) - MIN(peso)
  INTO v_variacao
  FROM biometria
  WHERE agente_id = NEW.agente_id
    AND data_registro >= CURRENT_DATE - INTERVAL '15 days';

  -- Taxa de presença nos últimos 15 dias
  SELECT COUNT(*) * 100.0 / NULLIF(10.0, 0)
  INTO v_presenca
  FROM treinos_realizados
  WHERE agente_id = NEW.agente_id
    AND data_treino >= CURRENT_DATE - INTERVAL '15 days'
    AND status = 'concluido';

  -- Busca treinador do agente
  SELECT treinador_id INTO v_treinador
  FROM perfis WHERE id = NEW.agente_id;

  -- Só dispara se tiver treinador vinculado
  IF v_treinador IS NULL THEN
    RETURN NEW;
  END IF;

  -- Evita alertas duplicados não lidos
  SELECT EXISTS (
    SELECT 1 FROM alertas_treinador
    WHERE agente_id = NEW.agente_id
      AND tipo_alerta = 'estagnacao'
      AND lido = false
      AND created_at >= NOW() - INTERVAL '15 days'
  ) INTO v_alerta_existe;

  IF ABS(COALESCE(v_variacao, 0)) < 0.5
     AND COALESCE(v_presenca, 0) > 90
     AND NOT v_alerta_existe
  THEN
    INSERT INTO alertas_treinador (
      treinador_id, agente_id, tipo_alerta, severidade, descricao, dados_contexto
    ) VALUES (
      v_treinador,
      NEW.agente_id,
      'estagnacao',
      'warning',
      'Estagnação Detectada: peso estável há 15 dias com presença > 90%',
      jsonb_build_object(
        'variacao_peso', v_variacao,
        'presenca_pct', v_presenca,
        'peso_atual', NEW.peso
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_estagnacao ON biometria;
CREATE TRIGGER trg_estagnacao
  AFTER INSERT OR UPDATE ON biometria
  FOR EACH ROW EXECUTE FUNCTION fn_verificar_estagnacao();

-- ============================================================
-- TRIGGER: ALERTA DE RISCO CARDIOLÓGICO
-- Condição: FC pico > 95% da FC máxima registrada em exame
-- ============================================================
CREATE OR REPLACE FUNCTION fn_verificar_risco_cardiologico()
RETURNS TRIGGER AS $$
DECLARE
  v_fc_max_teste  INTEGER;
  v_limite        INTEGER;
  v_treinador     UUID;
BEGIN
  IF NEW.frequencia_cardiaca_pico IS NULL THEN
    RETURN NEW;
  END IF;

  -- Último exame com FC máxima registrada
  SELECT s.frequencia_cardiaca_maxima_teste
  INTO v_fc_max_teste
  FROM saude s
  WHERE s.agente_id = NEW.agente_id
  ORDER BY s.data_exame DESC
  LIMIT 1;

  IF v_fc_max_teste IS NULL THEN
    RETURN NEW;
  END IF;

  v_limite := ROUND(v_fc_max_teste * 0.95);

  SELECT treinador_id INTO v_treinador
  FROM perfis WHERE id = NEW.agente_id;

  IF v_treinador IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.frequencia_cardiaca_pico > v_limite THEN
    INSERT INTO alertas_treinador (
      treinador_id, agente_id, tipo_alerta, severidade, descricao, dados_contexto
    ) VALUES (
      v_treinador,
      NEW.agente_id,
      'risco_cardiologico',
      'critical',
      'ALERTA VERMELHO: FC pico ultrapassou 95% do limite seguro durante treino',
      jsonb_build_object(
        'fc_pico', NEW.frequencia_cardiaca_pico,
        'fc_max_teste', v_fc_max_teste,
        'limite_95pct', v_limite,
        'data_treino', NEW.data_treino
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_risco_cardiologico ON treinos_realizados;
CREATE TRIGGER trg_risco_cardiologico
  AFTER INSERT OR UPDATE ON treinos_realizados
  FOR EACH ROW EXECUTE FUNCTION fn_verificar_risco_cardiologico();

-- ============================================================
-- TRIGGER: updated_at em protocolos
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protocolos_updated_at ON protocolos;
CREATE TRIGGER trg_protocolos_updated_at
  BEFORE UPDATE ON protocolos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_exercicios_updated_at ON exercicios;
CREATE TRIGGER trg_exercicios_updated_at
  BEFORE UPDATE ON exercicios
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_series_templates_updated_at ON series_templates;
CREATE TRIGGER trg_series_templates_updated_at
  BEFORE UPDATE ON series_templates
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_aluno_series_vinculos_updated_at ON aluno_series_vinculos;
CREATE TRIGGER trg_aluno_series_vinculos_updated_at
  BEFORE UPDATE ON aluno_series_vinculos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
