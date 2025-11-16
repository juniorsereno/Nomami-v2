# Feature Specification: Tela de Gerenciamento de Telemedicina

**Feature Branch**: `006-telemedicine-management-screen`  
**Created**: 2025-11-01  
**Status**: Draft  
**Input**: User description: "Crie uma nova spec, agora vamos desenvolver a tela da ""Tele Medicina"" onde será uma tela de gerenciamento de cadastros na tele medicina, nessa tela não terá o histórico de clientes ativos ou inativos, essa tela será responsável por cadastrar novos clientes na tele medicina ou inativar clientes na tele medicina, basicamente precisamos de 2 botões um apra Adicionar Cliente e outro para Inativar cliente, também precisamos de 2 campos de configuração da API da tele medicina um campo com o usuário e outro campo com a senha da API. Quando selecionado o botão de adicionar deverá exibir um dialog para o usuário preencher o nome, cpf, data de nascimento, sexo e o celular. Quando selecionado o botão de Inativar Deverá ser o mesmo dialog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurar Credenciais da API (Priority: P1)

Como administrador, quero poder inserir e salvar as credenciais (usuário e senha) da API de telemedicina para que o sistema possa se autenticar e realizar operações de cadastro e inativação de clientes.

**Why this priority**: Esta é a funcionalidade base sem a qual nenhuma outra operação com a API pode ser realizada. É um pré-requisito crítico.

**Independent Test**: A tela de configuração pode ser testada de forma independente. O teste consiste em inserir as credenciais, salvá-las e verificar se elas são recuperadas corretamente na próxima vez que a tela for carregada.

**Acceptance Scenarios**:

1.  **Given** que o administrador está na tela de Tele Medicina, **When** ele preenche os campos "Usuário da API" e "Senha da API" e clica em "Salvar", **Then** o sistema deve armazenar as credenciais de forma segura e exibir uma mensagem de sucesso.
2.  **Given** que as credenciais já foram salvas, **When** o administrador acessa a tela de Tele Medicina, **Then** os campos de usuário e senha devem vir preenchidos (a senha mascarada) para edição.

---

### User Story 2 - Adicionar Novo Cliente (Priority: P2)

Como administrador, quero poder adicionar um novo cliente ao serviço de telemedicina através de um formulário, para que ele possa começar a usar os serviços.

**Why this priority**: O cadastro de novos clientes é uma das principais funções da tela, permitindo a expansão da base de usuários do serviço.

**Independent Test**: O fluxo de adição de cliente pode ser testado de forma independente. O teste envolve abrir o formulário, preencher os dados e submeter, verificando se a chamada correta para a API é feita.

**Acceptance Scenarios**:

1.  **Given** que o administrador está na tela de Tele Medicina, **When** ele clica no botão "Adicionar Cliente", **Then** um dialog deve ser exibido com os campos: Nome, CPF, Data de Nascimento, Sexo e Celular.
2.  **Given** que o dialog de adição está aberto, **When** o administrador preenche todos os campos com dados válidos e clica em "Salvar", **Then** o sistema deve enviar os dados para a API de telemedicina e exibir uma mensagem de sucesso.
3.  **Given** que o dialog de adição está aberto, **When** o administrador tenta salvar com um campo obrigatório em branco ou com dados inválidos (ex: CPF incorreto), **Then** o sistema deve exibir uma mensagem de erro indicando o campo problemático.

---

### User Story 3 - Inativar Cliente Existente (Priority: P3)

Como administrador, quero poder inativar um cliente existente no serviço de telemedicina, preenchendo seus dados, para gerenciar o acesso de usuários que não fazem mais parte do serviço.

**Why this priority**: A inativação é uma função de gerenciamento importante, mas menos frequente que o cadastro.

**Independent Test**: O fluxo de inativação pode ser testado de forma independente. O teste consiste em abrir o dialog de inativação, preencher os dados do cliente, submeter e verificar se a chamada correta à API é realizada.

**Acceptance Scenarios**:

1.  **Given** que o administrador está na tela de Tele Medicina, **When** ele clica no botão "Inativar Cliente", **Then** um dialog deve ser exibido com os mesmos campos do formulário de adição (Nome, CPF, etc.).
2.  **Given** que o dialog de inativação está aberto, **When** o administrador preenche os dados de um cliente existente e clica em "Inativar", **Then** o sistema deve enviar a solicitação de inativação para a API de telemedicina e exibir uma mensagem de sucesso.

---

### Edge Cases

-   O que acontece se as credenciais da API estiverem incorretas ao tentar adicionar ou inativar um cliente? O sistema deve retornar um erro claro.
-   Como o sistema lida com uma tentativa de cadastrar um CPF que já existe?
-   O que acontece se a API de telemedicina estiver offline ou retornar um erro inesperado?

## Requirements *(mandatory)*

### Functional Requirements

