# Plano de Implementação: Integração de Pagamento com Asaas

**Feature Branch**: `003-asaas-payment-integration`
**Spec**: [`spec.md`](./spec.md)

## Visão Geral

Este plano detalha os passos técnicos para implementar a integração de webhook com o gateway de pagamento Asaas. O objetivo é automatizar o cadastro de novos assinantes quando um pagamento é confirmado. A implementação será dividida em três frentes: Backend (API), Banco de Dados e Frontend (UI).

---

## Etapa 1: Backend (API do Webhook)

### Tarefa 1.1: Criar a Rota da API do Webhook

-   **Arquivo**: `nomami-app/app/api/webhook/asaas/route.ts`
-   **Descrição**: Criar uma nova rota de API usando o Next.js App Router para receber as notificações POST do Asaas.
-   **Detalhes**:
    -   A rota será `POST /api/webhook/asaas`.
    -   A função `POST` receberá o corpo da requisição, que é o JSON enviado pelo Asaas.
    -   Inicialmente, a função fará um `console.log` do corpo recebido para fins de depuração.
    -   A rota deve retornar uma resposta com status `200 OK` para o Asaas para confirmar o recebimento.

### Tarefa 1.2: Implementar a Lógica de Processamento do Webhook

-   **Arquivo**: `nomami-app/app/api/webhook/asaas/route.ts`
-   **Descrição**: Adicionar a lógica para processar os dados do webhook, chamar a API do Asaas e cadastrar o assinante.
-   **Detalhes**:
    1.  **Validação do Evento**: Verificar se o campo `event` no corpo do JSON é igual a `PAYMENT_CONFIRMED`. Se não for, ignorar a requisição.
    2.  **Chamada à API do Asaas**:
        -   Extrair o `payment.customer` do corpo do webhook.
        -   Fazer uma chamada `GET` para `https://api.asaas.com/v3/customers/{customer_id}`.
        -   Incluir os headers `accept: application/json` e `access_token: {SEU_TOKEN}`. O token será armazenado como uma variável de ambiente (`ASAAS_API_KEY`).
    3.  **Tratamento de Erro**:
        -   Se a chamada à API do Asaas falhar, registrar o erro na nova tabela de logs do banco de dados (ver Etapa 2). O log deve conter o corpo completo do webhook e a mensagem de erro.
    4.  **Cadastro do Assinante**:
        -   Se a chamada for bem-sucedida, extrair os dados do cliente (nome, email, cpf, etc.).
        -   Verificar se um assinante com o mesmo `cpfCnpj` ou `email` já existe.
        -   Se existir, atualizar a `next_due_date` para `now() + 30 dias`.
        -   Se não existir, criar um novo registro na tabela `subscribers` com os dados recebidos, `plan_type = 'mensal'` e `next_due_date = now() + 30 dias`.

---

## Etapa 2: Banco de Dados

### Tarefa 2.1: Criar a Tabela de Logs do Webhook

-   **Descrição**: Criar uma nova tabela no banco de dados para armazenar os logs de erro do processamento de webhooks.
-   **Comando SQL**:
    ```sql
    CREATE TABLE asaas_webhook_logs (
        id SERIAL PRIMARY KEY,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        request_body JSONB NOT NULL,
        error_message TEXT,
        status VARCHAR(20) DEFAULT 'failed'
    );
    ```

### Tarefa 2.2: Adicionar Coluna `asaas_customer_id` à Tabela `subscribers`

-   **Descrição**: Adicionar uma coluna para armazenar o ID do cliente do Asaas na tabela de assinantes, para referência futura.
-   **Comando SQL**:
    ```sql
    ALTER TABLE subscribers ADD COLUMN asaas_customer_id VARCHAR(255);
    ```

---

## Etapa 3: Frontend (UI de Configurações)

### Tarefa 3.1: Modificar a Página de Configurações

-   **Arquivo**: `nomami-app/app/settings/page.tsx`
-   **Descrição**: Adicionar uma nova seção na página de configurações para a integração com o Asaas.
-   **Detalhes**:
    -   Adicionar um `Card` do shadcn/ui com o título "Integração com Gateway de Pagamento (Asaas)".
    -   Dentro do card, exibir o link do webhook que deve ser configurado no painel do Asaas. O link será: `https://SEU_DOMINIO/api/webhook/asaas`.
    -   Adicionar um botão "Copiar" para facilitar a cópia do link.

### Tarefa 3.2: Criar a Tabela de Logs de Erro

-   **Componente**: `nomami-app/components/asaas-logs-table.tsx`
-   **Descrição**: Criar um novo componente de tabela para exibir os logs de erro do webhook.
-   **Detalhes**:
    -   A tabela será construída usando os componentes `Table`, `TableHeader`, `TableBody`, etc., do shadcn/ui.
    -   As colunas serão: "Data", "Status", "Mensagem de Erro" e um botão de ação para "Ver Detalhes".
    -   Ao clicar em "Ver Detalhes", um `Dialog` ou `Sheet` do shadcn/ui será aberto, mostrando o JSON completo do webhook que causou o erro.

### Tarefa 3.3: Criar a API para Listar os Logs

-   **Arquivo**: `nomami-app/app/api/webhook/asaas/logs/route.ts`
-   **Descrição**: Criar uma rota de API para buscar os dados da tabela `asaas_webhook_logs` e exibi-los no frontend.
-   **Detalhes**:
    -   A função `GET` fará uma consulta `SELECT` na tabela `asaas_webhook_logs`, ordenando por `received_at` de forma decrescente.
    -   A rota retornará um JSON com a lista de logs.