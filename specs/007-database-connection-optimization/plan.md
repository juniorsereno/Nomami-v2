# Plano de Implementação: Otimização da Conexão com Banco de Dados

Este plano descreve as etapas para implementar a otimização da conexão com o banco de dados Neon, conforme detalhado na especificação técnica.

## Workflow de Desenvolvimento

O trabalho será organizado em um workflow claro, seguindo as melhores práticas de desenvolvimento de software, com foco em segurança, testes e entrega contínua.

### **Etapa 1: Setup Inicial e Prova de Conceito (PoC)**

*   **Branch**: `feature/db-connection-pooling`
*   **Objetivo**: Validar a implementação do connection pooling em um ambiente controlado.
*   **Tarefas**:
    1.  **Configuração do Ambiente**:
        *   Adicionar a variável `DATABASE_POOL_URL` ao `.env.local` e documentar no `.env.example`.
    2.  **Implementação do Pool**:
        *   Criar `nomami-app/lib/db-pool.ts` com a configuração do `Pool` do `@neondatabase/serverless`.
    3.  **Prova de Conceito**:
        *   Refatorar um único endpoint de API (ex: `/api/metrics`) para usar o `db-pool`.
        *   Realizar testes de carga focados neste endpoint para comparar a latência antes e depois da mudança.
        *   Validar no console do Neon que as conexões estão sendo reutilizadas.

### **Etapa 2: Refatoração Gradual da Camada de Dados**

*   **Branch**: Continuar em `feature/db-connection-pooling`
*   **Objetivo**: Aplicar o novo padrão de conexão a toda a aplicação de forma segura.
*   **Tarefas**:
    1.  **Refatoração de API Routes**:
        *   Converter todos os endpoints de API restantes para utilizar o `db-pool`.
        *   Realizar testes unitários ou de integração para cada endpoint refatorado.
    2.  **Centralização de Lógica**:
        *   Remover os arquivos de conexão antigos (`nomami-app/lib/db.ts`, `nomami-app/lib/lib/db.ts`) e corrigir todas as importações.
    3.  **Code Review**:
        *   Submeter um Pull Request para revisão da implementação do pooling.

### **Etapa 3: Otimização do Frontend com Server Components**

*   **Branch**: `feature/server-components-fetch` (a partir de `feature/db-connection-pooling`)
*   **Objetivo**: Melhorar a performance de renderização inicial das páginas, aproveitando o SSR do Next.js.
*   **Tarefas**:
    1.  **Centralizar Queries**:
        *   Criar `nomami-app/lib/queries.ts` para abrigar as funções de busca de dados do lado do servidor.
    2.  **Refatoração de Páginas**:
        *   Converter a página `/dashboard` para um Server Component, buscando dados através de `queries.ts`.
        *   Repetir o processo para as páginas `/subscribers` e `/partners`.
        *   Garantir que a interatividade seja mantida, extraindo componentes cliente (`"use client"`) menores quando necessário.
    3.  **Code Review**:
        *   Submeter um Pull Request para revisão da refatoração do frontend.

### **Etapa 4: Testes, Validação e Deploy**

*   **Branch**: `release/v1.1-db-optimization` (merge de `feature/server-components-fetch`)
*   **Objetivo**: Garantir a estabilidade da aplicação antes e depois do lançamento em produção.
*   **Tarefas**:
    1.  **Testes de Regressão**:
        *   Executar um ciclo completo de testes manuais e automatizados (se houver) em um ambiente de `staging`.
    2.  **Testes de Performance**:
        *   Realizar testes de carga na aplicação completa no ambiente de `staging`.
        *   Monitorar métricas de performance (tempo de resposta, uso de CPU/memória) e o número de conexões no Neon.
    3.  **Plano de Rollout**:
        *   **Merge**: Fazer o merge da branch de release para a `main`.
        *   **Deploy**: Realizar o deploy para produção.
        *   **Monitoramento Pós-Deploy**: Acompanhar ativamente os logs, dashboards de monitoramento (Sentry, Vercel Analytics) e o console do Neon nas primeiras horas após o deploy para detectar anomalias.

## Cronograma Estimado

-   **Total**: 5-7 dias