-   **FR-001**: O sistema DEVE fornecer dois campos de texto para o usuário inserir o nome de usuário e a senha da API de telemedicina.
-   **FR-002**: O sistema DEVE persistir as credenciais da API de forma segura após serem salvas.
-   **FR-003**: O sistema DEVE apresentar um botão "Adicionar Cliente".
-   **FR-004**: Ao clicar em "Adicionar Cliente", o sistema DEVE exibir um dialog modal.
-   **FR-005**: O dialog de adição DEVE conter campos para: Nome (texto), CPF (texto/número), Data de Nascimento (data), Sexo (seleção) e Celular (texto/número).
-   **FR-006**: O sistema DEVE validar que os campos obrigatórios no formulário de adição não estão vazios.
-   **FR-007**: O sistema DEVE apresentar um botão "Inativar Cliente".
-   **FR-008**: Ao clicar em "Inativar Cliente", o sistema DEVE exibir um dialog com os mesmos campos do formulário de adição para que o administrador preencha os dados do cliente a ser inativado.
-   **FR-009**: Ao submeter o formulário de inativação, o sistema DEVE exibir um dialog de confirmação para prevenir ações acidentais.
-   **FR-010**: O sistema DEVE se comunicar com a API de telemedicina para enviar os dados de novos clientes e as solicitações de inativação.
-   **FR-011**: O sistema DEVE validar que o CPF contém exatamente 11 dígitos numéricos sem caracteres especiais.
-   **FR-012**: O sistema DEVE validar que o Celular contém exatamente 11 dígitos numéricos sem caracteres especiais.
-   **FR-013**: O sistema DEVE formatar a Data de Nascimento no padrão dd/mm/yyyy.
-   **FR-014**: O sistema DEVE enviar os dados para o endpoint https://webh.criativamaisdigital.com.br/webhook/661ea9ca-69d4-4876-ae67-59b2f9b59f18 no formato JSON especificado.
-   **FR-015**: O sistema DEVE proteger a tela de Telemedicina com autenticação, permitindo acesso apenas a usuários autenticados.

### Key Entities *(include if feature involves data)*

-   **Cliente de Telemedicina**: Representa um usuário final do serviço. Atributos principais: Nome, CPF, Data de Nascimento, Sexo, Celular, Status (Ativo/Inativo).
-   **Configuração da API**: Representa as credenciais de autenticação para o serviço externo. Atributos: Usuário, Senha.
    -   **Autenticação**: Basic Auth
    -   **Username**: `NOMAMI_424`
    -   **Password**: `N1211@`
-   **Body da API**: Formato JSON enviado ao endpoint da telemedicina:
    ```json
    [
      {
        "Sequencial": "",
        "Nome*": "Laryssa Pontes",
        "CPF*": 10439003733,
        "Data_Nascimento*": "04/05/1998",
        "Sexo*": "F",
        "Celular*": 61982002294,
        "E-mail": "",
        "rg": "",
        "fone": "",
        "cep": "",
        "estado": "",
        "cidade": "",
        "bairro": "",
        "CPF_TITULAR": "",
        "relacao_dependente": "",
        "ID_PLANO*": 7,
        "ACAO*": "A",
        "Grupo": ""
      }
    ]
    ```
    -   **Campos obrigatórios marcados com `*`**: `Nome*`, `CPF*`, `Data_Nascimento*`, `Sexo*`, `Celular*`, `ID_PLANO*`, `ACAO*`
    -   **`ACAO`**: `"A"` para adicionar, `"I"` para inativar
    -   **`ID_PLANO`**: fixo em `7`

## Success Criteria *(mandatory)*

### Measurable Outcomes

-   **SC-001**: Um administrador deve conseguir configurar as credenciais da API em menos de 1 minuto.
-   **SC-002**: O processo de cadastrar um novo cliente, desde o clique no botão "Adicionar Cliente" até a mensagem de sucesso, deve ser concluído em menos de 2 minutos.
-   **SC-003**: O processo de inativar um cliente, desde a sua seleção até a confirmação final, deve ser concluído em menos de 1 minuto.
-   **SC-004**: A taxa de erro nas operações de cadastro e inativação devido a problemas de interface deve ser inferior a 5%.


## Premissas e Dependências

### Premissas
- A pessoa que utiliza a tela (administrador) possui credenciais válidas e ativas para a API de telemedicina.
- Os dados inseridos para cadastro de novos clientes (como CPF) são válidos e corretos.
- A tela de Telemedicina está protegida por autenticação e apenas usuários autenticados podem acessá-la (conforme Princípio VI da Constituição).

### Dependências
- Esta funcionalidade depende criticamente de uma API de telemedicina externa e funcional.
- O contrato da API (endpoints, formatos de requisição/resposta) precisa estar disponível e documentado para a equipe de desenvolvimento.
- Sistema de autenticação implementado e funcional (`AuthProvider`, `useAuth`, `withAuth`).
