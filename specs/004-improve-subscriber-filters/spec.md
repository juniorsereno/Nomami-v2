# Feature Specification: Melhorar a Manipulação de Assinantes

**Feature Branch**: `004-improve-subscriber-filters`
**Created**: 2025-10-23
**Status**: Draft
**Input**: User description: "Vamos criar uma nova spec para prosseguir no nosso desenvolvimento, primeiramente é importante você ler os arquivos do projeto para entende-lo, após isso vamos focar na página de assinantes, onde vamos melhorar a manipulação dos assinantes dentro do sistema, preciso que tenhamos um field para pesquisa de assinantes por nome ou telefone, preciso que tenha a possibilidade de filtrar por plano mensal ou anual, preciso que tenha como filtrar assinantes por data de inicio com intervalo por exemplo, hoje, ultimos 7d, 15d, 30d."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pesquisar Assinantes (Priority: P1)

Como administrador, quero pesquisar assinantes por nome ou número de telefone para que eu possa encontrar rapidamente usuários específicos.

**Why this priority**: A busca é a funcionalidade mais básica e essencial para gerenciar uma lista de assinantes, permitindo acesso rápido à informação.

**Independent Test**: A funcionalidade de busca pode ser testada de forma independente. Um administrador pode inserir um nome ou telefone e verificar se o assinante correto é exibido, entregando valor imediato ao agilizar a localização de usuários.

**Acceptance Scenarios**:

1.  **Given** que estou na página de assinantes, **When** eu digito o nome de um assinante existente no campo de busca, **Then** a lista de assinantes é filtrada para mostrar apenas o assinante com aquele nome.
2.  **Given** que estou na página de assinantes, **When** eu digito o telefone de um assinante existente no campo de busca, **Then** a lista de assinantes é filtrada para mostrar apenas o assinante com aquele telefone.
3.  **Given** que estou na página de assinantes, **When** eu digito um nome ou telefone que não existe, **Then** a lista de assinantes mostra uma mensagem indicando que nenhum resultado foi encontrado.

---

### User Story 2 - Filtrar Assinantes por Plano (Priority: P2)

Como administrador, quero filtrar os assinantes pelo tipo de plano (mensal ou anual) para que eu possa segmentar os usuários com base em sua assinatura.

**Why this priority**: Filtrar por plano permite análises e ações de marketing/engajamento direcionadas a grupos específicos de clientes.

**Independent Test**: A filtragem por plano pode ser testada de forma independente. O administrador pode selecionar o filtro "mensal" ou "anual" e verificar se a lista exibe apenas os assinantes correspondentes.

**Acceptance Scenarios**:

1.  **Given** que estou na página de assinantes, **When** eu seleciono o filtro "Plano Mensal", **Then** a lista de assinantes é atualizada para mostrar apenas os assinantes com plano mensal.
2.  **Given** que estou na página de assinantes, **When** eu seleciono o filtro "Plano Anual", **Then** a lista de assinantes é atualizada para mostrar apenas os assinantes com plano anual.

---

### User Story 3 - Filtrar Assinantes por Data de Início (Priority: P3)

Como administrador, quero filtrar os assinantes pela data de início usando intervalos predefinidos (hoje, últimos 7 dias, 15 dias, 30 dias) para que eu possa analisar as novas inscrições recentes.

**Why this priority**: Este filtro ajuda a monitorar o crescimento e a eficácia de campanhas recentes.

**Independent Test**: A filtragem por data pode ser testada de forma independente. O administrador pode selecionar um intervalo de datas e verificar se a lista exibe apenas os assinantes que se inscreveram nesse período.

**Acceptance Scenarios**:

1.  **Given** que estou na página de assinantes, **When** eu seleciono o filtro de data "Hoje", **Then** a lista mostra apenas os assinantes que iniciaram hoje.
2.  **Given** que estou na página de assinantes, **When** eu seleciono o filtro de data "Últimos 7 dias", **Then** a lista mostra apenas os assinantes que iniciaram nos últimos 7 dias.
3.  **Given** que estou na página de assinantes, **When** eu seleciono o filtro de data "Últimos 15 dias", **Then** a lista mostra apenas os assinantes que iniciaram nos últimos 15 dias.
4.  **Given** que estou na página de assinantes, **When** eu seleciono o filtro de data "Últimos 30 dias", **Then** a lista mostra apenas os assinantes que iniciaram nos últimos 30 dias.

---

### Edge Cases

-   O que acontece quando um filtro de data é combinado com um filtro de plano e uma pesquisa por nome? O sistema deve aplicar todos os critérios juntos (AND).
-   Como o sistema lida com uma busca por um nome parcial? O sistema deve retornar todos os assinantes cujos nomes contenham o texto pesquisado.
-   O que acontece se não houver assinantes para um determinado filtro? O sistema deve exibir uma lista vazia com uma mensagem clara.

## Requirements *(mandatory)*

### Functional Requirements

-   **FR-001**: O sistema DEVE fornecer um campo de texto para pesquisar assinantes por nome.
-   **FR-002**: O sistema DEVE fornecer um campo de texto para pesquisar assinantes por telefone.
-   **FR-003**: O sistema DEVE fornecer uma opção de filtro para exibir apenas assinantes com plano "mensal".
-   **FR-004**: O sistema DEVE fornecer uma opção de filtro para exibir apenas assinantes com plano "anual".
-   **FR-005**: O sistema DEVE fornecer uma opção de filtro para exibir assinantes que iniciaram "hoje".
-   **FR-006**: O sistema DEVE fornecer uma opção de filtro para exibir assinantes que iniciaram nos "últimos 7 dias".
-   **FR-007**: O sistema DEVE fornecer uma opção de filtro para exibir assinantes que iniciaram nos "últimos 15 dias".
-   **FR-008**: O sistema DEVE fornecer uma opção de filtro para exibir assinantes que iniciaram nos "últimos 30 dias".
-   **FR-009**: Os resultados da pesquisa e dos filtros DEVEM atualizar a lista de assinantes em tempo real ou após uma ação clara do usuário (por exemplo, clicar em um botão "Filtrar").

### Key Entities *(include if feature involves data)*

-   **Assinante**: Representa um usuário com uma assinatura. Atributos chave: Nome, Telefone, Tipo de Plano, Data de Início.

## Success Criteria *(mandatory)*

### Measurable Outcomes

-   **SC-001**: Um administrador consegue encontrar qualquer assinante pelo nome completo ou telefone em menos de 5 segundos.
-   **SC-002**: A aplicação de um filtro de plano ou data atualiza a lista de assinantes em menos de 2 segundos.
-   **SC-003**: A combinação de pesquisa e filtros deve refletir com precisão os critérios selecionados.
-   **SC-004**: Reduzir o tempo para encontrar um assinante específico ou um grupo de assinantes em 70%.
