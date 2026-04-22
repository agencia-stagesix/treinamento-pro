import { writeFileSync } from 'fs';

const tables = {
  perfis: [
    ['perfis_select_own', 'SELECT', 'USING (id = auth.uid())'],
    ['perfis_select_treinador_ve_alunos', 'SELECT', 'USING (treinador_id = auth.uid())'],
    ['perfis_insert_own', 'INSERT', 'WITH CHECK (id = auth.uid())'],
    ['perfis_update_own', 'UPDATE', 'USING (id = auth.uid())'],
  ],
  biometria: [
    ['biometria_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['biometria_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  treinos_realizados: [
    ['treinos_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['treinos_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  series_treino: [
    ['series_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['series_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  videos_treino: [
    ['videos_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['videos_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
    ['videos_treinador_update_comentario', 'UPDATE', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  refeicoes: [
    ['refeicoes_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['refeicoes_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  suplementacao_log: [
    ['suplementacao_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['suplementacao_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  alertas_treinador: [
    ['alertas_treinador_crud', 'ALL', 'USING (treinador_id = auth.uid())'],
  ],
  hidratacao_log: [
    ['hidratacao_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['hidratacao_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  readiness_diario: [
    ['readiness_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['readiness_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  protocolos: [
    ['protocolos_agente_select', 'SELECT', 'USING (agente_id = auth.uid())'],
    ['protocolos_treinador_crud', 'ALL', 'USING (treinador_id = auth.uid())'],
  ],
  saude: [
    ['saude_agente_crud', 'ALL', 'USING (agente_id = auth.uid())'],
    ['saude_treinador_select', 'SELECT', 'USING (agente_id IN (SELECT id FROM perfis WHERE treinador_id = auth.uid()))'],
  ],
  convites: [
    ['convites_treinador_crud', 'ALL', 'USING (treinador_id = auth.uid())'],
    ['convites_public_select_por_codigo', 'SELECT', 'USING (true)'],
  ],
  exercicios: [
    ['exercicios_public_select', 'SELECT', 'USING (true)'],
    ['exercicios_admin_crud', 'ALL', "USING (auth_user_tipo() = 'admin')"],
  ],
};

const tablesToEnable = Object.keys(tables);

let lines = [
  '-- TREINAMENTO PRO - Row Level Security (RLS)',
  '-- Migration 002',
  '',
];

for (const t of tablesToEnable) {
  lines.push(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`);
}

lines.push('');
lines.push("CREATE OR REPLACE FUNCTION auth_user_tipo() RETURNS TEXT AS $$ SELECT tipo_usuario FROM perfis WHERE id = auth.uid() $$ LANGUAGE sql SECURITY DEFINER STABLE;");
lines.push("CREATE OR REPLACE FUNCTION auth_user_treinador_id() RETURNS UUID AS $$ SELECT treinador_id FROM perfis WHERE id = auth.uid() $$ LANGUAGE sql SECURITY DEFINER STABLE;");
lines.push('');

for (const [table, policies] of Object.entries(tables)) {
  lines.push(`-- ${table.toUpperCase()}`);
  for (const [name, action, clause] of policies) {
    lines.push(`DROP POLICY IF EXISTS "${name}" ON ${table};`);
    lines.push(`CREATE POLICY "${name}" ON ${table} FOR ${action} ${clause};`);
  }
  lines.push('');
}

writeFileSync('supabase/migrations/002_rls.sql', lines.join('\n'), 'utf8');
console.log('002_rls.sql reescrito com sucesso. Linhas:', lines.length);
