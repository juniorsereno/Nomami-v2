-- Script para corrigir categorias de parceiros

-- 1. Verificar categorias atuais no banco
SELECT 
  categoria,
  COUNT(*) as quantidade
FROM parceiros
WHERE categoria IS NOT NULL
GROUP BY categoria
ORDER BY categoria;

-- 2. Verificar parceiros com "Hostifruti" ou "Mercado/Hostifruti"
SELECT 
  id,
  nome,
  categoria
FROM parceiros
WHERE categoria LIKE '%Hostifruti%' OR categoria LIKE '%hostifruti%';

-- 3. CORREÇÃO: Atualizar "Hostifruti" para "Hortifruti"
UPDATE parceiros 
SET categoria = REPLACE(categoria, 'Hostifruti', 'Hortifruti')
WHERE categoria LIKE '%Hostifruti%';

UPDATE parceiros 
SET categoria = REPLACE(categoria, 'hostifruti', 'Hortifruti')
WHERE categoria LIKE '%hostifruti%';

-- 4. Atualizar "Mercado/Hostifruti" para "Mercado, Hortifruti" (mantém ambas as categorias)
UPDATE parceiros 
SET categoria = 'Mercado, Hortifruti'
WHERE categoria = 'Mercado/Hostifruti';

-- 5. Verificar resultado após correção
SELECT 
  categoria,
  COUNT(*) as quantidade
FROM parceiros
WHERE categoria IS NOT NULL
GROUP BY categoria
ORDER BY categoria;

-- 6. Listar parceiros com múltiplas categorias (após migração)
SELECT 
  id,
  nome,
  categoria,
  ARRAY_LENGTH(STRING_TO_ARRAY(categoria, ','), 1) as num_categorias
FROM parceiros
WHERE categoria LIKE '%,%'
ORDER BY num_categorias DESC;
