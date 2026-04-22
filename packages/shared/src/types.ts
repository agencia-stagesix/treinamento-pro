// ─── Core User Types ───────────────────────────────────────────────────────

export type UserRole = "treinador" | "agente" | "admin";

export interface Perfil {
  id: string;
  tipo_usuario: UserRole;
  nome: string;
  email: string;
  foto_url?: string;
  treinador_id?: string;
  data_nascimento?: string;
  peso_alvo?: number;
  gordura_alvo?: number;
  data_criacao: string;
}

// ─── Biometria ─────────────────────────────────────────────────────────────

export interface Biometria {
  id: string;
  agente_id: string;
  peso: number;
  percentual_gordura?: number;
  massa_muscular?: number;
  percentual_agua?: number;
  gordura_visceral?: number;
  cintura?: number;
  notas?: string;
  data_registro: string;
  fonte: "manual" | "wearable" | "balanca";
  created_at: string;
}

export interface BiometriaSummary {
  ultimo_peso?: number;
  variacao_peso_7d?: number;
  variacao_peso_30d?: number;
  ultimo_percentual_gordura?: number;
  ultima_massa_muscular?: number;
  tendencia: "subindo" | "descendo" | "estavel";
}

// ─── Treinos ───────────────────────────────────────────────────────────────

export type TipoTreino =
  | "Musculação"
  | "Cardio"
  | "HIIT"
  | "Yoga"
  | "Pilates"
  | "Funcional"
  | "Natação"
  | "Corrida"
  | "Ciclismo"
  | "Outro";

export interface TreinoRealizado {
  id: string;
  agente_id: string;
  data_treino: string;
  tipo?: TipoTreino;
  duracao_minutos?: number;
  calorias?: number;
  frequencia_cardiaca_media?: number;
  frequencia_cardiaca_pico?: number;
  esforco_percebido?: number; // Escala Borg 1-10
  readiness_score?: number;
  notas?: string;
  status: "concluido" | "cancelado" | "parcial";
  fonte_fc: "manual" | "wearable";
  created_at: string;
}

export interface VolumeTotal {
  data_treino: string;
  volume_total: number; // séries × reps × carga
  total_series: number;
  total_repeticoes: number;
}

// ─── Hidratação ────────────────────────────────────────────────────────────

export interface HidratacaoLog {
  id: string;
  agente_id: string;
  volume_ml: number;
  meta_ml: number;
  data_log: string;
  created_at: string;
}

export interface HidratacaoDia {
  data_log: string;
  total_ml: number;
  meta_ml: number;
  percentual: number;
  registros: HidratacaoLog[];
}

// ─── Readiness ─────────────────────────────────────────────────────────────

export interface ReadinessDiario {
  id: string;
  agente_id: string;
  qualidade_sono: number; // 1-5
  nivel_estresse: number; // 1-5
  fadiga_muscular: number; // 1-5
  score_calculado: number; // 0-100, gerado pelo banco
  data_registro: string;
  created_at: string;
}

// ─── Refeições ─────────────────────────────────────────────────────────────

export type TipoRefeicao =
  | "Pre-Treino"
  | "Pos-Treino"
  | "Cafe-da-Manha"
  | "Almoco"
  | "Lanche"
  | "Jantar"
  | "Ceia";

export interface Refeicao {
  id: string;
  agente_id: string;
  tipo: TipoRefeicao;
  descricao?: string;
  foto_url?: string;
  calorias_estimadas?: number;
  proteina_g?: number;
  carboidrato_g?: number;
  gordura_g?: number;
  fibra_g?: number;
  dentro_protocolo?: boolean;
  analise_ia?: Record<string, unknown>;
  data_refeicao: string;
  created_at: string;
}

// ─── Suplementação ─────────────────────────────────────────────────────────

export interface SuplementacaoLog {
  id: string;
  agente_id: string;
  suplemento: string;
  confirmado: boolean;
  horario_alvo?: string;
  horario_real?: string;
  data_log: string;
  created_at: string;
}

// ─── Saúde / Cofre Médico ──────────────────────────────────────────────────

export interface Saude {
  id: string;
  agente_id: string;
  frequencia_cardiaca_maxima_teste?: number;
  frequencia_cardiaca_repouso?: number;
  frequencia_cardiaca_limite_alerta?: number; // gerado: fc_max * 0.95
  data_exame: string;
  exame_pdf_url?: string;
  dados_extraidos_ia?: Record<string, unknown>;
  created_at: string;
}

// ─── Alertas do Treinador ──────────────────────────────────────────────────

export type TipoAlerta =
  | "estagnacao"
  | "risco_cardiologico"
  | "ausencia"
  | "dieta";
export type SeveridadeAlerta = "info" | "warning" | "critical";

export interface AlertaTreinador {
  id: string;
  treinador_id: string;
  agente_id: string;
  tipo_alerta: TipoAlerta;
  severidade: SeveridadeAlerta;
  descricao: string;
  dados_contexto?: Record<string, unknown>;
  lido: boolean;
  acao_tomada?: string;
  created_at: string;
  // Joined
  agente?: Pick<Perfil, "id" | "nome" | "foto_url">;
}

// ─── Protocolos ────────────────────────────────────────────────────────────

export interface RefeicaoProtocolo {
  tipo: TipoRefeicao;
  horario: string;
  descricao: string;
  calorias_alvo?: number;
  proteina_alvo?: number;
}

export interface ExercicioProtocolo {
  exercicio_id?: string;
  nome: string;
  series: number;
  repeticoes: string; // ex: "8-12" ou "15"
  carga?: string; // ex: "20kg" ou "Moderada"
  descanso_seg?: number;
  video_url?: string;
  notas?: string;
}

export interface DiaTreino {
  dia_semana: number; // 0=Dom, 1=Seg...
  nome: string; // ex: "Segunda — Peito/Tríceps"
  exercicios: ExercicioProtocolo[];
}

export interface SuplementoProtocolo {
  nome: string;
  dose: string;
  horario_relativo: string; // ex: "Imediatamente pós-treino"
}

export interface MetasProtocolo {
  peso_alvo?: number;
  gordura_alvo?: number;
  prazo?: string;
}

export interface Protocolo {
  id: string;
  agente_id: string;
  treinador_id: string;
  plano_alimentar: RefeicaoProtocolo[];
  planilha_treino: DiaTreino[];
  suplementos: SuplementoProtocolo[];
  metas: MetasProtocolo;
  ativo: boolean;
  versao: number;
  updated_at: string;
}

// ─── Exercícios (biblioteca) ───────────────────────────────────────────────

export interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
  equipamento?: string;
  tags: string[];
  descricao?: string;
  video_url?: string;
  created_at: string;
}

// ─── Dashboard do Treinador ────────────────────────────────────────────────

export interface StatusAlunoHoje {
  agente: Pick<Perfil, "id" | "nome" | "foto_url">;
  ultimo_peso?: number;
  variacao_peso?: number;
  treinou_hoje: boolean;
  registrou_refeicao_hoje: boolean;
  hidratacao_hoje_ml: number;
  hidratacao_meta_ml: number;
  readiness_hoje?: number;
  dias_sem_registro: number;
  alertas_ativos: Array<
    Pick<AlertaTreinador, "id" | "tipo_alerta" | "severidade">
  >;
}

// ─── API Response Wrappers ─────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: Perfil;
}
