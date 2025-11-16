# Feature Specification: Aba de Parceiros

**Feature Branch**: `001-aba-parceiros`  
**Created**: 2025-10-22T13:33:41.719Z
**Status**: Draft  
**Input**: User description: "rode o workflow e crie uma spec para agora desenvolvermos a aba de parceiros, acima da página preciso de cards exibindo a quantidade de parceiros ativos, quantidade de parceiros inativos, quantidade de novos parceiros nos ultimo 30 dias. abaixo quero uma table que contenha a lista completa dos parceiros cadastrados, com as informações específicas deles em cada coluna da tabela. O layout seguirá o mesmo padrão shadcn e os dados viram do Neon assim como estão vindo no dashboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Estatísticas Rápidas de Parceiros (Priority: P1)

Como administrador, quero ver os cards com as principais métricas de parceiros (ativos, inativos e novos) no topo da página para ter uma visão geral rápida do status da rede de parceiros.

**Why this priority**: Fornece uma visão gerencial imediata e de alto valor, permitindo a tomada de decisões rápidas sem a necessidade de analisar dados detalhados.

**Independent Test**: A página pode ser carregada e, se os cards exibirem as contagens corretas (mesmo que a tabela abaixo ainda não esteja implementada), a história do usuário é considerada validada.

**Acceptance Scenarios**:

1. **Given** que estou na página de parceiros, **When** a página carrega, **Then** devo ver três cards distintos: "Parceiros Ativos", "Parceiros Inativos" e "Novos Parceiros (Últimos 30 dias)".
2. **Given** que os cards estão visíveis, **When** os dados são carregados do banco de dados, **Then** cada card deve exibir a contagem numérica correta correspondente ao seu título.

---

### User Story 2 - Consultar Lista Detalhada de Parceiros (Priority: P2)

Como administrador, quero ver uma tabela com a lista completa de todos os parceiros cadastrados, contendo suas informações específicas, para que eu possa consultar, gerenciar e encontrar parceiros individualmente.

**Why this priority**: É a funcionalidade principal da página, permitindo o acesso aos dados detalhados que dão contexto às métricas dos cards.

**Independent Test**: A tabela pode ser renderizada com dados de parceiros, e se as colunas e os registros estiverem corretos, a funcionalidade pode ser testada independentemente dos cards de estatísticas.

**Acceptance Scenarios**:

1. **Given** que estou na página de parceiros, **When** a página carrega, **Then** devo ver uma tabela abaixo dos cards de estatísticas.
2. **Given** que a tabela está visível, **When** os dados são carregados, **Then** a tabela deve ser preenchida com os registros de todos os parceiros cadastrados.
3. **Given** que a tabela está preenchida, **When** eu observo as colunas, **Then** devo ver as informações específicas de cada parceiro.

---

### Edge Cases

- **O que acontece quando não há parceiros cadastrados?** Os cards de estatísticas devem exibir o número "0" e a tabela deve mostrar uma mensagem indicando que "Nenhum parceiro encontrado".
- **Como o sistema lida com falhas ao carregar os dados do Neon?** A interface deve exibir um estado de carregamento (loading) enquanto busca os dados. Se ocorrer um erro, uma mensagem amigável deve ser exibida, como "Não foi possível carregar os dados dos parceiros. Tente novamente mais tarde."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir três cards de resumo no topo da página:
  - Quantidade de parceiros ativos.
  - Quantidade de parceiros inativos.
  - Quantidade de parceiros novos nos últimos 30 dias.
- **FR-002**: O sistema DEVE buscar os dados para os cards e para a tabela do banco de dados Neon.
- **FR-003**: O sistema DEVE exibir uma tabela com a lista completa de parceiros cadastrados.
- **FR-004**: A tabela de parceiros DEVE exibir as seguintes colunas de informação: Nome da Empresa, CNPJ, Telefone, Status e Data de Entrada.
- **FR-005**: O layout da página, incluindo cards e tabela, DEVE seguir o padrão de design do `shadcn` já utilizado no restante da aplicação.

### Key Entities *(include if feature involves data)*

- **Parceiro**: Representa uma entidade de parceiro de negócios.
  - **Atributos**: ID, Nome, Status (Ativo/Inativo), Data de Cadastro, e outras informações relevantes a serem exibidas na tabela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A página de parceiros, incluindo os cards e a primeira carga da tabela, deve carregar completamente em menos de 3 segundos.
- **SC-002**: As contagens exibidas nos cards de estatísticas devem ter 100% de precisão em relação aos dados do banco de dados no momento do carregamento.
- **SC-003**: Um administrador deve ser capaz de encontrar as informações de qualquer parceiro específico utilizando a tabela em menos de 1 minuto.