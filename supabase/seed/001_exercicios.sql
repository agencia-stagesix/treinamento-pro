-- ============================================================
-- SEED: Biblioteca de Exercícios com Tags Semânticas
-- ============================================================

INSERT INTO exercicios (nome, grupo_muscular, equipamento, tags, descricao) VALUES

-- ── PEITO ──────────────────────────────────────────────────
('Supino Reto com Barra', 'Peito', 'Barra', ARRAY['peito', 'peitoral', 'empurrar', 'horizontal', 'barra', 'supino'], 'Exercício composto para desenvolvimento do peitoral maior.'),
('Supino Inclinado com Halteres', 'Peito', 'Halteres', ARRAY['peito', 'peitoral', 'parte superior', 'inclinado', 'halteres'], 'Foco na porção superior do peitoral.'),
('Supino Declinado', 'Peito', 'Barra', ARRAY['peito', 'peitoral', 'parte inferior', 'declinado', 'barra'], 'Foco na porção inferior do peitoral.'),
('Crucifixo Plano', 'Peito', 'Halteres', ARRAY['peito', 'peitoral', 'abertura', 'crucifixo', 'halteres', 'alongamento'], 'Isolamento do peitoral com amplitude de movimento.'),
('Crossover na Polia', 'Peito', 'Polia', ARRAY['peito', 'peitoral', 'crucifixo', 'polia', 'cabos', 'isolamento'], 'Finalização e definição do peitoral.'),
('Flexão de Braço', 'Peito', 'Peso Corporal', ARRAY['peito', 'peitoral', 'empurrar', 'funcional', 'sem equipamento', 'push-up'], 'Exercício funcional com peso corporal.'),

-- ── COSTAS ─────────────────────────────────────────────────
('Remada Curvada com Barra', 'Costas', 'Barra', ARRAY['costas', 'dorsal', 'puxar', 'remada', 'barra', 'espessura'], 'Espessura das costas e romboides.'),
('Remada Unilateral com Halter', 'Costas', 'Halteres', ARRAY['costas', 'dorsal', 'puxar', 'remada', 'halteres', 'unilateral'], 'Trabalha um lado por vez para correção de assimetrias.'),
('Puxada na Polia Alta (Barra Larga)', 'Costas', 'Polia', ARRAY['costas', 'dorsal', 'puxar', 'latíssimo', 'largura', 'polia', 'pulley'], 'Largura das costas — latíssimo do dorso.'),
('Barra Fixa', 'Costas', 'Barra Fixa', ARRAY['costas', 'dorsal', 'puxar', 'barra fixa', 'pull-up', 'funcional', 'sem peso'], 'Exercício composto de alta intensidade.'),
('Levantamento Terra', 'Costas', 'Barra', ARRAY['costas', 'posterior', 'glúteo', 'isquiotibial', 'deadlift', 'composto', 'lombar'], 'Exercício rei para força e massa muscular.'),
('Serrote com Halter', 'Costas', 'Halteres', ARRAY['costas', 'dorsal', 'puxar', 'remada', 'halteres', 'unilateral', 'serrote'], 'Variação de remada unilateral.'),

-- ── OMBROS ─────────────────────────────────────────────────
('Desenvolvimento Militar com Barra', 'Ombros', 'Barra', ARRAY['ombros', 'deltoides', 'empurrar', 'vertical', 'barra', 'overhead press'], 'Composto para todo o deltoide.'),
('Desenvolvimento com Halteres', 'Ombros', 'Halteres', ARRAY['ombros', 'deltoides', 'empurrar', 'vertical', 'halteres'], 'Amplitude maior que barra.'),
('Elevação Lateral', 'Ombros', 'Halteres', ARRAY['ombros', 'deltoides medial', 'lateral raise', 'halteres', 'isolamento', 'largura'], 'Definição da porção lateral do deltoide.'),
('Elevação Frontal', 'Ombros', 'Halteres', ARRAY['ombros', 'deltoides anterior', 'frontal', 'halteres', 'isolamento'], 'Porção anterior do deltoide.'),
('Remada Alta', 'Ombros', 'Barra', ARRAY['ombros', 'trapézio', 'deltoides', 'remada alta', 'barra', 'upright row'], 'Trapézio e deltoides simultâneos.'),

