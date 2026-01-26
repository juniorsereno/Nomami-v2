# Script para exportar o schema do banco de dados PostgreSQL
# Uso: .\scripts\export-schema.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔍 Exportando schema do banco de dados...`n" -ForegroundColor Yellow

# Verifica se o arquivo .env existe
$envFile = "nomami-app\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env não encontrado em $envFile" -ForegroundColor Red
    exit 1
}

# Carrega as variáveis do .env
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$DATABASE_URL = $env:DATABASE_POOL_URL

if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_POOL_URL não está definida no .env" -ForegroundColor Red
    exit 1
}

# Extrai informações da connection string
# Formato: postgresql://user:password@host:port/database?params
$DB_URL_CLEAN = $DATABASE_URL -replace '\?.*$', ''

if ($DB_URL_CLEAN -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)') {
    $DB_USER = $matches[1]
    $DB_PASS = $matches[2]
    $DB_HOST = $matches[3]
    $DB_PORT = $matches[4]
    $DB_NAME = $matches[5]
} else {
    Write-Host "❌ Formato de URL inválido" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Conectando ao banco: " -NoNewline
Write-Host $DB_NAME -ForegroundColor Green
Write-Host "🌐 Host: " -NoNewline
Write-Host "${DB_HOST}:${DB_PORT}`n" -ForegroundColor Green

# Define o arquivo de saída
$OUTPUT_FILE = "db-schema.md"

# Define a senha como variável de ambiente para pg_dump
$env:PGPASSWORD = $DB_PASS

# Verifica se pg_dump está disponível
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue

if (-not $pgDumpPath) {
    Write-Host "❌ pg_dump não encontrado. Instale o PostgreSQL client tools." -ForegroundColor Red
    Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

try {
    # Exporta apenas o schema (sem dados)
    & pg_dump `
        -h $DB_HOST `
        -p $DB_PORT `
        -U $DB_USER `
        -d $DB_NAME `
        --schema-only `
        --no-owner `
        --no-privileges `
        --no-tablespaces `
        --no-security-labels `
        --no-comments `
        | Out-File -FilePath $OUTPUT_FILE -Encoding UTF8

    Write-Host "✅ Schema exportado com sucesso!" -ForegroundColor Green
    Write-Host "📄 Arquivo: " -NoNewline
    Write-Host $OUTPUT_FILE -ForegroundColor Green
    
    # Mostra estatísticas
    $content = Get-Content $OUTPUT_FILE -Raw
    $tables = ([regex]::Matches($content, "CREATE TABLE")).Count
    $indexes = ([regex]::Matches($content, "CREATE.*INDEX")).Count
    $constraints = ([regex]::Matches($content, "ALTER TABLE.*ADD CONSTRAINT")).Count
    
    Write-Host "`n📈 Estatísticas:"
    Write-Host "   • Tabelas: " -NoNewline
    Write-Host $tables -ForegroundColor Green
    Write-Host "   • Índices: " -NoNewline
    Write-Host $indexes -ForegroundColor Green
    Write-Host "   • Constraints: " -NoNewline
    Write-Host $constraints -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erro ao exportar schema: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpa a senha da variável de ambiente
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
