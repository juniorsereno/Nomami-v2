-- Script para corrigir especificamente "Mercado/Hortifruti"

-- 1. Verificar parceiros com "Mercado/Hortifruti"
SELECT 
  id,
  nome,
  categoria
FROM parceiros
WHERE categoria = 'Mercado/Hortifruti';

-- 2. Atualizar para o novo formato com múltiplas categorias
UPDATE parceiros 
SET categoria = 'Mercado, Hortifruti'
WHERE categoria = 'Mercado/Hortifruti';

-- 3. Verificar resultado
SELECT 
  categoria,
  COUNT(*) as quantidade
FROM parceiros
WHERE categoria LIKE '%Hortifruti%' OR categoria LIKE '%Mercado%'
GROUP BY categoria
ORDER BY categoria;
