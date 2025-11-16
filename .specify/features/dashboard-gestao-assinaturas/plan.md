# Implementation Plan: Dashboard de Gestão de Assinaturas

**Branch**: `dashboard-gestao-assinaturas` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `spec.md`

## Summary

O objetivo é desenvolver o backend e conectar o frontend Next.js para o dashboard de gestão do clube de assinatura NoMami. A aplicação exibirá métricas chave como clientes ativos/inativos, MRR e novos assinantes. A autenticação do gestor será gerenciada pelo Neon Auth. O backend será responsável por calcular as métricas a partir de um banco de dados PostgreSQL no Neon.

## Technical Context

**Language/Version**: TypeScript (Next.js)
**Primary Dependencies**: Next.js, shadcn/ui, Neon Serverless Driver (`@neondatabase/serverless`)
**Storage**: PostgreSQL (Neon)
**Testing**: Jest, React Testing Library
**Target Platform**: Web
**Project Type**: Web Application (Frontend + Backend via API Routes)
**Performance Goals**: Carregamento do dashboard em menos de 3 segundos.
**Constraints**: Manter o número de dependências mínimo.
**Scale/Scope**: Inicialmente para um único gestor, com capacidade para escalar para milhares de assinantes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. High-Quality Code Standards**: Sim, o plano inclui code reviews e aderência a guias de estilo.
- **II. Rigorous Testing Discipline**: Sim, testes unitários e de integração estão no escopo.
- **III. Consistent User Experience**: Sim, o design seguirá os padrões do mockup já criado.
- **IV. Standardized UI with shadcn/ui**: Sim, shadcn/ui é a base do frontend.
- **V. Performance and Efficiency**: Sim, metas de performance foram definidas.

## Project Structure

### Documentation (this feature)

```
.specify/features/dashboard-gestao-assinaturas/
├── plan.md              # This file
├── spec.md              # A especificação funcional
└── checklists/
    └── requirements.md  # O checklist de qualidade
```

### Source Code (repository root)

```
nomami-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── api/
│   │       └── metrics/route.ts  # API para buscar os dados do dashboard
│   ├── components/
│   │   ├── app-sidebar.tsx
│   │   ├── login-form.tsx
│   │   └── section-cards.tsx
│   ├── lib/
│   │   ├── db.ts               # Configuração da conexão com o Neon DB
│   │   └── utils.ts
│   └── models/                 # (Opcional) Definições de tipos de dados
├── tests/
│   ├── integration/
│   │   └── api.test.ts
│   └── unit/
│       └── metrics.test.ts
└── package.json
```

**Structure Decision**: A estrutura segue o padrão de uma aplicação Next.js com o App Router, utilizando API Routes para o backend. O código-fonte ficará dentro do diretório `nomami-app/src/`.

## Data Model

As seguintes tabelas foram criadas no banco de dados Neon:

### Tabela: `subscribers`

Armazena os dados dos assinantes (clientes).

| Coluna | Tipo de Dado | Descrição |
|---|---|---|
| `id` | `UUID` (PK) | Identificador único do assinante. |
| `name` | `VARCHAR(255)` | Nome do cliente. |
| `phone` | `VARCHAR(20)` | Telefone do cliente. |
| `email` | `VARCHAR(255)` | Email do cliente. |
| `cpf` | `VARCHAR(14)` | CPF do cliente. |
| `plan_type` | `VARCHAR(20)` | Tipo de plano (mensal, semestral, anual). |
| `start_date` | `TIMESTAMP` | Data de entrada do cliente. |
| `next_due_date` | `TIMESTAMP` | Data de vencimento da próxima fatura. |
| `status` | `VARCHAR(20)` | Status do cliente (ativo, inativo). |

### Tabela: `partners`

Armazena informações sobre os parceiros do clube.

| Coluna | Tipo de Dado | Descrição |
|---|---|---|
| `id` | `UUID` (PK) | Identificador único do parceiro. |
| `company_name` | `VARCHAR(255)` | Nome da empresa parceira. |
| `cnpj` | `VARCHAR(18)` | CNPJ da empresa. |
| `phone` | `VARCHAR(20)` | Telefone de contato. |
| `address` | `TEXT` | Endereço da empresa. |
| `website` | `VARCHAR(255)` | Site da empresa. |
| `benefit_description` | `TEXT` | Descrição do benefício oferecido. |
| `status` | `VARCHAR(20)` | Status do parceiro (ativo, inativo). |
| `entry_date` | `TIMESTAMP` | Data de entrada do parceiro. |
