# Tasks: Dashboard de Gestão de Assinaturas

**Input**: Design documents from `/.specify/features/dashboard-gestao-assinaturas/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Testes não foram explicitamente solicitados no `spec.md` para esta fase inicial de design e mockups. As tarefas de teste serão adicionadas em um ciclo de implementação futuro.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Configurar a conexão com o banco de dados Neon em `nomami-app/lib/db.ts`
- [x] T002 [P] Validar e instalar todas as dependências do projeto com `npm install` no diretório `nomami-app/`
- [x] T003 [P] Criar o arquivo `.env.local` em `nomami-app/` com a variável de ambiente `DATABASE_URL` do Neon.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [x] T004 Implementar a lógica de proteção de rotas para redirecionar usuários não autenticados da área do dashboard para a página de login.
- [x] T005 Criar um contexto de autenticação ou um hook (ex: `useAuth`) para gerenciar o estado do usuário (logado/deslogado) na aplicação.

---

## Phase 3: User Story 1 - Acesso Seguro ao Sistema (Priority: P1) 🎯 MVP

**Goal**: Como gestor do clube, eu quero acessar o sistema através de uma tela de login para garantir que apenas usuários autorizados possam ver os dados do negócio.

**Independent Test**: Acessar a rota `/login`, inserir credenciais (mockadas) e verificar o redirecionamento para `/dashboard`. Tentar acessar `/dashboard` diretamente deve redirecionar para `/login`.

### Implementation for User Story 1

- [x] T006 [P] [US1] Criar a estrutura da página de login em `nomami-app/app/(auth)/login/page.tsx`.
- [x] T007 [P] [US1] Implementar o componente de formulário `login-form.tsx` em `nomami-app/components/login-form.tsx` utilizando componentes do shadcn/ui.
- [x] T008 [US1] Implementar a lógica de autenticação (mockada) no lado do cliente dentro do componente `login-form.tsx` que, em caso de sucesso, redireciona para `/dashboard`.

---

## Phase 4: User Story 2 - Visão Geral do Negócio no Dashboard (Priority: P2)

**Goal**: Como gestor do clube, após fazer login, eu quero ver um dashboard com as métricas mais importantes do negócio para tomar decisões rápidas e informadas.

**Independent Test**: Acessar a rota `/dashboard` (após login mockado) e verificar se os cards de métricas e os gráficos são renderizados com dados mockados vindos da API.

### Implementation for User Story 2

- [x] T009 [P] [US2] Criar a API Route em `nomami-app/app/api/metrics/route.ts` para fornecer os dados do dashboard.
- [x] T010 [US2] Implementar a lógica de backend em `nomami-app/app/api/metrics/route.ts` para calcular as seguintes métricas a partir da tabela `subscribers`: Clientes Ativos, Clientes Inativos, MRR e Novos Assinantes no Mês.
- [x] T011 [P] [US2] Criar a estrutura da página do dashboard em `nomami-app/app/dashboard/page.tsx`.
- [x] T012 [P] [US2] Implementar o componente `section-cards.tsx` em `nomami-app/components/section-cards.tsx` para exibir as 4 métricas principais.
- [x] T013 [P] [US2] Implementar um componente de gráfico (ex: `chart-area-interactive.tsx`) em `nomami-app/components/` para exibir o crescimento de clientes e MRR.
- [x] T014 [US2] Integrar os componentes de cards e gráficos na página `nomami-app/app/dashboard/page.tsx`, fazendo a chamada à API de métricas para buscar e exibir os dados.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T015 Adicionar `skeletons` de carregamento do shadcn/ui na página do dashboard enquanto os dados da API são carregados.
- [x] T016 Revisar e refatorar o código para garantir a aderência aos padrões de qualidade.
- [x] T017 [P] Adicionar tratamento de erros para a chamada da API de métricas, exibindo uma mensagem amigável em caso de falha.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P2)**: Depends on User Story 1 for a complete authenticated flow, but can be developed in parallel using a mock authenticated state.
