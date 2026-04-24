# Changelog

Todas as mudanças relevantes deste projeto estão documentadas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.3.0] — 2026-04-24

### Adicionado

#### Frontend — Trainer

- **Página Exercícios** (`/trainer/exercicios`): nova rota dedicada acessível pelo menu lateral com dois botões de ação no topo direito:
  - Modal **Cadastrar Exercício**: campos Nome, Grupo muscular, Equipamento, Tags, Descrição, upload de vídeo/gif e imagem (ao editar), importação CSV em massa
  - Modal **Cadastrar Série**: campo Nome, seleção múltipla de exercícios com Repetições e Descanso por item
  - Listagem de exercícios em grid com preview de vídeo (play no hover), botões **Editar** e **Excluir**
  - Listagem de séries com exercícios expandidos e botão **Excluir**
- **Menu Exercícios** no `TrainerLayout` (sidebar desktop e top-bar mobile), posicionado entre Esquadrão e Alertas
- **Botão "Selecionar Séries"** na página de aluno (`/trainer/aluno/[id]`): abre modal com:
  - Dropdown de todas as séries cadastradas pelo treinador
  - Ao selecionar uma série, exibe os exercícios com campos editáveis de **Repetições** e **Tempo de descanso** (overrides por aluno)
  - Campo de data de validade
  - Submissão via `POST /protocolos/treinamento/alunos/:id/vinculos`

#### Testes

- Novo teste e2e `trainer exercicios page renders and opens modals`: verifica listagem, abertura do modal de Cadastrar Exercício e do modal de Cadastrar Série

---

## [0.2.0] — 2026-04-24

### Adicionado

#### Domínio de Treinamento (backend)

- Tabelas novas em `001_schema.sql`: `exercicios`, `series_templates`, `series_template_exercicios`, `aluno_series_vinculos`, `aluno_series_vinculo_exercicios`, `treino_execucoes`, `treino_execucao_itens`, `alertas_treinador`
- Políticas RLS em `002_rls.sql` para isolamento total entre treinador e aluno
- Endpoint `GET /exercicios` — listagem e busca full-text (`?q=`)
- Endpoint `POST /exercicios` — criação com nome normalizado para upsert
- Endpoint `PUT /exercicios/:id` — atualização
- Endpoint `DELETE /exercicios/:id` — remoção
- Endpoint `POST /exercicios/:id/media?tipo=video|imagem` — upload multipart para Supabase Storage
- Endpoint `POST /exercicios/import-csv` — importação/upsert em lote via CSV
- Endpoint `POST /protocolos/treinamento/templates` — treinador cria template de série com exercícios
- Endpoint `GET /protocolos/treinamento/templates` — lista templates do treinador
- Endpoint `POST /protocolos/treinamento/alunos/:alunoId/vinculos` — vincula template a aluno com overrides e validade
- Endpoint `GET /protocolos/treinamento/me/ativos` — aluno consulta séries ativas
- Endpoint `POST /protocolos/treinamento/execucoes/start` — aluno inicia sessão de execução guiada
- Endpoint `PUT /protocolos/treinamento/execucoes/:id/itens/:itemId` — aluno registra resultado de set
- Endpoint `POST /protocolos/treinamento/execucoes/:id/finalizar` — aluno finaliza sessão
- Endpoint `GET /protocolos/treinamento/aluno/:alunoId/resultados` — treinador lê histórico do aluno
- Endpoint `GET /protocolos/treinamento/alertas-vencimento` — alertas de vencimento D-3 e D0

#### Frontend — Trainer

- Página **Settings**: biblioteca de exercícios com criação, remoção, upload de mídia por exercício e importação CSV
- Página **Protocolo `[id]`**: visualização e gestão de templates de séries do aluno, incluindo criação de vinculação com data de validade e overrides por exercício
- Página **Aluno `[id]`**: histórico de execuções e resultados de treino do aluno
- Página **Dashboard**: integração com novos dados de esquadrão e alertas de treinamento
- Página **Alertas**: exibição de alertas de vencimento de protocolos

#### Frontend — Aluno

- Página **Treinamento** (ex-Protocolo): execução guiada de séries com:
  - Lista de séries ativas com data de validade
  - Botão "Iniciar execução" por série
  - Player de execução: exercício atual, sets planejados, campos de carga/reps/esforço percebido
  - Cronômetro de descanso com avanço automático e bipe de áudio ao zerar
  - Botões com `aria-label` para acessibilidade ("Iniciar descanso", "Avançar exercício")

#### API Client & Tipos

- Novos métodos em `apps/web/lib/api.ts` para todos os endpoints de treinamento
- Novos tipos em `packages/shared/src/types.ts`: `ExercicioBase`, `SeriesTemplate`, `AlunoSeriesVinculo`, `TreinoExecucao`, `TreinoExecucaoItem`, `AlertaTreinador`

#### Testes

- Testes de integração Vitest (`treinamento.integration.test.ts`): CRUD de exercícios + CSV e fluxo completo template→vínculo→execução→resultados
- Testes e2e Playwright: `trainer-flow.spec.ts` (dashboard + alertas) e `aluno-treinamento.spec.ts` (iniciar treino + contador de descanso)
- Configuração Playwright (`playwright.config.ts`) com projetos Desktop Chrome e Mobile Pixel 7

### Corrigido

- Seletores Playwright usando `getByRole` em vez de `getByText` para evitar violações de modo estrito
- Ordem de registro de rotas mock no Playwright (LIFO) para que `/execucoes/start` não seja interceptado pelo catch-all
- `aria-label` adicionado aos botões de ação do player de treinamento

---

## [0.1.0] — 2026-04-15

### Adicionado

- Estrutura inicial do monorepo (pnpm workspaces)
- API Fastify com módulos: auth, perfil, saúde, biometria, refeições, hidratação, readiness, suplementação, treinos, dashboard, protocolos
- Web Next.js 15 com layouts de app (aluno) e trainer, autenticação, páginas Hoje/Evolução/Perfil
- Migrations iniciais de schema e RLS
- Deploy configurado no Vercel (API serverless + Next.js)
