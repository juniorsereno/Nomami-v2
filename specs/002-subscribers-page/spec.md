# Feature Specification: Página de Assinantes

**Feature Branch**: `002-subscribers-page`  
**Created**: 2025-10-22T14:58:04.455Z
**Status**: Draft  
**Input**: User description: "Execute o workflow para criarmos uma spec para o desenvolvimento de uma nova aba, usando UI Shadcn e Neon DB (já configurado via MCP onde você pode consultar) Quero que você desenvolva a página de Assinantes onde teremos acima card assim como temos nas outras páginas mas com informações sobre quantidade total de assianntes ativos, valor de MMR total somando os planos de cada assinantes, quantidade de assinantes nos ultimos 7 dias, quantidade de assinantes nos ultimos 30 dias. abaixo teremos uma table com uma lista de todos os assinantes, com as informações das colunas que temos no Neon."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Métricas Chave de Assinantes (Priority: P1)

Como administrador, quero ver um resumo das principais métricas de assinantes em destaque na parte superior da página, para que eu possa ter uma visão geral rápida da saúde do negócio.

**Why this priority**: Fornece uma visão imediata e de alto nível sobre o desempenho das assinaturas, essencial para a tomada de decisões rápidas.

**Independent Test**: A página pode ser carregada e os quatro cards de métricas devem exibir valores numéricos. A implementação da tabela de detalhes pode ser feita separadamente.

**Acceptance Scenarios**:

1. **Given** que estou na página de "Assinantes", **When** a página carrega, **Then** devo ver um card exibindo o "Total de Assinantes Ativos".
2. **Given** que estou na página de "Assinantes", **When** a página carrega, **Then** devo ver um card exibindo o "MMR Total" (Receita Mensal Recorrente).
3. **Given** que estou na página de "Assinantes", **When** a página carrega, **Then** devo ver um card exibindo a "Quantidade de Novos Assinantes nos Últimos 7 Dias".
4. **Given** que estou na página de "Assinantes", **When** a página carrega, **Then** devo ver um card exibindo a "Quantidade de Novos Assinantes nos Últimos 30 Dias".

---

### User Story 2 - Listar e Consultar Todos os Assinantes (Priority: P2)

Como administrador, quero ver uma tabela detalhada com a lista de todos os assinantes, para que eu possa consultar informações específicas de cada um.

**Why this priority**: Permite a análise detalhada e a busca por informações individuais, o que é fundamental para o suporte e gerenciamento de clientes.

**Independent Test**: A tabela de assinantes pode ser exibida com dados de exemplo, mesmo que os cards de métricas ainda não estejam funcionais.

**Acceptance Scenarios**:

1. **Given** que estou na página de "Assinantes", **When** a página carrega, **Then** devo ver uma tabela abaixo dos cards de métricas.
2. **Given** que a tabela de assinantes é exibida, **When** eu a inspeciono, **Then** as colunas devem incluir: Nome, Telefone, Email, CPF, Tipo de Plano, Data de Início, Próximo Vencimento e Status.

---

### Edge Cases

- O que acontece quando não há nenhum assinante? A tabela deve exibir uma mensagem "Nenhum assinante encontrado". Os cards devem exibir o valor "0".
- Como o sistema lida com valores monetários para o MMR? Deve ser formatado como moeda local (ex: R$ 1.234,56).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um card com a contagem total de assinantes cujo status é "ativo".
- **FR-002**: O sistema DEVE exibir um card com a soma dos valores dos planos de todos os assinantes ativos (MMR).
- **FR-003**: O sistema DEVE exibir um card com a contagem de novos assinantes cuja data de início ocorreu nos últimos 7 dias.
- **FR-004**: O sistema DEVE exibir um card com a contagem de novos assinantes cuja data de início ocorreu nos últimos 30 dias.
- **FR-005**: O sistema DEVE exibir uma tabela contendo todos os assinantes cadastrados.
- **FR-006**: A tabela de assinantes DEVE conter as seguintes colunas: `name`, `phone`, `email`, `cpf`, `plan_type`, `start_date`, `next_due_date`, `status`.

### Key Entities *(include if feature involves data)*

- **Assinante (Subscriber)**: Representa um cliente com uma assinatura de serviço.
  - **Atributos**: id, nome, telefone, email, cpf, tipo de plano, data de início, próxima data de vencimento, status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: As métricas nos cards devem ser calculadas e exibidas em menos de 3 segundos após o carregamento da página.
- **SC-002**: A lista completa de assinantes na tabela deve ser carregada em menos de 5 segundos para uma base de até 10.000 registros.
- **SC-003**: A precisão dos dados exibidos (métricas e lista) deve ser de 100% em relação à fonte de dados no momento da consulta.