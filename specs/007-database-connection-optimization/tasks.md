# Tarefas: Otimização da Conexão com Banco de Dados

Este documento detalha as tarefas acionáveis para a implementação da otimização da conexão com o banco de dados Neon.

## Etapa 1: Setup Inicial e Prova de Conceito (PoC)

-   [ ] **Tarefa 1.1**: Adicionar a variável `DATABASE_POOL_URL` ao arquivo `.env.example`.
-   [ ] **Tarefa 1.2**: Comunicar a equipe para que todos adicionem a `DATABASE_POOL_URL` aos seus arquivos `.env.local`.
-   [ ] **Tarefa 1.3**: Criar o arquivo `nomami-app/lib/db-pool.ts` e implementar a lógica de instanciação do `Pool`.
-   [ ] **Tarefa 1.4**: Refatorar o endpoint `GET /api/metrics` para usar o `db-pool`.
-   [ ] **Tarefa 1.5**: Criar um script de teste de carga (ex: k6) para o endpoint `GET /api/metrics`.
-   [ ] **Tarefa 1.6**: Executar o teste de carga para estabelecer uma linha de base de performance antes da mudança.
-   [ ] **Tarefa 1.7**: Executar o teste de carga na nova branch e comparar os resultados para validar a melhoria.
-   [ ] **Tarefa 1.8**: Validar no console do Neon que as conexões estão sendo reutilizadas.

## Etapa 2: Refatoração Gradual da Camada de Dados

-   [ ] **Tarefa 2.1**: Refatorar os endpoints de `/api/subscribers/*` para usar `db-pool`.
-   [ ] **Tarefa 2.2**: Refatorar os endpoints de `/api/partners/*` para usar `db-pool`.
-   [ ] **Tarefa 2.3**: Refatorar os endpoints de `/api/webhook/*` para usar `db-pool`.
-   [ ] **Tarefa 2.4**: Substituir todas as importações dos módulos de DB antigos pelo novo `db-pool`.
-   [ ] **Tarefa 2.5**: Excluir os arquivos `nomami-app/lib/db.ts` and `nomami-app/lib/lib/db.ts`.
-   [ ] **Tarefa 2.6**: Criar e submeter o Pull Request `feat: implement database connection pooling` para revisão.

## Etapa 3: Otimização do Frontend com Server Components

-   [ ] **Tarefa 3.1**: Criar o arquivo `nomami-app/lib/queries.ts`.
-   [ ] **Tarefa 3.2**: Implementar as funções de busca de dados para o Dashboard em `queries.ts`.
-   [ ] **Tarefa 3.3**: Refatorar a página `app/dashboard/page.tsx` para ser um Server Component.
-   [ ] **Tarefa 3.4**: Implementar as funções de busca de dados para a página de Assinantes em `queries.ts`.
-   [ ] **Tarefa 3.5**: Refatorar a página `app/subscribers/page.tsx` para ser um Server Component.
-   [ ] **Tarefa 3.6**: Implementar as funções de busca de dados para a página de Parceiros em `queries.ts`.
-   [ ] **Tarefa 3.7**: Refatorar a página `app/partners/page.tsx` para ser um Server Component.
-   [ ] **Tarefa 3.8**: Criar e submeter o Pull Request `feat: refactor pages to use server-side data fetching` para revisão.

## Etapa 4: Testes, Validação e Deploy

-   [ ] **Tarefa 4.1**: Fazer o merge das branches de feature em uma branch de `release`.
-   [ ] **Tarefa 4.2**: Realizar o deploy da branch de `release` para o ambiente de `staging`.
-   [ ] **Tarefa 4.3**: Executar o plano de testes de regressão em `staging`.
-   [ ] **Tarefa 4.4**: Executar os testes de carga completos em `staging` e validar os resultados.
-   [ ] **Tarefa 4.5**: Fazer o merge da branch de `release` para a `main`.
-   [ ] **Tarefa 4.6**: Realizar o deploy para produção.
-   [ ] **Tarefa 4.7**: Monitorar ativamente a performance e os logs em produção.