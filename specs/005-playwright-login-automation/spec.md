# Feature Specification: Automação de Login com Playwright

**Feature Branch**: `005-playwright-login-automation`  
**Created**: 2025-10-24  
**Status**: Draft  
**Input**: User description: "Precisamos criar uma spec para uma nova pasta que será um script playwrightpara manipulação de um sistema, precisa ser um script separado do sistema central mas com API para que o sistema central ative-o (não mexa no sistema nomami-app agora). O script deverá usar o playwright para acessar uma pagina: https://sistemabh.com.br/rssaude/app_Login onde terá um formulário de login onde ele deva preencher o usuário e a senha e clicar em login para entrar no sistema. vamos partir desse objetivo agora"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automação de Login no Sistema Externo (Priority: P1)

Como um sistema automatizado, eu quero acessar a página de login, preencher as credenciais de usuário e senha, e submeter o formulário para autenticar com sucesso no sistema externo.

**Why this priority**: Esta é a funcionalidade principal e o objetivo primário do script. Sem isso, nenhuma outra parte tem valor.

**Independent Test**: O script pode ser executado de forma isolada com um par de credenciais (válidas ou inválidas) e o resultado (sucesso ou falha na autenticação) pode ser verificado através dos logs de saída ou do status final da execução.

**Acceptance Scenarios**:

1. **Given** o script recebe credenciais de usuário e senha válidas, **When** o script é executado, **Then** ele deve navegar para a página de login, preencher os campos, clicar no botão de login e ser redirecionado para a página pós-autenticação do sistema.
2. **Given** o script recebe credenciais de usuário ou senha inválidas, **When** o script é executado, **Then** ele deve registrar uma falha de autenticação e encerrar a execução com um status de erro.

---

### User Story 2 - Exposição de uma API para Acionamento Remoto (Priority: P2)

Como o sistema central (Nomami), eu quero acionar o script de automação de login através de uma chamada de API, passando as credenciais necessárias e recebendo um retorno claro sobre o sucesso ou falha da operação.

**Why this priority**: Habilita a integração entre o sistema central e o script de automação, tornando a funcionalidade útil para o ecossistema Nomami.

**Independent Test**: A API pode ser testada de forma independente usando uma ferramenta como Postman ou cURL. Uma chamada para o endpoint da API com um corpo de requisição contendo as credenciais deve acionar o script e retornar uma resposta JSON com o status.

**Acceptance Scenarios**:

1. **Given** o sistema central possui as credenciais de um usuário, **When** ele faz uma requisição POST para o endpoint da API do script com as credenciais no corpo da requisição, **Then** o script de login é executado.
2. **Given** o script de login foi executado com sucesso, **When** a automação termina, **Then** a API deve retornar uma resposta com status HTTP 200 e um corpo indicando sucesso.
3. **Given** o script de login falhou (por credenciais inválidas, erro de página, etc.), **When** a automação termina, **Then** a API deve retornar uma resposta com um status HTTP apropriado (e.g., 401 para falha de autenticação, 500 para erro interno) e um corpo descrevendo o motivo da falha.

---

### Edge Cases

- **Página de login indisponível**: O que acontece se a URL `https://sistemabh.com.br/rssaude/app_Login` retornar um erro 404 ou 500? O script deve tentar novamente ou falhar imediatamente?
- **Mudança na estrutura da página**: Como o sistema lidará com mudanças nos seletores dos campos de usuário, senha ou do botão de login?
- **Mecanismos de segurança adicionais**: Como o sistema lidará com a aparição de CAPTCHAs ou outras verificações de segurança não previstas no formulário de login?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O script DEVE navegar para a URL `https://sistemabh.com.br/rssaude/app_Login`.
- **FR-002**: O script DEVE ser capaz de localizar e preencher o campo de "Usuário".
- **FR-003**: O script DEVE ser capaz de localizar e preencher o campo de "Senha".
- **FR-004**: O script DEVE ser capaz de localizar e clicar no botão "Login".
- **FR-005**: O script DEVE verificar o resultado da autenticação, confirmando se o login foi bem-sucedido (ex: verificando a presença de um elemento na página pós-login) ou se falhou (ex: verificando uma mensagem de erro).
- **FR-006**: O script DEVE expor um endpoint de API (HTTP POST) para iniciar o processo de automação.
- **FR-007**: A API DEVE aceitar um corpo de requisição JSON contendo `usuario` and `senha`.
- **FR-008**: A API DEVE retornar uma resposta JSON indicando o status da operação (`sucesso` ou `falha`) e uma mensagem descritiva.
- **FR-009**: O projeto do script DEVE ser autocontido e não ter dependências diretas com a base de código do `nomami-app`.
- **FR-010**: O script DEVE registrar logs detalhados de sua execução, incluindo erros de navegação, falhas ao encontrar elementos e status da autenticação.
- **FR-011**: O script DEVE receber as credenciais (usuário e senha) através do corpo da requisição da API em cada chamada.

### Key Entities *(include if feature involves data)*

- **Credencial**: Representa as informações de autenticação para o sistema externo.
  - Atributos: `usuario` (string), `senha` (string).
- **ResultadoAutomação**: Representa o resultado de uma única execução do script.
  - Atributos: `status` (string: "sucesso" | "falha"), `mensagem` (string), `timestamp` (datetime).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O script deve ter uma taxa de sucesso de login de 99% ou mais em execuções com credenciais válidas e com o sistema de destino online.
- **SC-002**: O tempo de execução total, desde a chamada da API até o retorno da resposta, deve ser inferior a 20 segundos em condições normais de rede.
- **SC-003**: A API deve responder a 100% das requisições válidas, seja com uma resposta de sucesso ou com uma mensagem de erro clara e estruturada.
- **SC-004**: O sistema central (Nomami) deve ser capaz de invocar o script com sucesso e processar a resposta para tomar ações subsequentes.
