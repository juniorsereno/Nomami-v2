# Tarefas de Implementação: Integração de Pagamento com Asaas

**Feature Branch**: `003-asaas-payment-integration`
**Spec**: [`spec.md`](./spec.md)
**Plano**: [`plan.md`](./plan.md)

## Backend

- [x] **Tarefa 1.1**: Criar a Rota da API do Webhook (`nomami-app/app/api/webhook/asaas/route.ts`).
- [x] **Tarefa 1.2**: Implementar a Lógica de Processamento do Webhook, incluindo validação, chamada à API do Asaas e cadastro/atualização de assinantes.
- [x] **Tarefa 3.3**: Criar a API para Listar os Logs (`nomami-app/app/api/webhook/asaas/logs/route.ts`).

## Banco de Dados

- [x] **Tarefa 2.1**: Criar a Tabela `asaas_webhook_logs` para armazenar logs de erro.
- [x] **Tarefa 2.2**: Adicionar a coluna `asaas_customer_id` à tabela `subscribers`.

## Frontend

- [x] **Tarefa 3.1**: Modificar a Página de Configurações (`nomami-app/app/settings/page.tsx`) para exibir o link do webhook.
- [x] **Tarefa 3.2**: Criar o componente da Tabela de Logs de Erro (`nomami-app/components/asaas-logs-table.tsx`).