# Development Tasks: Tela de Gerenciamento de Telemedicina

**Branch**: `006-telemedicine-management-screen`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

Este documento detalha as tarefas de desenvolvimento necessárias para implementar a funcionalidade, com base na especificação e no plano técnico.

## Tarefas de Desenvolvimento

### Milestone 1: Estrutura da Página e Persistência

-   **Tarefa 1.1: Criar a Página de Telemedicina (Protegida)**
    -   **Descrição**: Criar o arquivo `nomami-app/app/tele-medicine/page.tsx`.
    -   **Detalhes**: A página deve conter a estrutura básica de layout, incluindo `AppSidebar`, `SiteHeader` e `SidebarInset`. Adicionar um título "Tele Medicina" e os campos de input para "Usuário da API" e "Senha da API", juntamente com um botão "Salvar". A página DEVE ser protegida por autenticação usando o HOC `withAuth` ou hook `useAuth` conforme constituição.
    -   **Critérios de Aceitação**: A página é renderizada corretamente no navegador, exibindo o layout e os campos de configuração. Apenas usuários autenticados podem acessar.

-   **Tarefa 1.2: Implementar Persistência de Credenciais**
    -   **Descrição**: Implementar armazenamento seguro das credenciais da API.
    -   **Detalhes**: Criar lógica para persistir as credenciais (usuário e senha) de forma segura. Opções: variáveis de ambiente, banco de dados criptografado, ou storage seguro do navegador. Implementar endpoint API para salvar/recuperar credenciais.
    -   **Critérios de Aceitação**: As credenciais são salvas e recuperadas corretamente. A senha não é exposta no console ou logs.

### Milestone 2: Formulário de Adição/Inativação

-   **Tarefa 2.1: Criar o Formulário de Cliente com Validação Específica**
    -   **Descrição**: Criar o componente `nomami-app/components/add-telemedicine-form.tsx`.
    -   **Detalhes**: O formulário deve ser construído com `react-hook-form` e `zod` para validação. Deve conter os campos: Nome, CPF, Data de Nascimento, Sexo e Celular. Implementar validações específicas:
        -   CPF: exatamente 11 dígitos numéricos, sem caracteres especiais
        -   Celular: exatamente 11 dígitos numéricos, sem caracteres especiais
        -   Data de Nascimento: formato dd/mm/yyyy
        -   Sexo: seleção entre "F" e "M"
        -   Nome: texto livre, obrigatório
    -   **Critérios de Aceitação**: O formulário é renderizado corretamente e todas as validações funcionam como especificado, exibindo mensagens de erro claras.

-   **Tarefa 2.2: Integrar o Formulário com a Página**
    -   **Descrição**: Integrar o `add-telemedicine-form.tsx` na página `tele-medicine/page.tsx` dentro de um componente `Dialog` da `shadcn/ui`.
    -   **Detalhes**: A página deve ter dois botões, "Adicionar Cliente" e "Inativar Cliente". Ambos os botões abrirão o mesmo dialog com o formulário. O título do dialog deve mudar dependendo do botão que foi clicado ("Adicionar Cliente" ou "Inativar Cliente").
    -   **Critérios de Aceitação**: Os botões abrem o dialog corretamente, e o título do dialog reflete a ação selecionada.

### Milestone 3: Funcionalidade e Lógica

-   **Tarefa 3.1: Implementar a Lógica de Submissão para API Externa**
    -   **Descrição**: Adicionar a lógica `onSubmit` ao formulário para enviar os dados para o endpoint real da API de telemedicina.
    -   **Detalhes**: A função `onSubmit` deve construir o body JSON no formato especificado (com campos `Sequencial`, `Nome*`, `CPF*`, `Data_Nascimento*`, `Sexo*`, `Celular*`, `ID_PLANO*`=7, `ACAO*`=A/I, etc.) e fazer POST para https://webh.criativamaisdigital.com.br/webhook/661ea9ca-69d4-4876-ae67-59b2f9b59f18. Utilizar `sonner` para exibir notificações de sucesso ou erro. Implementar tratamento de erros da API.
    -   **Critérios de Aceitação**: Ao submeter o formulário, a chamada à API externa é feita corretamente com o body no formato especificado e uma notificação é exibida.

-   **Tarefa 3.2: Implementar Dialog de Confirmação para Inativação**
    -   **Descrição**: Criar dialog de confirmação que aparece ao submeter o formulário de inativação.
    -   **Detalhes**: Ao clicar em "Inativar" no formulário, exibir um dialog de confirmação com mensagem "Tem certeza que deseja inativar este cliente?" e botões "Confirmar" e "Cancelar". Só enviar a requisição para a API se o usuário confirmar.
    -   **Critérios de Aceitação**: O dialog de confirmação aparece apenas para ação de inativação e o fluxo de confirmação funciona corretamente.