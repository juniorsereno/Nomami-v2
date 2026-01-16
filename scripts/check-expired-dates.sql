-- Script para verificar assinantes vencidos e suas datas de expiração

-- 1. Verificar quantos assinantes vencidos existem
SELECT 
  COUNT(*) as total_vencidos,
  COUNT(expired_at) as com_expired_at,
  COUNT(*) - COUNT(expired_at) as sem_expired_at
FROM subscribers
WHERE LOWER(TRIM(status)) = 'vencido';

-- 2. Ver exemplos de assinantes vencidos com e sem expired_at
SELECT 
  id,
  name,
  status,
  start_date,
  next_due_date,
  expired_at,
  CASE 
    WHEN expired_at IS NULL THEN 'SEM DATA DE EXPIRAÇÃO'
    ELSE 'OK'
  END as situacao
FROM subscribers
WHERE LOWER(TRIM(status)) = 'vencido'
ORDER BY expired_at DESC NULLS LAST
LIMIT 20;

-- 3. Verificar assinantes vencidos nos últimos 7 dias
SELECT 
  COUNT(*) as vencidos_ultimos_7_dias
FROM subscribers
WHERE LOWER(TRIM(status)) = 'vencido'
  AND expired_at IS NOT NULL
  AND (expired_at AT TIME ZONE 'America/Sao_Paulo') >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo' - interval '6 days');

-- 4. CORREÇÃO: Preencher expired_at para assinantes vencidos que não têm essa data
-- Usa next_due_date como referência
-- DESCOMENTE PARA EXECUTAR:

-- UPDATE subscribers 
-- SET expired_at = next_due_date
-- WHERE LOWER(TRIM(status)) = 'vencido' 
--   AND expired_at IS NULL;

-- 5. Verificar resultado após correção
-- SELECT 
--   COUNT(*) as total_vencidos,
--   COUNT(expired_at) as com_expired_at
-- FROM subscribers
-- WHERE LOWER(TRIM(status)) = 'vencido';
