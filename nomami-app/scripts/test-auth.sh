#!/bin/bash

echo "🔍 Testando Autenticação do NoMami App"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base (ajuste conforme necessário)
BASE_URL="${1:-http://localhost:3000}"

echo "📍 URL Base: $BASE_URL"
echo ""

# Teste 1: Acessar raiz deve redirecionar para login
echo "Teste 1: Acessar raiz sem autenticação"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/")
if [ "$RESPONSE" = "200" ]; then
    # Verificar se está na página de login
    CONTENT=$(curl -s -L "$BASE_URL/")
    if echo "$CONTENT" | grep -q "Faça login"; then
        echo -e "${GREEN}✅ PASSOU${NC} - Redirecionou para login"
    else
        echo -e "${RED}❌ FALHOU${NC} - Não redirecionou para login"
    fi
else
    echo -e "${YELLOW}⚠️  AVISO${NC} - Status: $RESPONSE"
fi
echo ""

# Teste 2: Acessar dashboard sem autenticação
echo "Teste 2: Acessar dashboard sem autenticação"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/dashboard")
if [ "$RESPONSE" = "200" ]; then
    CONTENT=$(curl -s -L "$BASE_URL/dashboard")
    if echo "$CONTENT" | grep -q "Faça login"; then
        echo -e "${GREEN}✅ PASSOU${NC} - Dashboard protegido, redirecionou para login"
    else
        echo -e "${RED}❌ FALHOU${NC} - Dashboard acessível sem login!"
    fi
else
    echo -e "${YELLOW}⚠️  AVISO${NC} - Status: $RESPONSE"
fi
echo ""

# Teste 3: Verificar se página de login está acessível
echo "Teste 3: Página de login acessível"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASSOU${NC} - Página de login acessível"
else
    echo -e "${RED}❌ FALHOU${NC} - Página de login não acessível (Status: $RESPONSE)"
fi
echo ""

# Teste 4: Verificar se API de autenticação está funcionando
echo "Teste 4: API de autenticação"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/session")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASSOU${NC} - API de autenticação respondendo"
else
    echo -e "${RED}❌ FALHOU${NC} - API de autenticação com problema (Status: $RESPONSE)"
fi
echo ""

echo "======================================"
echo "✨ Testes concluídos!"
echo ""
echo "💡 Dicas:"
echo "  - Se algum teste falhou, verifique os logs do servidor"
echo "  - Limpe os cookies do navegador antes de testar manualmente"
echo "  - Execute: npm run rebuild para limpar cache"
