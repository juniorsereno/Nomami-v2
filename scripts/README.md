# Scripts de Banco de Dados

## Exportar Schema do Banco de Dados

Existem três formas de exportar o schema do banco de dados para o arquivo `db-schema.md`:

### Opção 1: Script Node.js (Recomendado)
Não requer instalação do PostgreSQL client tools.

```bash
cd nomami-app
node scripts/export-db-schema.mjs
```

**Vantagens:**
- ✅ Não precisa instalar `pg_dump`
- ✅ Funciona em qualquer sistema operacional
- ✅ Usa a mesma conexão do app

### Opção 2: Script Bash (Linux/Mac)
Requer `pg_dump` instalado.

```bash
chmod +x scripts/export-schema.sh
./scripts/export-schema.sh
```

**Instalação do pg_dump:**
- **Ubuntu/Debian:** `sudo apt-get install postgresql-client`
- **Mac:** `brew install postgresql`

### Opção 3: Script PowerShell (Windows)
Requer `pg_dump` instalado.

```powershell
.\scripts\export-schema.ps1
```

**Instalação do pg_dump:**
- Baixe o PostgreSQL: https://www.postgresql.org/download/windows/
- Durante a instalação, selecione "Command Line Tools"

## O que é exportado?

O script exporta:
- ✅ Schemas (public, auth, neon_auth, etc.)
- ✅ Tipos customizados (ENUMs)
- ✅ Tabelas com todas as colunas
- ✅ Primary Keys
- ✅ Foreign Keys
- ✅ Unique Constraints
- ✅ Check Constraints
- ✅ Índices

**Não exporta:**
- ❌ Dados das tabelas
- ❌ Comentários
- ❌ Permissões/Roles
- ❌ Tablespaces

## Quando usar?

Execute o script sempre que:
- 🔄 Criar uma nova migration
- 📝 Atualizar a documentação do banco
- 🐛 Debugar problemas de schema
- 👥 Compartilhar estrutura com a equipe

## Arquivo de Saída

O schema é exportado para: `db-schema.md` (na raiz do projeto)

Este arquivo pode ser:
- Versionado no Git
- Usado como documentação
- Comparado entre versões
- Compartilhado com a equipe

## Troubleshooting

### Erro: "DATABASE_POOL_URL not set"
Verifique se o arquivo `nomami-app/.env` existe e contém a variável `DATABASE_POOL_URL`.

### Erro: "pg_dump not found"
Use a Opção 1 (Node.js) ou instale o PostgreSQL client tools.

### Erro: "Connection refused"
Verifique se:
- A URL do banco está correta
- O banco está acessível
- As credenciais estão corretas
- O firewall permite a conexão

## Exemplo de Uso

```bash
# 1. Criar uma nova migration
cd nomami-app
node scripts/run-migration.mjs migrations/021_create_telemedicine_api_logs.sql

# 2. Exportar o schema atualizado
node scripts/export-db-schema.mjs

# 3. Verificar as mudanças
git diff db-schema.md

# 4. Commitar as mudanças
git add db-schema.md migrations/021_create_telemedicine_api_logs.sql
git commit -m "feat: add telemedicine API logs table"
```
