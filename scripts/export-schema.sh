#!/bin/bash

# Script para exportar o schema do banco de dados PostgreSQL
# Uso: ./scripts/export-schema.sh

set -e

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Exportando schema do banco de dados...${NC}\n"

# Verifica se o arquivo .env existe
if [ ! -f "nomami-app/.env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado em nomami-app/.env${NC}"
    exit 1
fi

# Carrega as variáveis do .env
export $(grep -v '^#' nomami-app/.env | xargs)

# Verifica se DATABASE_POOL_URL está definida
if [ -z "$DATABASE_POOL_URL" ]; then
    echo -e "${RED}❌ DATABASE_POOL_URL não está definida no .env${NC}"
    exit 1
fi

# Extrai informações da connection string
# Formato: postgresql://user:password@host:port/database?params
DB_URL_CLEAN=$(echo $DATABASE_POOL_URL | sed 's/?.*$//')
DB_USER=$(echo $DB_URL_CLEAN | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL_CLEAN | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL_CLEAN | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL_CLEAN | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL_CLEAN | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "📊 Conectando ao banco: ${GREEN}${DB_NAME}${NC}"
echo -e "🌐 Host: ${GREEN}${DB_HOST}:${DB_PORT}${NC}\n"

# Define o arquivo de saída
OUTPUT_FILE="db-schema.md"

# Exporta apenas o schema (sem dados)
PGPASSWORD=$DB_PASS pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  --no-security-labels \
  --no-comments \
  > $OUTPUT_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema exportado com sucesso!${NC}"
    echo -e "📄 Arquivo: ${GREEN}${OUTPUT_FILE}${NC}"
    
    # Mostra estatísticas
    TABLES=$(grep -c "CREATE TABLE" $OUTPUT_FILE || echo "0")
    INDEXES=$(grep -c "CREATE.*INDEX" $OUTPUT_FILE || echo "0")
    CONSTRAINTS=$(grep -c "ALTER TABLE.*ADD CONSTRAINT" $OUTPUT_FILE || echo "0")
    
    echo -e "\n📈 Estatísticas:"
    echo -e "   • Tabelas: ${GREEN}${TABLES}${NC}"
    echo -e "   • Índices: ${GREEN}${INDEXES}${NC}"
    echo -e "   • Constraints: ${GREEN}${CONSTRAINTS}${NC}"
else
    echo -e "${RED}❌ Erro ao exportar schema${NC}"
    exit 1
fi
