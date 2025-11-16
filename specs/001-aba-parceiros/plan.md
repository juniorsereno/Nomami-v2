# Plano de Implementação: Aba de Parceiros

**Feature**: Aba de Parceiros
**Branch**: `001-aba-parceiros`
**Especificação**: [spec.md](./spec.md)

## Objetivo Técnico

Implementar a nova página de parceiros, exibindo estatísticas e uma lista detalhada. A implementação seguirá os padrões técnicos existentes da aplicação, utilizando Next.js para a estrutura, API Routes para o backend, Neon como banco de dados e componentes `shadcn/ui` para a interface.

## Breakdown de Tarefas

### 1. Backend (API Routes)

- **Tarefa 1.1: Criar Endpoint de Estatísticas de Parceiros**
  - **Arquivo**: `nomami-app/app/api/partners/stats/route.ts`
  - **Descrição**: Criar um endpoint `GET` que retorna um objeto JSON com as contagens de parceiros ativos, inativos e novos (cadastrados nos últimos 30 dias).
  - **Lógica**:
    1. Conectar ao banco de dados Neon.
    2. Executar três queries `COUNT(*)` separadas na tabela `partners` para obter cada métrica.
    3. Retornar os resultados consolidados em um único JSON.

- **Tarefa 1.2: Criar Endpoint da Lista de Parceiros**
  - **Arquivo**: `nomami-app/app/api/partners/list/route.ts`
  - **Descrição**: Criar um endpoint `GET` que retorna a lista completa de parceiros com as colunas definidas na especificação (`company_name`, `cnpj`, `phone`, `status`, `entry_date`).
  - **Lógica**:
    1. Conectar ao banco de dados Neon.
    2. Executar um `SELECT` na tabela `partners` para buscar os campos necessários.
    3. Retornar a lista de parceiros como um array de objetos JSON.

### 2. Frontend (Componentes e Página)

- **Tarefa 2.1: Criar a Página de Parceiros**
  - **Arquivo**: `nomami-app/app/partners/page.tsx`
  - **Descrição**: Criar a nova rota e a estrutura principal da página. Esta página será responsável por buscar os dados dos endpoints da API e renderizar os componentes.
  - **Lógica**:
    1. Utilizar `fetch` (ou um hook customizado, se houver) para chamar os endpoints `/api/partners/stats` e `/api/partners/list`.
    2. Gerenciar os estados de carregamento (`loading`) e erro da página.
    3. Passar os dados recebidos como `props` para os componentes de cards e tabela.

- **Tarefa 2.2: Implementar os Cards de Estatísticas**
  - **Componente**: Reutilizar/Adaptar `nomami-app/components/section-cards.tsx`.
  - **Descrição**: Exibir os dados de estatísticas dos parceiros (ativos, inativos, novos) utilizando o componente de cards existente.
  - **Lógica**: O componente receberá as contagens como `props` e as renderizará nos cards, seguindo o layout `shadcn`.

- **Tarefa 2.3: Implementar a Tabela de Dados de Parceiros**
  - **Componente**: Reutilizar `nomami-app/components/data-table.tsx`.
  - **Descrição**: Utilizar o componente genérico de tabela para exibir a lista de parceiros.
  - **Lógica**:
    1. Criar um arquivo de definição de colunas (ex: `nomami-app/app/partners/columns.tsx`) para a tabela de parceiros, conforme o padrão do `data-table` do `shadcn`.
    2. Passar as definições de colunas e os dados dos parceiros para o componente `DataTable`.

### 3. Integração e Navegação

- **Tarefa 3.1: Adicionar Navegação para a Nova Página**
  - **Arquivo a Modificar**: `nomami-app/components/app-sidebar.tsx` (ou componente similar de navegação).
  - **Descrição**: Adicionar um novo item de menu na barra de navegação lateral ou principal para direcionar o usuário à página `/partners`.