# Script de verificação de ambiente para NoMami App

Write-Host "🔍 Verificando Configuração do Ambiente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ERRORS = 0

# Verificar se .env existe
Write-Host "1. Verificando arquivo .env..." -ForegroundColor White
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
    Write-Host "   Execute: Copy-Item .env.example .env" -ForegroundColor Yellow
    $ERRORS++
}
Write-Host ""

# Verificar AUTH_SECRET
Write-Host "2. Verificando AUTH_SECRET..." -ForegroundColor White
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'AUTH_SECRET="?([^"\r\n]+)"?') {
        $authSecret = $matches[1]
        if ([string]::IsNullOrWhiteSpace($authSecret)) {
            Write-Host "❌ AUTH_SECRET não está definido" -ForegroundColor Red
            Write-Host "   Gere com: openssl rand -base64 32" -ForegroundColor Yellow
            $ERRORS++
        } elseif ($authSecret -eq "your-auth-secret-key-here-generate-with-openssl") {
            Write-Host "⚠️  AUTH_SECRET está com valor de exemplo" -ForegroundColor Yellow
            Write-Host "   Gere um novo com: openssl rand -base64 32" -ForegroundColor Yellow
            $ERRORS++
        } else {
            Write-Host "✅ AUTH_SECRET configurado" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ AUTH_SECRET não encontrado no .env" -ForegroundColor Red
        $ERRORS++
    }
} else {
    Write-Host "⚠️  Não foi possível verificar (arquivo .env não existe)" -ForegroundColor Yellow
}
Write-Host ""

# Verificar DATABASE_URL
Write-Host "3. Verificando DATABASE_URL..." -ForegroundColor White
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'DATABASE_URL="?([^"\r\n]+)"?') {
        $databaseUrl = $matches[1]
        if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
            Write-Host "❌ DATABASE_URL não está definido" -ForegroundColor Red
            $ERRORS++
        } elseif ($databaseUrl -like "*user:password@host*") {
            Write-Host "⚠️  DATABASE_URL está com valor de exemplo" -ForegroundColor Yellow
            $ERRORS++
        } else {
            Write-Host "✅ DATABASE_URL configurado" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ DATABASE_URL não encontrado no .env" -ForegroundColor Red
        $ERRORS++
    }
} else {
    Write-Host "⚠️  Não foi possível verificar (arquivo .env não existe)" -ForegroundColor Yellow
}
Write-Host ""

# Verificar ASAAS_API_KEY
Write-Host "4. Verificando ASAAS_API_KEY..." -ForegroundColor White
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'ASAAS_API_KEY=[''"]?([^''"\r\n]+)[''"]?') {
        $asaasKey = $matches[1]
        if ([string]::IsNullOrWhiteSpace($asaasKey)) {
            Write-Host "⚠️  ASAAS_API_KEY não está definido" -ForegroundColor Yellow
            Write-Host "   (Opcional se não usar Asaas)" -ForegroundColor Gray
        } elseif ($asaasKey -eq "your-asaas-api-key") {
            Write-Host "⚠️  ASAAS_API_KEY está com valor de exemplo" -ForegroundColor Yellow
        } else {
            Write-Host "✅ ASAAS_API_KEY configurado" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  ASAAS_API_KEY não encontrado (opcional)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Não foi possível verificar (arquivo .env não existe)" -ForegroundColor Yellow
}
Write-Host ""

# Verificar Docker
Write-Host "5. Verificando Docker..." -ForegroundColor White
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker instalado" -ForegroundColor Green
        Write-Host "   $dockerVersion" -ForegroundColor Gray
    } else {
        Write-Host "❌ Docker não está instalado" -ForegroundColor Red
        $ERRORS++
    }
} catch {
    Write-Host "❌ Docker não está instalado" -ForegroundColor Red
    $ERRORS++
}
Write-Host ""

# Verificar Docker Compose
Write-Host "6. Verificando Docker Compose..." -ForegroundColor White
try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Write-Host "✅ Docker Compose instalado" -ForegroundColor Green
        Write-Host "   $composeVersion" -ForegroundColor Gray
    } else {
        Write-Host "❌ Docker Compose não está instalado" -ForegroundColor Red
        $ERRORS++
    }
} catch {
    Write-Host "❌ Docker Compose não está instalado" -ForegroundColor Red
    $ERRORS++
}
Write-Host ""

# Verificar porta 3000
Write-Host "7. Verificando porta 3000..." -ForegroundColor White
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  Porta 3000 está em uso" -ForegroundColor Yellow
    Write-Host "   Processo: $($port3000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "✅ Porta 3000 disponível" -ForegroundColor Green
}
Write-Host ""

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
if ($ERRORS -eq 0) {
    Write-Host "✨ Tudo pronto para o deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. docker-compose build --no-cache"
    Write-Host "  2. docker-compose up -d"
    Write-Host "  3. docker-compose logs -f nomami-app"
} else {
    Write-Host "❌ Encontrados $ERRORS problema(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os problemas acima antes de fazer o deploy." -ForegroundColor Yellow
}
Write-Host ""
