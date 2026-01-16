#!/bin/bash

# Script para testar o filtro de status de assinantes
# Execute este script para verificar se a API está retornando resultados corretos

echo "=== Testando filtro de assinantes ==="
echo ""

# Substitua pela URL do seu ambiente
BASE_URL="${1:-http://localhost:3000}"

echo "1. Testando filtro com status 'vencido':"
curl -s "${BASE_URL}/api/subscribers/list?status=vencido&pageSize=5" | jq '.total, .data[0].status' 2>/dev/null || echo "Erro ao fazer requisição"

echo ""
echo "2. Testando filtro com status 'ativo':"
curl -s "${BASE_URL}/api/subscribers/list?status=ativo&pageSize=5" | jq '.total, .data[0].status' 2>/dev/null || echo "Erro ao fazer requisição"

echo ""
echo "3. Testando sem filtro (todos):"
curl -s "${BASE_URL}/api/subscribers/list?pageSize=5" | jq '.total' 2>/dev/null || echo "Erro ao fazer requisição"

echo ""
echo "=== Teste concluído ==="
