# Plano de Padronização de Status

## Objetivo
Padronizar os valores da coluna `status` na tabela `subscribers` e em todo o código da aplicação.

## Situação Atual
- **Banco de Dados (subscribers):**
  - Valores encontrados: `active`, `inativo`, `ativo`
- **Código:**
  - Uso misto de `active`, `ativo`, `inativo`, `vencido` (não encontrado no DB, mas mencionado na task)

## Padrão Definido
- **Positivo:** `ativo`
- **Negativo:** `vencido` (para assinaturas expiradas/não pagas) ou `inativo` (para cancelamentos manuais/outros)
  - *Nota:* A task pede especificamente: "o negativo será 'vencido'". Vou assumir que `inativo` deve ser migrado para `vencido` ou mantido se tiver significado diferente.
  - *Decisão:* Vou migrar `active` -> `ativo`.
  - Vou migrar `inativo` -> `vencido` (conforme solicitação "o negativo será 'vencido'"). Se houver distinção semântica importante, precisaremos ajustar, mas a instrução foi direta.
  - Vou manter `ativo` como está.

## Etapas

1.  **Atualização do Código:**
    *   Substituir `status = 'active'` por `status = 'ativo'` em queries SQL.
    *   Substituir `status = 'inativo'` por `status = 'vencido'` onde aplicável (verificar contexto).
    *   Atualizar interfaces e tipos TypeScript.
    *   Atualizar componentes de UI (Badges, Selects).

2.  **Migração de Dados:**
    *   Executar SQL para atualizar valores na tabela `subscribers`.
        ```sql
        UPDATE subscribers SET status = 'ativo' WHERE status = 'active';
        UPDATE subscribers SET status = 'vencido' WHERE status = 'inativo';
        ```

3.  **Verificação:**
    *   Verificar se a aplicação compila e roda sem erros.
    *   Verificar se os status aparecem corretamente na UI.

## Arquivos Afetados
- `nomami-app/lib/queries.ts`
- `nomami-app/lib/asaas/webhook-handler.ts`
- `nomami-app/components/add-partner-form.tsx` (Parceiros usa 'ativo'/'inativo', verificar se precisa mudar também. A task fala "padronização no nosso banco de dados... verifique a coluna status... temos clientes...". Parceiros tem coluna `ativo` boolean, mas o form usa string. Vou focar em `subscribers` primeiro, mas padronizar onde fizer sentido).
- `nomami-app/app/api/partners/route.ts`
- `nomami-app/app/api/subscribers/stats/route.ts`
- `nomami-app/app/api/webhook/stripe/route.ts`
- `nomami-app/app/api/metrics/historical/route.ts`
- `nomami-app/app/api/metrics/route.ts`
- `nomami-app/app/api/metrics/variations/route.ts`
- `nomami-app/app/api/telemedicine/clients/route.ts` (Usa `telemedicine_batches` com status 'active'. Verificar se deve mudar).
- `nomami-app/app/api/partners/[id]/route.ts`
- `nomami-app/components/partner-actions.tsx`
- `nomami-app/components/subscriber-edit-dialog.tsx`
- `nomami-app/components/telemedicine-batch-details-dialog.tsx`
- `nomami-app/components/telemedicine-batches-table.tsx`

**Observação sobre outras tabelas:**
- `parceiros`: Coluna `ativo` é boolean. O código usa strings 'ativo'/'inativo' para UI e converte. Manterei assim por enquanto pois é boolean no DB.
- `telemedicine_batches`: Coluna `status` (varchar). Código usa 'active'. Vou padronizar para 'ativo' também para consistência geral, se o usuário concordar. A task foca em "clientes" (subscribers), mas "padronização no nosso banco de dados" sugere geral. Vou focar em `subscribers` que é o crítico mencionado ("temos clientes...").

**Foco Principal:** Tabela `subscribers`.