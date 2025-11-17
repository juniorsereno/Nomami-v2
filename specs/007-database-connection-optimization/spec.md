# Spec: Otimização da Conexão com Banco de Dados Neon

**Autor**: Kilo Code
**Data**: 2025-11-16
**Status**: Aprovado

## 1. Resumo

Esta especificação detalha o plano técnico para otimizar a conexão com o banco de dados Neon no projeto Nomami App. O objetivo é reduzir a latência, melhorar a performance e garantir a escalabilidade da aplicação, migrando da abordagem atual de conexão por requisição para um modelo centralizado com connection pooling.

## 2. Problema

A implementação atual utiliza o driver `@neondatabase/serverless` para criar uma nova conexão com o banco de dados a cada requisição de API. Essa abordagem causa os seguintes problemas:

- **Alta Latência**: Cada nova conexão incorre em sobrecarga de handshake TLS e potencial "cold start" da computação do Neon, adicionando 100-300ms a cada consulta.
- **Escalabilidade Limitada**: O número de conexões ativas pode exceder rapidamente os limites do plano do Neon, levando a falhas sob alta carga.
- **Ineficiência de Recursos**: Não há reaproveitamento de conexões, resultando em consumo desnecessário de recursos tanto na aplicação quanto no banco de dados.
- **Código Duplicado**: A lógica de conexão está replicada em `nomami-app/lib/db.ts` e `nomami-app/lib/lib/db.ts`.

## 3. Solução Proposta

A solução consiste em três otimizações principais:

### 3.1. Centralização e Connection Pooling

Substituiremos a função `neon()` por uma instância de `Pool` do `@neondatabase/serverless`. Isso criará um pool de conexões persistentes que serão reutilizadas entre as requisições, eliminando a sobrecarga de criação de novas conexões.

**Implementação:**

1.  **Criar um novo módulo de banco de dados**: `nomami-app/lib/db-pool.ts`.
2.  **Instanciar o Pool**:
    ```typescript
    import { Pool } from '@neondatabase/serverless';
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    export default pool;
    ```
3.  **Refatorar o código existente**: Todas as chamadas `sql` serão substituídas por chamadas ao `pool`.
    ```typescript
    // Exemplo de uso em uma API route
    import pool from '@/lib/db-pool';
    
    // ...
    const result = await pool.sql`SELECT * FROM subscribers`;
    // ...
    ```
4.  **Remover arquivos duplicados**: Unificar a lógica de conexão e remover `nomami-app/lib/lib/db.ts`.

### 3.2. Migração para Server Components e Data Fetching Centralizado

Para reduzir o "client-side fetching" e aproveitar o Server-Side Rendering (SSR) do Next.js, vamos:

1.  **Refatorar Páginas Críticas**: Converter as páginas `Dashboard`, `Subscribers` e `Partners` de `"use client"` para Server Components sempre que possível.
2.  **Funções de Acesso a Dados**: Criar funções `async` em `nomami-app/lib/queries.ts` para buscar dados no servidor.
    ```typescript
    // nomami-app/lib/queries.ts
    import pool from './db-pool';
    
    export async function getLatestSubscribers(limit = 10) {
      return await pool.sql`SELECT * FROM subscribers ORDER BY start_date DESC LIMIT ${limit}`;
    }
    ```
3.  **Uso nas Páginas**:
    ```typescript
    // nomami-app/app/dashboard/page.tsx
    import { getLatestSubscribers } from '@/lib/queries';
    
    export default async function DashboardPage() {
      const latestSubscribers = await getLatestSubscribers();
      // ... renderizar a página com os dados
    }
    ```

### 3.3. Adição de Variável de Ambiente para Pooling

Adicionaremos uma variável de ambiente para a string de conexão otimizada para pooling.

1.  **Atualizar `.env.local` e `.env.example`**:
    ```
    # .env
    DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
    DATABASE_POOL_URL="postgresql://user:password@host/dbname?sslmode=require&pg_bouncer=true"
    ```
2.  **Usar a URL de Pool**: O `db-pool.ts` utilizará `process.env.DATABASE_POOL_URL`.

## 4. Critérios de Aceitação

- O connection pooling está implementado e ativo.
- O tempo de resposta das APIs que consultam o banco de dados é reduzido em pelo menos 50%.
- As páginas de Dashboard, Assinantes e Parceiros carregam dados inicialmente no servidor.
- O código de conexão com o banco de dados está centralizado em um único módulo.
- A aplicação continua funcionando corretamente em ambiente de desenvolvimento e produção.

## 5. Riscos e Mitigação

- **Risco**: Configuração incorreta do pool pode levar a vazamento de conexões.
  - **Mitigação**: Seguir a documentação oficial do Neon e realizar testes de carga para validar a estabilidade do pool.
- **Risco**: A refatoração para Server Components pode quebrar interações do lado do cliente.
  - **Mitigação**: Isolar a lógica de busca de dados e passar os dados como props para componentes cliente menores, mantendo a interatividade onde for necessário.