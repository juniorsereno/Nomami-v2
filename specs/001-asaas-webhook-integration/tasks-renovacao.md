# Tarefas: Regra de Renovação de Assinatura Asaas

## Contexto
O webhook `PAYMENT_CONFIRMED` do Asaas é disparado tanto para novos pagamentos quanto para renovações.
A regra para identificar uma renovação é:
- Se `payment.dateCreated` for mais de 7 dias anterior a `event.dateCreated` (data do pagamento), trata-se de uma renovação.

## Ações Necessárias

1.  **Banco de Dados**:
    - [ ] Adicionar coluna `asaas_subscription_id` (VARCHAR) na tabela `subscribers` para vincular o assinante à assinatura do Asaas.

2.  **Lógica do Webhook (`nomami-app/app/api/webhook/asaas/route.ts`)**:
    - [ ] Extrair `payment.subscription` e `payment.dateCreated` do payload.
    - [ ] Calcular a diferença de dias entre `event.dateCreated` e `payment.dateCreated`.
    - [ ] **Se Diferença > 7 dias (Renovação)**:
        - Buscar assinante pelo `asaas_subscription_id`.
        - Se encontrado, atualizar `next_due_date` para `event.dateCreated` + 30 dias.
        - Registrar log de "Renovação processada".
    - [ ] **Se Diferença <= 7 dias (Novo/Recente)**:
        - Manter a lógica atual de busca por CPF/Email.
        - Ao criar ou atualizar o assinante, salvar também o `asaas_subscription_id`.

3.  **Testes**:
    - [ ] Criar payload de teste simulando renovação (datas distantes).
    - [ ] Criar payload de teste simulando novo pagamento (datas próximas).