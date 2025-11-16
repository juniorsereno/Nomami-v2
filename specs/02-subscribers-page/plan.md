# Plano de Implementação Técnica: Página de Assinantes

**Feature Branch**: `002-subscribers-page`
**Especificação**: [spec.md](./spec.md)

## 1. Estratégia Geral

A implementação seguirá o padrão existente na aplicação, reaproveitando os componentes `SectionCards` e `DataTable`. Serão criados novos endpoints de API para buscar os dados dos assinantes no banco de dados Neon e uma nova página no Next.js para renderizar a UI.

## 2. Estrutura de Arquivos

### Novos Arquivos

- **Página**: `nomami-app/app/subscribers/page.tsx`
- **Definição de Colunas da Tabela**: `nomami-app/app/subscribers/columns.tsx`
- **Endpoint de Estatísticas**: `nomami-app/app/api/subscribers/stats/route.ts`
- **Endpoint da Lista**: `nomami-app/app/api/subscribers/list/route.ts`

### Arquivos a Modificar

- **Navegação**: `nomami-app/components/app-sidebar.tsx` (para adicionar o link da nova página)

## 3. Detalhes da Implementação

### 3.1. Backend (API Routes)

#### **`GET /api/subscribers/stats`**

- **Responsabilidade**: Calcular e retornar as métricas para os cards.
- **Lógica**:
  1.  **Total de Assinantes Ativos**: `SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`
  2.  **MMR Total**: `SELECT SUM(CASE WHEN plan_type = 'anual' THEN 500.0 / 12.0 WHEN plan_type = 'mensal' THEN 50.0 ELSE 0 END) as total_mrr FROM subscribers WHERE status = 'ativo'`
  3.  **Novos Assinantes (7 dias)**: `SELECT COUNT(*) FROM subscribers WHERE start_date >= current_date - interval '7 days'`
  4.  **Novos Assinantes (30 dias)**: `SELECT COUNT(*) FROM subscribers WHERE start_date >= current_date - interval '30 days'`
- **Retorno (JSON)**:
  ```json
  {
    "activeSubscribers": 123,
    "mrr": 4567.89,
    "newSubscribers7d": 15,
    "newSubscribers30d": 50
  }
  ```

#### **`GET /api/subscribers/list`**

- **Responsabilidade**: Retornar a lista completa de assinantes.
- **Lógica**:
  - `SELECT id, name, phone, email, cpf, plan_type, start_date, next_due_date, status FROM subscribers ORDER BY name ASC`
- **Retorno (JSON)**: Array de objetos de assinantes.

### 3.2. Frontend

#### **`nomami-app/app/subscribers/columns.tsx`**

- **Responsabilidade**: Definir as colunas para o componente `DataTable`, similar ao `partners/columns.tsx`.
- **Colunas**: Nome, Telefone, Email, CPF, Tipo de Plano, Data de Início, Próximo Vencimento, Status.
- A coluna `start_date` e `next_due_date` devem ser formatadas para o padrão `dd/mm/yyyy`.

#### **`nomami-app/app/subscribers/page.tsx`**

- **Responsabilidade**: Orquestrar a busca de dados e a renderização dos componentes.
- **Lógica**:
  1.  Usar `useEffect` para fazer fetch nos dois endpoints (`/api/subscribers/stats` e `/api/subscribers/list`) quando o componente montar.
  2.  Gerenciar estados para `stats`, `subscribers` e `error`.
  3.  Renderizar um estado de carregamento enquanto os dados são buscados.
  4.  Passar os dados de `stats` para o componente `SectionCards`.
  5.  Passar os dados de `subscribers` e as `columns` importadas para o componente `DataTable`.

#### **`nomami-app/components/app-sidebar.tsx`**

- Adicionar um novo item de navegação para "Assinantes" com o link `/subscribers`.

## 4. Plano de Ação (TODO)

1.  [ ] **API**: Criar o arquivo `nomami-app/app/api/subscribers/stats/route.ts` e implementar a lógica para buscar as métricas.
2.  [ ] **API**: Criar o arquivo `nomami-app/app/api/subscribers/list/route.ts` e implementar a lógica para buscar a lista de assinantes.
3.  [ ] **Frontend**: Criar o arquivo `nomami-app/app/subscribers/columns.tsx` com a definição das colunas da tabela.
4.  [ ] **Frontend**: Criar a estrutura principal da página em `nomami-app/app/subscribers/page.tsx`.
5.  [ ] **Frontend**: Implementar a lógica de `fetch` de dados na página, incluindo estados de carregamento e erro.
6.  [ ] **Frontend**: Integrar e renderizar o componente `SectionCards` com os dados das estatísticas.
7.  [ ] **Frontend**: Integrar e renderizar o componente `DataTable` com a lista de assinantes.
8.  [ ] **Navegação**: Adicionar o link "Assinantes" no `app-sidebar.tsx`.
9.  [ ] **Verificação**: A lógica de cálculo do MMR foi confirmada e será reutilizada da API de métricas existente.