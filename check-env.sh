#!/bin/bash

echo "🔍 Verificando Configuração do Ambiente"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Verificar se .env existe
echo "1. Verificando arquivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
else
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
    echo "   Execute: cp .env.example .env"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar AUTH_SECRET
echo "2. Verificando AUTH_SECRET..."
if [ -f ".env" ]; then
    AUTH_SECRET=$(grep "^AUTH_SECRET=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$AUTH_SECRET" ]; then
        echo -e "${RED}❌ AUTH_SECRET não está definido${NC}"
        echo "   Gere com: openssl rand -base64 32"
        ERRORS=$((ERRORS + 1))
    elif [ "$AUTH_SECRET" = "your-auth-secret-key-here-generate-with-openssl" ]; then
        echo -e "${YELLOW}⚠️  AUTH_SECRET está com valor de exemplo${NC}"
        echo "   Gere um novo com: openssl rand -base64 32"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ AUTH_SECRET configurado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar (arquivo .env não existe)${NC}"
fi
echo ""

# Verificar DATABASE_URL
echo "3. Verificando DATABASE_URL..."
if [ -f ".env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL não está definido${NC}"
        ERRORS=$((ERRORS + 1))
    elif [[ "$DATABASE_URL" == *"user:password@host"* ]]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL está com valor de exemplo${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ DATABASE_URL configurado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar (arquivo .env não existe)${NC}"
fi
echo ""

# Verificar ASAAS_API_KEY
echo "4. Verificando ASAAS_API_KEY..."
if [ -f ".env" ]; then
    ASAAS_API_KEY=$(grep "^ASAAS_API_KEY=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$ASAAS_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  ASAAS_API_KEY não está definido${NC}"
        echo "   (Opcional se não usar Asaas)"
    elif [ "$ASAAS_API_KEY" = "your-asaas-api-key" ]; then
        echo -e "${YELLOW}⚠️  ASAAS_API_KEY está com valor de exemplo${NC}"
    else
        echo -e "${GREEN}✅ ASAAS_API_KEY configurado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar (arquivo .env não existe)${NC}"
fi
echo ""

# Verificar Docker
echo "5. Verificando Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker instalado${NC}"
    docker --version
else
    echo -e "${RED}❌ Docker não está instalado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar Docker Compose
echo "6. Verificando Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose instalado${NC}"
    docker-compose --version
else
    echo -e "${RED}❌ Docker Compose não está instalado${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar porta 3000
echo "7. Verificando porta 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Porta 3000 está em uso${NC}"
    echo "   Processo usando a porta:"
    lsof -i :3000
else
    echo -e "${GREEN}✅ Porta 3000 disponível${NC}"
fi
echo ""

# Resumo
echo "========================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✨ Tudo pronto para o deploy!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. docker-compose build --no-cache"
    echo "  2. docker-compose up -d"
    echo "  3. docker-compose logs -f nomami-app"
else
    echo -e "${RED}❌ Encontrados $ERRORS problema(s)${NC}"
    echo ""
    echo "Corrija os problemas acima antes de fazer o deploy."
fi
echo ""
