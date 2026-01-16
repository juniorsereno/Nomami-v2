-- Script para separar "Clínicas/Saúde" em "Clínicas" e "Saúde"

-- 1. Verificar parceiros com "Clínicas/Saúde"
SELECT 
  id,
  nome,
  categoria,
  beneficio
FROM parceiros
WHERE categoria = 'Clínicas/Saúde'
ORDER BY nome;

-- 2. OPÇÃO A: Atualizar todos para "Clínicas, Saúde" (mantém ambas as categorias)
UPDATE parceiros 
SET categoria = 'Clínicas, Saúde'
WHERE categoria = 'Clínicas/Saúde';

-- 3. OPÇÃO B: Atualizar manualmente baseado no tipo de serviço
-- Se preferir categorizar manualmente, use os comandos abaixo como exemplo:

-- Para parceiros que são clínicas médicas/odontológicas:
UPDATE parceiros 
SET categoria = 'Clínicas'
WHERE categoria = 'Clínicas/Saúde' 
  AND (nome ILIKE '%clínica%' OR nome ILIKE '%odonto%' OR nome ILIKE '%médic%');

-- Para parceiros que são serviços de saúde/bem-estar (massagem, pilates, etc):
UPDATE parceiros 
SET categoria = 'Bem Estar'
WHERE categoria = 'Clínicas/Saúde' 
  AND (nome ILIKE '%massagem%' OR nome ILIKE '%pilates%' OR nome ILIKE '%bem%estar%');

-- Para parceiros que são farmácias/drogarias:
UPDATE parceiros 
SET categoria = 'Farmácia'
WHERE categoria = 'Clínicas/Saúde' 
  AND (nome ILIKE '%farmácia%' OR nome ILIKE '%drogaria%');

-- 4. Verificar resultado após atualização
SELECT 
  categoria,
  COUNT(*) as quantidade
FROM parceiros
WHERE categoria IN ('Clínicas', 'Saúde', 'Clínicas, Saúde', 'Bem Estar', 'Pilates')
GROUP BY categoria
ORDER BY categoria;

-- 5. Listar todas as categorias atualizadas
SELECT 
  categoria,
  COUNT(*) as quantidade
FROM parceiros
WHERE categoria IS NOT NULL
GROUP BY categoria
ORDER BY categoria;
