# Plano de Implementação: Automação de Login com Playwright

**Feature Branch**: `005-playwright-login-automation`
**Spec**: [`spec.md`](./spec.md)

## Visão Geral

Este plano detalha os passos técnicos para criar um serviço de automação independente que realiza login em um sistema externo usando Playwright. O serviço será encapsulado em sua própria pasta, `playwright-automation`, e exporá uma API para ser consumida pelo sistema `nomami-app` ou outros clientes.

---

## Etapa 1: Estrutura e Configuração do Projeto

### Tarefa 1.1: Criar a Estrutura de Pastas e Arquivos

-   **Diretório Raiz**: Na raiz do repositório, criar uma nova pasta chamada `playwright-automation`.
-   **Descrição**: Esta pasta conterá todo o código e as dependências do serviço de automação, garantindo seu isolamento do `nomami-app`.
-   **Estrutura Inicial**:
    ```
    playwright-automation/
    ├── src/
    │   ├── automation.js
    │   └── server.js
    ├── package.json
    └── .gitignore
    ```

### Tarefa 1.2: Inicializar o Projeto e Instalar Dependências

-   **Arquivo**: `playwright-automation/package.json`
-   **Descrição**: Configurar um novo projeto Node.js e instalar as bibliotecas necessárias.
-   **Comandos** (a serem executados dentro da pasta `playwright-automation`):
    1.  `npm init -y`
    2.  `npm install playwright@1.56.1`
    3.  `npm install express`
-   **Scripts no `package.json`**:
    ```json
    "scripts": {
      "start": "node src/server.js",
      "test": "echo \"Error: no test specified\" && exit 1"
    }
    ```
-   **Arquivo**: `playwright-automation/.gitignore`
-   **Conteúdo**:
    ```
    node_modules/
    .env
    ```

---

## Etapa 2: Implementação do Script de Automação

### Tarefa 2.1: Desenvolver a Lógica de Login com Playwright

-   **Arquivo**: `playwright-automation/src/automation.js`
-   **Descrição**: Criar uma função assíncrona que recebe as credenciais, abre um navegador, navega até a página de login, preenche o formulário e verifica o resultado.
-   **Detalhes**:
    -   A função principal (ex: `realizarLogin`) aceitará `usuario` e `senha` como argumentos.
    -   Utilizar `playwright.chromium.launch()` para iniciar o navegador.
    -   Navegar para `https://sistemabh.com.br/rssaude/app_Login`.
    -   Usar seletores robustos para encontrar os campos de "Usuário" e "Senha" e o botão "Login". Ex: `page.locator('input[name="usuario"]')`.
    -   Implementar `try...catch...finally` para garantir que o navegador (`browser.close()`) seja sempre fechado, mesmo em caso de erro.
    -   Após o clique no botão de login, aguardar por uma navegação ou por um elemento específico da página de sucesso para confirmar a autenticação.
    -   A função deve retornar um objeto indicando o sucesso ou a falha da operação (ex: `{ success: true }` ou `{ success: false, error: 'Credenciais inválidas' }`).

---

## Etapa 3: Implementação da API

### Tarefa 3.1: Configurar o Servidor Express

-   **Arquivo**: `playwright-automation/src/server.js`
-   **Descrição**: Criar um servidor web simples usando Express para expor a funcionalidade de automação.
-   **Detalhes**:
    -   Importar o `express` e a função `realizarLogin` do `automation.js`.
    -   Configurar o middleware `express.json()` para parsear o corpo das requisições.
    -   Definir a porta do servidor (ex: `3001`) a partir de uma variável de ambiente ou um valor padrão.

### Tarefa 3.2: Criar o Endpoint de Acionamento

-   **Arquivo**: `playwright-automation/src/server.js`
-   **Descrição**: Implementar a rota `POST /login` que receberá as credenciais e invocará o script do Playwright.
-   **Detalhes**:
    -   Criar um handler para `app.post('/login', async (req, res) => { ... })`.
    -   Extrair `usuario` e `senha` do `req.body`.
    -   Validar se as credenciais foram fornecidas; caso contrário, retornar um erro 400.
    -   Chamar `await realizarLogin(usuario, senha)`.
    -   Com base no retorno da função de automação, enviar a resposta apropriada:
        -   Se sucesso: `res.status(200).json({ status: 'sucesso', message: 'Login realizado com sucesso.' })`.
        -   Se falha: `res.status(401).json({ status: 'falha', message: 'Falha na autenticação: ' + errorDetails })`.
        -   Para erros inesperados no script: `res.status(500).json({ status: 'erro', message: 'Ocorreu um erro interno no servidor.' })`.