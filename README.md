# treinamento-pro

Plataforma SaaS para personal trainers e seus alunos, com módulos de treinamento guiado, nutrição, biometria, readiness e análise de vídeo.

---

## Arquitetura

```
treinamento-pro/
├── apps/
│   ├── api/          # Fastify 5 + TypeScript — serverless no Vercel
│   └── web/          # Next.js 15 App Router — deploy no Vercel
├── packages/
│   └── shared/       # Tipos TypeScript compartilhados
└── supabase/
    └── migrations/   # Migrations PostgreSQL (Supabase)
```

Monorepo gerenciado com **pnpm workspaces**.

---

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Supabase CLI
- Conta Vercel (deploy)

---

## Configuração local

```bash
# 1. Instalar dependências
pnpm install

# 2. Variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Aplicar migrations
supabase db push

# 4. Iniciar em desenvolvimento
pnpm dev          # inicia api (porta 3001) + web (porta 3000)
```

---

## Scripts úteis

| Comando                  | Descrição                            |
| ------------------------ | ------------------------------------ |
| `pnpm dev`               | Inicia API + Web em modo dev         |
| `pnpm type-check`        | Type-check em todos os pacotes       |
| `pnpm --filter api test` | Testes de integração da API (Vitest) |
| `pnpm --filter web e2e`  | Testes e2e do Web (Playwright)       |
| `supabase db push`       | Aplica migrations no banco           |

---

## Módulos

### Trainer (treinador)

- **Dashboard** — visão geral do esquadrão com alertas e métricas
- **Aluno** — ficha individual com histórico de treinos, biometria e readiness
- **Protocolos** — criação de templates de séries, vinculação a alunos e acompanhamento de resultados
- **Biblioteca de exercícios** — CRUD com upload de vídeo/imagem e importação via CSV
- **Alertas** — notificações de vencimento de protocolos (D-3 e D0)
- **Settings** — convites e gerenciamento da biblioteca de exercícios

### Aluno (agente)

- **Hoje** — resumo diário de treino, hidratação e refeições
- **Treinamento** — execução guiada de séries com cronômetro de descanso, registro de carga/reps/esforço e avanço automático
- **Evolução** — gráficos de biometria e readiness
- **Perfil** — dados pessoais e metas

---

## Deploy

A API roda como serverless function no Vercel (`apps/api/api/index.ts`).  
O Web é deployado via Next.js no Vercel.

Variáveis de ambiente necessárias na Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`

---

## Licença

Privado — todos os direitos reservados.
