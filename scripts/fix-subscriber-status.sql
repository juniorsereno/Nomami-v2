-- Script para verificar e corrigir problemas com status de assinantes
-- Execute este script para diagnosticar e corrigir o problema

-- 1. Verificar todos os status únicos no banco (incluindo espaços e case)
SELECT 
  status,
  LENGTH(status) as tamanho,
  COUNT(*) as quantidade,
  CASE 
    WHEN status != TRIM(status) THEN 'TEM ESPAÇOS'
    ELSE 'OK'
  END as tem_espacos
FROM subscribers
GROUP BY status
ORDER BY status;

-- 2. Verificar assinantes com status que parecem "vencido" mas podem ter problemas
SELECT 
  id,
  name,
  status,
  LENGTH(status) as tamanho_status,
  next_due_date,
  expired_at
FROM subscribers
WHERE LOWER(TRIM(status)) = 'vencido'
LIMIT 10;

-- 3. CORREÇÃO: Limpar espaços extras e padronizar case dos status
-- DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A CORREÇÃO:

-- UPDATE subscribers 
-- SET status = LOWER(TRIM(status))
-- WHERE status != LOWER(TRIM(status));

-- 4. Verificar resultado após correção
-- SELECT status, COUNT(*) 
-- FROM subscribers 
-- GROUP BY status;
