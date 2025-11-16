# Feature Specification: Integração de Pagamento com Asaas

**Feature Branch**: `003-asaas-payment-integration`  
**Created**: 2025-10-23  
**Status**: Draft  
**Input**: User description: "Integração com o Asaas que é o gateway de pagamento da assinatura, nas configurações precisamos de uma opção "Webhook", onde o sistema deverá gerar um link webhook que será inserido no asaas, onde o asaas dispara o webhook sempre que um cliente efetua uma assinatura. Após receber essas informações o sistema deverá chamar um API do asaas para buscar mais informações desse cliente e efetuar o cadastro do cliente no banco de dados."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receber e Processar Webhook de Pagamento Confirmado (Priority: P1)

O sistema deve ser capaz de receber um webhook do Asaas quando um pagamento de assinatura é confirmado. Ao receber o webhook, o sistema deve extrair o ID do cliente e buscar informações detalhadas sobre ele na API do Asaas.

**Why this priority**: Este é o gatilho inicial para todo o processo de cadastro de um novo assinante. Sem ele, nenhuma outra ação pode ocorrer, tornando-o a funcionalidade mais crítica para a integração.

**Independent Test**: Pode ser testado enviando uma requisição POST simulada para o endpoint do webhook com o JSON de exemplo fornecido. O sistema deve então fazer uma chamada GET para uma API mockada do Asaas para verificar se a requisição de busca de cliente é feita corretamente.

**Acceptance Scenarios**:

1. **Given** o sistema recebe um webhook do Asaas com o evento `PAYMENT_CONFIRMED`, **When** o sistema processa o webhook, **Then** ele deve fazer uma chamada GET para `https://api.asaas.com/v3/customers/{customer_id}` usando o `customer_id` extraído do corpo do webhook.
2. **Given** o sistema recebe um webhook com um evento diferente de `PAYMENT_CONFIRMED`, **When** o sistema processa o webhook, **Then** ele deve ignorar a notificação e registrar um log para fins de auditoria.

---

### User Story 2 - Cadastrar Novo Assinante no Banco de Dados (Priority: P1)

Após obter os dados do cliente da API do Asaas, o sistema deve cadastrar esse cliente como um novo assinante no banco de dados local.

**Why this priority**: Esta é a ação principal que registra o novo cliente no sistema, permitindo que ele tenha acesso aos serviços pagos. É a conclusão do fluxo de assinatura.

**Independent Test**: Pode ser testado chamando a função de cadastro diretamente com um objeto de cliente mockado, simulando a resposta da API do Asaas. A verificação é feita consultando o banco de dados para confirmar se o registro foi criado corretamente.

**Acceptance Scenarios**:

1. **Given** o sistema obteve com sucesso os dados de um cliente da API do Asaas, **When** o sistema tenta cadastrar o cliente, **Then** um novo registro de assinante deve ser criado no banco de dados com os dados do cliente, o plano definido como "mensal" e a data de vencimento (`nextdue`) definida para 30 dias após a data de criação.
2. **Given** um cliente com o mesmo `cpfCnpj` ou `email` já existe no banco de dados, **When** o sistema recebe um novo pagamento confirmado para esse cliente, **Then** o sistema deve atualizar os dados do assinante existente (como a data de vencimento) em vez de criar um novo registro duplicado.

---

### User Story 3 - Visualizar Logs de Erro do Webhook (Priority: P2)

O administrador do sistema deve ser capaz de visualizar um log de todos os erros que ocorreram durante o processamento de webhooks do Asaas, incluindo o corpo da requisição recebida e a mensagem de erro.

**Why this priority**: Essencial para a manutenção e depuração da integração. Sem um sistema de logs, seria impossível diagnosticar falhas no processamento de pagamentos, o que poderia levar à perda de assinantes.

**Independent Test**: Pode ser testado gerando um erro intencional no processamento do webhook (por exemplo, simulando uma falha na API do Asaas) e verificando se o erro é registrado corretamente na nova seção de logs.

**Acceptance Scenarios**:

1. **Given** ocorre uma falha ao chamar a API do Asaas para buscar os dados do cliente, **When** o processamento do webhook falha, **Then** um novo registro de log deve ser criado contendo o corpo completo do webhook recebido e a mensagem de erro retornada pela API.
2. **Given** o administrador está na área de configurações do webhook, **When** ele acessa a seção de logs, **Then** ele deve ver uma lista de todos os erros registrados, ordenados por data (do mais recente para o mais antigo).

---

### Edge Cases

- O que acontece se a API do Asaas para buscar os dados do cliente estiver indisponível ou retornar um erro 5xx?
- Como o sistema lida com webhooks duplicados do Asaas para o mesmo evento de pagamento?
- O que acontece se os dados recebidos do Asaas (tanto no webhook quanto na API de cliente) estiverem incompletos ou malformados?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor um endpoint de webhook público e seguro para receber notificações do Asaas.
- **FR-002**: O sistema DEVE ser capaz de processar e validar notificações de webhook com o evento `PAYMENT_CONFIRMED`.
- **FR-003**: O sistema DEVE fazer uma chamada GET para a API do Asaas (`/v3/customers/{id}`) para obter detalhes do cliente.
- **FR-004**: O sistema DEVE usar o `access_token` estático fornecido para autenticar todas as chamadas à API do Asaas.
- **FR-005**: O sistema DEVE cadastrar um novo assinante no banco de dados com as informações obtidas do Asaas.
- **FR-006**: O plano do assinante DEVE ser sempre definido como "mensal" no momento do cadastro.
- **FR-007**: A data de próximo vencimento (`nextdue`) DEVE ser calculada como a data de criação do pagamento + 30 dias.
- **FR-008**: Em caso de falha na comunicação com a API do Asaas, o sistema NÃO DEVE tentar novamente. A falha deve ser registrada em um log.
- **FR-009**: O sistema DEVE fornecer uma interface na área de configurações para que o administrador possa visualizar os logs de erro do webhook, incluindo o corpo da requisição e a mensagem de erro.

### Key Entities *(include if feature involves data)*

- **Assinante (Subscriber)**: Representa um cliente que pagou por uma assinatura. Atributos chave: `name`, `email`, `cpfCnpj`, `mobilePhone`, `plan`, `nextdueDate`, `asaasCustomerId`.
- **WebhookEvent**: Representa a notificação recebida do Asaas. Atributos chave: `id`, `event`, `payment`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos webhooks de `PAYMENT_CONFIRMED` do Asaas devem resultar em um novo assinante sendo cadastrado ou atualizado no banco de dados em menos de 5 segundos.
- **SC-002**: O sistema deve ser capaz de processar um pico de pelo menos 10 webhooks por segundo sem degradação de performance.
- **SC-003**: A taxa de erro no processamento de webhooks e cadastro de clientes deve ser inferior a 0.1%.
- **SC-004**: O tempo de resposta do endpoint do webhook para a confirmação de recebimento ao Asaas deve ser inferior a 500ms.
