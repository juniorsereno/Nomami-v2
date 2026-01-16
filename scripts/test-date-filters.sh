#!/bin/bash

# Script para testar os diferentes filtros de data com status
# Execute: ./scripts/test-date-filters.sh [URL]

BASE_URL="${1:-http://localhost:3000}"

echo "=== Testando Filtros de Data Contextuais ==="
echo ""

echo "1. Sem filtro de status + Últimos 7 dias (deve usar created_at):"
curl -s "${BASE_URL}/api/subscribers/list?dateRange=7d&pageSize=3" | jq '{total: .total, primeiros_3: [.data[0:3][] | {name, status, created_at}]}' 2>/dev/null || echo "Erro"

echo ""
echo "2. Status 'ativo' + Últimos 7 dias (deve usar start_date):"
curl -s "${BASE_URL}/api/subscribers/list?status=ativo&dateRange=7d&pageSize=3" | jq '{total: .total, primeiros_3: [.data[0:3][] | {name, status, start_date}]}' 2>/dev/null || echo "Erro"

echo ""
echo "3. Status 'vencido' + Últimos 7 dias (deve usar expired_at):"
curl -s "${BASE_URL}/api/subscribers/list?status=vencido&dateRange=7d&pageSize=3" | jq '{total: .total, primeiros_3: [.data[0:3][] | {name, status, expired_at}]}' 2>/dev/null || echo "Erro"

echo ""
echo "4. Sem filtro de status + Últimos 30 dias (deve usar created_at):"
curl -s "${BASE_URL}/api/subscribers/list?dateRange=30d&pageSize=1" | jq '{total: .total}' 2>/dev/null || echo "Erro"

echo ""
echo "=== Teste concluído ==="
echo ""
echo "Legenda:"
echo "- Sem status: filtra por created_at (data de criação no sistema)"
echo "- Status 'ativo': filtra por start_date (data de início da assinatura)"
echo "- Status 'vencido': filtra por expired_at (data de vencimento)"
