# Plano de Expiração Automática de Status

## Objetivo
Garantir que assinantes com `next_due_date` no passado tenham seu status atualizado para `vencido` automaticamente ou em tempo real.

## Problema
Atualmente, o status é definido apenas nos webhooks de pagamento. Se um pagamento não ocorre (e o webhook de falha não é processado ou não altera o status), o assinante permanece `ativo` mesmo com a data de vencimento expirada.

## Solução Proposta

### Opção 1: Verificação em Tempo Real (Leitura)
Ao consultar o status do assinante (ex: login, acesso a benefícios), verificar se `next_due_date < NOW()`. Se sim, considerar como `vencido`, independentemente do que está na coluna `status`.
*   **Prós:** Imediato, não requer jobs agendados.
*   **Contras:** A coluna `status` no banco pode ficar desatualizada ("suja"), atrapalhando relatórios simples que olham apenas para a coluna.

### Opção 2: Atualização Automática (Escrita)
Criar um mecanismo para atualizar a coluna `status` no banco de dados.
*   **Abordagem A (Job Agendado):** Um cron job (ex: GitHub Actions, Vercel Cron ou pg_cron no Neon) que roda diariamente e executa `UPDATE subscribers SET status = 'vencido' WHERE next_due_date < NOW() AND status = 'ativo'`.
*   **Abordagem B (Trigger/Lazy Update):** Atualizar o status quando o registro for acessado ou através de uma trigger (embora triggers baseadas em tempo não existam nativamente no Postgres da forma "disparar quando o tempo passar").

### Decisão: Abordagem Híbrida
1.  **Limpeza Inicial:** Executar uma query imediata para atualizar todos os vencidos.
2.  **Lógica de Aplicação (Segurança):** Nas queries críticas de verificação de acesso (ex: login, carteirinha), adicionar a cláusula `AND next_due_date > NOW()` ou tratar a lógica na aplicação.
3.  **Manutenção (Cron):** Configurar um endpoint de API (ex: `/api/cron/update-status`) que pode ser chamado por um Cron Job (Vercel Cron é gratuito para hobby/pro) para manter o banco limpo.

## Plano de Execução

1.  **Análise:** Verificar quantos usuários estão nessa situação.
2.  **Correção Imediata:** Executar SQL para atualizar status dos vencidos.
3.  **Implementação de Endpoint Cron:** Criar `/api/cron/check-expired` que atualiza os status.
4.  **Atualização de Queries Críticas:** Revisar onde o status é verificado para garantir que a data também seja checada (opcional, mas recomendado para robustez).

## SQL de Correção
```sql
UPDATE subscribers 
SET status = 'vencido' 
WHERE status = 'ativo' 
  AND next_due_date < CURRENT_DATE;