-- ── BÍCEPS ─────────────────────────────────────────────────
('Rosca Direta com Barra', 'Bíceps', 'Barra', ARRAY['bíceps', 'bíceps braquial', 'rosca', 'flexão de cotovelo', 'barra', 'curl'], 'Clássico para desenvolvimento do bíceps.'),
('Rosca Alternada com Halteres', 'Bíceps', 'Halteres', ARRAY['bíceps', 'rosca', 'alternada', 'halteres', 'curl'], 'Permite supinação completa.'),
('Rosca Martelo', 'Bíceps', 'Halteres', ARRAY['bíceps', 'braquial', 'braquiorradial', 'martelo', 'halteres', 'hammer curl'], 'Foco no braquial e braquiorradial.'),
('Rosca Concentrada', 'Bíceps', 'Halteres', ARRAY['bíceps', 'isolamento', 'concentrada', 'halteres', 'pico'], 'Máximo isolamento do bíceps.'),
('Rosca Scott', 'Bíceps', 'Barra/Halteres', ARRAY['bíceps', 'scott', 'isolamento', 'preacher curl', 'porção longa'], 'Elimina compensações.'),

-- ── TRÍCEPS ────────────────────────────────────────────────
('Tríceps Testa com Barra', 'Tríceps', 'Barra', ARRAY['tríceps', 'skull crusher', 'testa', 'extensão', 'barra', 'esmaga crânio'], 'Também chamado skull crusher ou esmaga crânio.'),
('Tríceps Pulley (Polia)', 'Tríceps', 'Polia', ARRAY['tríceps', 'pulley', 'polia', 'extensão', 'cabos', 'isolamento'], 'Isolamento do tríceps na polia.'),
('Mergulho entre Bancos', 'Tríceps', 'Banco', ARRAY['tríceps', 'fundos', 'mergulho', 'dip', 'peso corporal', 'banco'], 'Exercício funcional com peso corporal.'),
('Tríceps Coice', 'Tríceps', 'Halteres', ARRAY['tríceps', 'coice', 'halteres', 'kickback', 'isolamento'], 'Finalização do tríceps.'),
('Supino Fechado', 'Tríceps', 'Barra', ARRAY['tríceps', 'supino fechado', 'barra', 'empurrar', 'close grip bench'], 'Composto com foco em tríceps.'),

-- ── QUADRÍCEPS / PERNAS ────────────────────────────────────
('Agachamento Livre', 'Quadríceps', 'Barra', ARRAY['pernas', 'quadríceps', 'glúteo', 'agachamento', 'squat', 'composto', 'funcional'], 'Exercício rainha para membros inferiores.'),
('Leg Press 45°', 'Quadríceps', 'Máquina', ARRAY['pernas', 'quadríceps', 'glúteo', 'leg press', 'máquina', 'empurrar'], 'Alternativa ao agachamento com menos compressão lombar.'),
('Cadeira Extensora', 'Quadríceps', 'Máquina', ARRAY['quadríceps', 'extensora', 'máquina', 'isolamento', 'joelho'], 'Isolamento do quadríceps.'),
('Afundo / Avanço', 'Quadríceps', 'Halteres', ARRAY['pernas', 'quadríceps', 'glúteo', 'afundo', 'avanço', 'lunge', 'unilateral', 'funcional'], 'Exercício unilateral para equilíbrio.'),
('Hack Squat', 'Quadríceps', 'Máquina', ARRAY['pernas', 'quadríceps', 'agachamento', 'hack squat', 'máquina'], 'Foco na porção inferior do quadríceps.'),

-- ── POSTERIOR / ISQUIOTIBIAIS / GLÚTEOS ────────────────────
('Mesa Flexora', 'Isquiotibiais', 'Máquina', ARRAY['isquiotibial', 'posterior', 'mesa flexora', 'máquina', 'flexão de joelho', 'leg curl'], 'Isolamento dos isquiotibiais.'),
('Stiff com Halteres', 'Isquiotibiais', 'Halteres', ARRAY['isquiotibial', 'glúteo', 'stiff', 'halteres', 'hip hinge', 'posterior'], 'Posterior de coxa e glúteos.'),
('Agachamento Sumô', 'Glúteos', 'Halteres', ARRAY['glúteo', 'pernas', 'sumô', 'agachamento', 'adutores', 'halteres'], 'Foco em glúteos e adutores.'),
('Hip Thrust', 'Glúteos', 'Barra', ARRAY['glúteo', 'hip thrust', 'barra', 'extensão de quadril', 'glúteo máximo'], 'Melhor exercício para ativação do glúteo máximo.'),
('Glúteo 4 Apoios (Mula Coice)', 'Glúteos', 'Peso Corporal', ARRAY['glúteo', 'funcional', 'mula', 'coice', 'peso corporal', 'isolamento'], 'Isolamento do glúteo.'),
('Cadeira Abdutora', 'Glúteos', 'Máquina', ARRAY['glúteo', 'abdutores', 'máquina', 'isolamento', 'abdução de quadril'], 'Abdutores e glúteo médio.'),

