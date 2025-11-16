# Feature Specification: Dashboard de Gestão de Assinaturas NoMami

**Feature Branch**: `dashboard-gestao-assinaturas`  
**Created**: 2025-10-18T13:01:14.356Z
**Status**: Draft  
**Input**: User description: "Crie uma aplicação que será um sistema de gestão de um clube de assinatura chamado NoMami, esse sistema será responsável por apresentar informações cruciais para o gestor do clube com um dashboard em shadcn exibindo as principais informações sobre o negócio, como quantidade de clientes ativos (assinantes), quantidade de clientes inativos (com assinatura vencida, isso é importante para exibir quantos clientes já passaram pelo sistema), Valor total recorrente (valor da assinatura x quantidade de assinantes ativos), quantidade de assinantes no mês. Um gráfico de crescimento do negocio, tanto em quantidade de clientes quanto em valor. Aproveite o template do shadcn para explorar possibilidades. é necessário tambem ter uma tela de login para o gestor acessar o sistema, você pode usar o template npx shadcn@latest add login-04 Vamos iniciar com um mockap dessa primeira tela de login e dashboard. Teremos outras telas que iremos desenvolver futuramente de Assinantes, Parceiros e Configurações. O foco agora é o design inicial do dash, UI moderno."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acesso Seguro ao Sistema (Priority: P1)

Como gestor do clube, eu quero acessar o sistema através de uma tela de login para garantir que apenas usuários autorizados possam ver os dados do negócio.

**Why this priority**: É o requisito fundamental de segurança e o ponto de entrada para todas as outras funcionalidades. Sem ele, o sistema é inutilizável.

**Independent Test**: A tela de login pode ser testada de forma independente. Um usuário com credenciais válidas deve conseguir acesso, enquanto um com credenciais inválidas deve ser bloqueado. O valor entregue é a segurança dos dados.

**Acceptance Scenarios**:

1. **Given** o gestor está na tela de login e possui credenciais válidas, **When** ele insere seu email e senha e clica em "Entrar", **Then** ele é redirecionado para o dashboard principal.
2. **Given** o gestor está na tela de login e possui credenciais inválidas, **When** ele insere as credenciais e clica em "Entrar", **Then** uma mensagem de erro é exibida e ele permanece na tela de login.

---

### User Story 2 - Visão Geral do Negócio no Dashboard (Priority: P2)

Como gestor do clube, após fazer login, eu quero ver um dashboard com as métricas mais importantes do negócio para tomar decisões rápidas e informadas.

**Why this priority**: O dashboard é a principal ferramenta de valor para o gestor, fornecendo os insights necessários para a operação do clube de assinatura.

**Independent Test**: O dashboard pode ser testado com dados mockados para garantir que todos os componentes visuais (cards de métricas e gráficos) renderizem corretamente e exibam os dados esperados.

**Acceptance Scenarios**:

1. **Given** o gestor está autenticado no sistema, **When** ele acessa a página inicial, **Then** o dashboard é exibido.
2. **Given** o gestor está no dashboard, **When** a página carrega, **Then** ele visualiza cards com: "Clientes Ativos", "Clientes Inativos", "Valor Total Recorrente (MRR)" e "Novos Assinantes no Mês".
3. **Given** o gestor está no dashboard, **When** a página carrega, **Then** ele visualiza um gráfico mostrando o crescimento de clientes (eixo Y) ao longo do tempo (eixo X).
4. **Given** o gestor está no dashboard, **When** a página carrega, **Then** ele visualiza um gráfico mostrando o crescimento do MRR (eixo Y) ao longo do tempo (eixo X).

---

### Edge Cases

- Como o sistema lida com a tentativa de acesso direto ao dashboard sem autenticação? (Deve redirecionar para o login).
- O que é exibido nos gráficos se não houver dados históricos (ex: primeiro mês de operação)? (Devem exibir um estado vazio ou inicial amigável).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer uma interface de login para autenticação do gestor.
- **FR-002**: O sistema DEVE validar as credenciais do gestor antes de conceder acesso.
- **FR-003**: Após a autenticação bem-sucedida, o sistema DEVE redirecionar o gestor para o dashboard.
- **FR-004**: O dashboard DEVE exibir o número total de clientes com assinaturas ativas.
- **FR-005**: O dashboard DEVE exibir o número total de clientes com assinaturas vencidas (inativos).
- **FR-006**: O dashboard DEVE calcular e exibir o Valor Total Recorrente (MRR), definido como (valor da assinatura * quantidade de assinantes ativos).
- **FR-007**: O dashboard DEVE exibir o número de novos assinantes adquiridos no mês corrente.
- **FR-008**: O sistema DEVE apresentar um gráfico de linhas que ilustra a evolução do número de assinantes ativos ao longo do tempo.
- **FR-009**: O sistema DEVE apresentar um gráfico de linhas que ilustra a evolução do MRR ao longo do tempo.

### Key Entities *(include if feature involves data)*

- **Gestor**: Representa o usuário do sistema, que tem permissão para visualizar os dados do dashboard. Atributos: credenciais de acesso.
- **Assinante**: Representa um cliente do clube. Atributos principais: status (ativo, inativo).
- **Assinatura**: Representa o contrato de um assinante com o clube. Atributos principais: valor, data de início, data de expiração.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O gestor deve conseguir fazer login e carregar completamente o dashboard em menos de 5 segundos.
- **SC-002**: As métricas exibidas no dashboard devem ter uma precisão de 100% em relação à base de dados (para esta fase, dados mockados).
- **SC-003**: O design do dashboard e da tela de login alcança uma pontuação de satisfação de pelo menos 8/10 em uma avaliação qualitativa com o stakeholder principal.
- **SC-004**: O tempo para o gestor identificar as 4 métricas chave (ativos, inativos, MRR, novos no mês) é inferior a 10 segundos após o carregamento da tela.