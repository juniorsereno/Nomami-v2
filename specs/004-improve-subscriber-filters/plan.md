# Plano de Implementação: Melhorar a Manipulação de Assinantes

**Feature Branch**: `004-improve-subscriber-filters`
**Spec**: [`spec.md`](./spec.md)

## Visão Geral

Este plano detalha os passos técnicos para adicionar funcionalidades de pesquisa e filtro na página de assinantes, com base na arquitetura existente. A implementação será dividida em Frontend, modificando a página `subscribers/page.tsx` para incluir os controles de filtro e gerenciar o estado, e Backend, atualizando a API em `api/subscribers/list/route.ts` para processar os novos parâmetros de consulta.

---

## Etapa 1: Frontend (UI da Página de Assinantes)

### Tarefa 1.1: Adicionar Componentes de Filtro na UI

-   **Arquivo**: `nomami-app/app/subscribers/page.tsx`
-   **Descrição**: Inserir os componentes de UI para pesquisa e filtros na barra de ferramentas acima da `DataTable` existente.
-   **Detalhes**:
    -   No `div` que envolve a `DataTable`, adicionar um `div` flexível (`flex gap-2`) para conter os filtros.
    -   **Campo de Pesquisa**: Adicionar um componente `Input` do shadcn/ui com um placeholder "Buscar por nome ou telefone...".
    -   **Filtro de Plano**: Adicionar um `Select` do shadcn/ui com as opções "Todos os Planos", "Mensal" e "Anual".
    -   **Filtro de Data**: Adicionar um `Select` do shadcn/ui com as opções "Qualquer data", "Hoje", "Últimos 7 dias", "Últimos 15 dias" e "Últimos 30 dias".

### Tarefa 1.2: Refatorar o Gerenciamento de Estado e a Busca de Dados

-   **Arquivo**: `nomami-app/app/subscribers/page.tsx`
-   **Descrição**: Modificar a lógica de busca de dados para reagir às mudanças nos filtros e otimizar as chamadas de API.
-   **Detalhes**:
    1.  **Criar Estados para Filtros**:
        -   `const [searchTerm, setSearchTerm] = useState('');`
        -   `const [plan, setPlan] = useState('all');`
        -   `const [dateRange, setDateRange] = useState('all');`
    2.  **Implementar Debounce na Pesquisa**: Utilizar um hook customizado (`useDebounce`) ou uma biblioteca como `use-debounce` para o `searchTerm`, evitando chamadas de API a cada tecla digitada. O valor *debounced* será usado no `useEffect`.
    3.  **Modificar `useEffect`**:
        -   A dependência do `useEffect` que busca os dados dos assinantes (`fetchData`) será alterada de `[]` para `[debouncedSearchTerm, plan, dateRange]`.
        -   Dentro da função `fetchData`, construir a URL da API dinamicamente com os parâmetros de consulta:
            ```javascript
            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (plan !== 'all') params.append('plan', plan);
            if (dateRange !== 'all') params.append('dateRange', dateRange);
            
            const listResponse = await fetch(`/api/subscribers/list?${params.toString()}`);
            ```
    4.  **Conectar Componentes**: Ligar os eventos `onValueChange` (para `Select`) e `onChange` (para `Input`) dos componentes de UI para atualizarem seus respectivos estados.

---

## Etapa 2: Backend (API de Listagem de Assinantes)

### Tarefa 2.1: Modificar a Rota da API para Processar Parâmetros

-   **Arquivo**: `nomami-app/app/api/subscribers/list/route.ts`
-   **Descrição**: Atualizar a função `GET` para ler os parâmetros de consulta da URL e construir uma query SQL dinâmica e segura.
-   **Detalhes**:
    -   Alterar a assinatura da função para `export async function GET(request: Request)`.
    -   Extrair os parâmetros da URL:
        ```javascript
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const plan = searchParams.get('plan');
        const dateRange = searchParams.get('dateRange');
        ```

### Tarefa 2.2: Construir a Query SQL Dinâmica

-   **Arquivo**: `nomami-app/app/api/subscribers/list/route.ts`
-   **Descrição**: Modificar a consulta SQL para incluir cláusulas `WHERE` condicionais com base nos parâmetros recebidos, utilizando a biblioteca `sql` para evitar injeção de SQL.
-   **Detalhes**:
    -   A query base será `SELECT id, name, phone, email, ... FROM subscribers`.
    -   Adicionar cláusulas `WHERE` dinamicamente. Exemplo de lógica com a biblioteca `sql`:
        ```javascript
        let query = sql`
          SELECT id, name, phone, email, cpf, plan_type, start_date, next_due_date, status
          FROM subscribers
        `;
        
        const conditions = [];
        if (search) {
          conditions.push(sql`(name ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'})`);
        }
        if (plan) {
          conditions.push(sql`plan_type = ${plan}`);
        }
        if (dateRange) {
          // Lógica para calcular a data de início com base no dateRange
          // Ex: const startDate = ...;
          conditions.push(sql`start_date >= ${startDate}`);
        }

        if (conditions.length > 0) {
          query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
        }

        query = sql`${query} ORDER BY name ASC`;

        const subscribers = await query;
        ```
    -   Implementar a lógica para converter `dateRange` (ex: "7d", "15d") em uma data de início válida para a consulta SQL.