-- ── PANTURRILHA ────────────────────────────────────────────
('Panturrilha em Pé (Smith ou Livre)', 'Panturrilha', 'Barra/Máquina', ARRAY['panturrilha', 'calf raise', 'em pé', 'gastrocnêmio', 'sóleo'], 'Gastrocnêmio com joelho estendido.'),
('Panturrilha Sentado', 'Panturrilha', 'Máquina', ARRAY['panturrilha', 'calf raise', 'sentado', 'sóleo', 'máquina'], 'Foco no sóleo com joelho fletido.'),

-- ── ABDOMEN ────────────────────────────────────────────────
('Abdominal Crunch', 'Abdomen', 'Peso Corporal', ARRAY['abdomen', 'abdominal', 'crunch', 'reto abdominal', 'flexão de tronco', 'sem equipamento'], 'Clássico para o reto abdominal.'),
('Prancha', 'Abdomen', 'Peso Corporal', ARRAY['abdomen', 'core', 'prancha', 'plank', 'isométrico', 'estabilidade', 'sem equipamento'], 'Fortalecimento do core completo.'),
('Elevação de Pernas', 'Abdomen', 'Barra Fixa', ARRAY['abdomen', 'core', 'abdomen inferior', 'elevação de pernas', 'hanging leg raise', 'flexão de quadril'], 'Porção inferior do abdômen.'),
('Abdominal com Roda', 'Abdomen', 'Roda Abdominal', ARRAY['abdomen', 'core', 'abdominal', 'roda', 'ab wheel', 'rollout'], 'Exercício avançado de core.'),
('Abdominal Oblíquo', 'Abdomen', 'Peso Corporal', ARRAY['abdomen', 'oblíquos', 'lateral', 'tronco', 'rotação', 'sem equipamento', 'envolva braço e perna'], 'Trabalha oblíquos com rotação de tronco.'),
('Mountain Climber', 'Abdomen', 'Peso Corporal', ARRAY['abdomen', 'core', 'funcional', 'cardio', 'escalador', 'mountain climber', 'envolva braço e perna', 'sem equipamento'], 'Cardio + core simultâneos.'),

-- ── CARDIO / FUNCIONAL ─────────────────────────────────────
('Burpee', 'Full Body', 'Peso Corporal', ARRAY['cardio', 'funcional', 'full body', 'burpee', 'hiit', 'sem equipamento', 'caloria'], 'Alta queima calórica e condicionamento.'),
('Polichinelo (Jumping Jack)', 'Full Body', 'Peso Corporal', ARRAY['cardio', 'aquecimento', 'polichinelo', 'jumping jack', 'sem equipamento'], 'Aquecimento e cardio leve.'),
('Agachamento com Salto', 'Full Body', 'Peso Corporal', ARRAY['pernas', 'cardio', 'funcional', 'salto', 'jump squat', 'hiit', 'sem equipamento'], 'Pliométrico para potência.'),
('Swing com Kettlebell', 'Full Body', 'Kettlebell', ARRAY['full body', 'posterior', 'glúteo', 'kettlebell', 'swing', 'cardio', 'funcional', 'hip hinge'], 'Movimento balístico de alta eficiência.'),
('Corrida na Esteira', 'Cardio', 'Esteira', ARRAY['cardio', 'corrida', 'esteira', 'aeróbico', 'resistência'], 'Cardio aeróbico tradicional.'),
('Bicicleta Ergométrica', 'Cardio', 'Bicicleta', ARRAY['cardio', 'bicicleta', 'ciclismo', 'aeróbico', 'joelho', 'baixo impacto'], 'Cardio de baixo impacto.'),
('Corda Naval (Battle Rope)', 'Full Body', 'Corda Naval', ARRAY['full body', 'cardio', 'corda', 'battle rope', 'ombros', 'core', 'hiit'], 'Alta intensidade para ombros e cardio.');
