# Feature Specification: Integração de Webhook Asaas

**Feature Branch**: `001-asaas-webhook-integration`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Siga o workflow, vamos criar uma nova integração assim como temos no stripe mas agora com o asaas, o sistema deve criar uma url webhook para cadastrar no asaas, quando um cliente efetuar um pagamento no asaas o sistema receberá nessa url webhook o payload de exemplo 'asaas-subscription-paid.md'. Quando receber esse dados o sistema deve Extrair o `payment.customer` do corpo do webhook. Fazer uma chamada `GET` para `https://api.asaas.com/v3/customers/{customer_id}`. Incluir os headers `accept: application/json` e `access_token: {SEU_TOKEN}`. O token será armazenado como uma variável de ambiente (`ASAAS_API_KEY`). 3. **Tratamento de Erro**: - Se a chamada à API do Asaas falhar, registrar o erro na nova tabela de logs do banco de dados (ver Etapa 2). O log deve conter o corpo completo do webhook e a mensagem de erro. **Cadastro do Assinante**: Se a chamada for bem-sucedida, extrair os dados do cliente (nome, email, cpf, etc.). Verificar se um assinante com o mesmo `cpfCnpj` ou `email` já existe. Se existir, atualizar a `next_due_date` para `now() + 30 dias`. Se não existir, criar um novo registro na tabela `subscribers` com os dados recebidos, `plan_type = 'mensal'` e `next_due_date = now() + 30 dias`. Caso tenha mais dúvidas fizemos uma spec anterior 003-asaas-payment-integration. Essa integração não deve interferir na integração do stripe."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Processar Pagamento de Assinatura Confirmado (Priority: P1)

Quando um pagamento de assinatura é confirmado no Asaas, o sistema deve receber uma notificação via webhook, buscar os detalhes do cliente na API do Asaas e criar ou atualizar o registro do assinante no banco de dados local.

**Why this priority**: Essencial para manter a base de assinantes sincronizada com os pagamentos realizados, garantindo que os usuários tenham acesso contínuo ao serviço.

**Independent Test**: Enviar um payload de `PAYMENT_CONFIRMED` para o endpoint do webhook e verificar se o assinante correspondente é criado ou atualizado corretamente no banco de dados.

**Acceptance Scenarios**:

1. **Given** um novo pagamento de assinatura é confirmado no Asaas, **When** o webhook é recebido, **Then** um novo assinante é criado no banco de dados com os dados do cliente e a `next_due_date` definida para 30 dias no futuro.
2. **Given** um pagamento de um assinante existente é confirmado no Asaas, **When** o webhook é recebido, **Then** a `next_due_date` do assinante existente é atualizada para 30 dias no futuro.

---

### User Story 2 - Registrar Falhas na Comunicação com a API Asaas (Priority: P2)

Se a chamada para a API do Asaas para buscar os detalhes do cliente falhar por qualquer motivo (ex: token inválido, cliente não encontrado, erro de rede), o sistema deve registrar o erro em uma nova tabela de logs. O log deve incluir o payload completo do webhook e a mensagem de erro.

**Why this priority**: Garante que nenhuma notificação de pagamento seja perdida devido a falhas temporárias ou inesperadas, permitindo a análise e o reprocessamento manual ou automático.

**Independent Test**: Simular uma falha na API do Asaas (usando um mock ou um ID de cliente inválido) ao processar um webhook e verificar se um novo registro de erro é criado na tabela de logs com as informações corretas.

**Acceptance Scenarios**:

1. **Given** um webhook de pagamento é recebido, **When** a chamada à API do Asaas para `GET /customers/{id}` retorna um erro (e.g., 404, 500), **Then** um novo registro de log de erro é criado contendo o corpo do webhook e a mensagem de erro da API.

---

### Edge Cases

- O que acontece se o payload do webhook estiver malformado ou não contiver o `payment.customer`?
- Como o sistema lida com múltiplas notificações para o mesmo pagamento (duplicatas)?
- O que acontece se o token `ASAAS_API_KEY` for inválido ou expirar?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor um endpoint de webhook (`/api/webhook/asaas`) para receber notificações do Asaas.
- **FR-002**: O sistema DEVE extrair o `payment.customer` do corpo da notificação de webhook.
- **FR-003**: O sistema DEVE fazer uma chamada `GET` para `https://api.asaas.com/v3/customers/{customer_id}` para obter os dados do cliente.
- **FR-004**: A chamada à API do Asaas DEVE incluir os headers `accept: application/json` e `access_token` lido da variável de ambiente `ASAAS_API_KEY`.
- **FR-005**: Se a chamada à API do Asaas falhar, o sistema DEVE registrar o corpo completo do webhook e a mensagem de erro em uma nova tabela de logs (`asaas_webhook_logs`).
- **FR-006**: Se a chamada for bem-sucedida, o sistema DEVE verificar se um assinante com o mesmo `cpfCnpj` ou `email` já existe na tabela `subscribers`.
- **FR-007**: Se o assinante existir, o sistema DEVE atualizar sua `next_due_date` para `now() + 30 dias`.
- **FR-008**: Se o assinante não existir, o sistema DEVE criar um novo registro na tabela `subscribers` com os dados do cliente, `plan_type = 'mensal'` e `next_due_date = now() + 30 dias`.
- **FR-009**: A nova integração NÃO DEVE interferir na integração existente do Stripe.

### Key Entities *(include if feature involves data)*

- **Subscriber**: Representa um cliente pagante. Atributos: `name`, `email`, `cpfCnpj`, `plan_type`, `next_due_date`.
- **AsaasWebhookLog**: Representa um log de erro de uma notificação de webhook do Asaas que falhou ao ser processada. Atributos: `webhook_body`, `error_message`, `timestamp`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos webhooks de `PAYMENT_CONFIRMED` do Asaas resultam em um assinante criado ou atualizado no banco de dados dentro de 5 segundos após o recebimento.
- **SC-002**: 100% das falhas de comunicação com a API do Asaas durante o processamento do webhook são registradas na tabela `asaas_webhook_logs`.
- **SC-003**: O tempo de processamento do webhook, desde o recebimento até a confirmação do banco de dados, deve ser inferior a 2 segundos em 95% dos casos.
- **SC-004**: A integração do Stripe continua funcionando sem nenhuma regressão.
