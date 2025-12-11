# Script de teste de autenticação para NoMami App
param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🔍 Testando Autenticação do NoMami App" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URL Base: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Acessar raiz deve redirecionar para login
Write-Host "Teste 1: Acessar raiz sem autenticação" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/" -MaximumRedirection 5 -UseBasicParsing -ErrorAction Stop
    if ($response.Content -match "Faça login") {
        Write-Host "✅ PASSOU - Redirecionou para login" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU - Não redirecionou para login" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  AVISO - Erro ao acessar: $_" -ForegroundColor Yellow
}
Write-Host ""

# Teste 2: Acessar dashboard sem autenticação
Write-Host "Teste 2: Acessar dashboard sem autenticação" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/dashboard" -MaximumRedirection 5 -UseBasicParsing -ErrorAction Stop
    if ($response.Content -match "Faça login") {
        Write-Host "✅ PASSOU - Dashboard protegido, redirecionou para login" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU - Dashboard acessível sem login!" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  AVISO - Erro ao acessar: $_" -ForegroundColor Yellow
}
Write-Host ""

# Teste 3: Verificar se página de login está acessível
Write-Host "Teste 3: Página de login acessível" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/login" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASSOU - Página de login acessível" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU - Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FALHOU - Erro ao acessar: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 4: Verificar se API de autenticação está funcionando
Write-Host "Teste 4: API de autenticação" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/session" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASSOU - API de autenticação respondendo" -ForegroundColor Green
    } else {
        Write-Host "❌ FALHOU - Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FALHOU - Erro ao acessar: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✨ Testes concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Yellow
Write-Host "  - Se algum teste falhou, verifique os logs do servidor"
Write-Host "  - Limpe os cookies do navegador antes de testar manualmente"
Write-Host "  - Execute: npm run rebuild para limpar cache"
