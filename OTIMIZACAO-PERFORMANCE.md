# Otimização de Performance - NoMami App

## 🔍 Problemas Identificados

Após análise do código, identifiquei os seguintes problemas que podem estar causando o aumento progressivo de CPU e RAM:

### 1. **Logging Excessivo no Middleware** ⚠️ CRÍTICO
O middleware está logando TODAS as requisições, incluindo:
- Cada requisição HTTP
- Verificação de sessão em TODAS as rotas
- Logs detalhados com IP, user-agent, etc.

**Impacto**: Em produção, isso gera milhares de logs por hora, consumindo memória e CPU.

### 2. **Múltiplas Queries SQL Sequenciais**
Várias rotas fazem múltiplas queries SQL de forma sequencial ao invés de paralela:
- `/api/metrics/route.ts` - 4 queries sequenciais
- `/api/metrics/variations/route.ts` - múltiplas queries
- `/api/subscribers/list/route.ts` - 2 queries (count + data)

**Impacto**: Aumenta tempo de resposta e mantém conexões abertas por mais tempo.

### 3. **Falta de Cache**
Nenhuma rota implementa cache, mesmo para dados que mudam pouco:
- Métricas do dashboard
- Lista de parceiros ativos
- Estatísticas

**Impacto**: Cada acesso ao dashboard faz múltiplas queries ao banco.

### 4. **Pino Logger em Produção sem Configuração Adequada**
O logger Pino está configurado mas sem limites de buffer ou rotação de logs.

### 5. **Session Timeout com Event Listeners**
O componente `SessionTimeout` adiciona 5 event listeners em CADA página:
- mousedown, keydown, scroll, touchstart, click

**Impacto**: Em páginas com muitos componentes, isso pode acumular listeners.

### 6. **Dockerfile não Otimizado**
- Instala TypeScript em produção (desnecessário)
- Não usa cache de layers eficientemente
- Não define limites de memória

## 🚀 Soluções Recomendadas

### 1. Otimizar Logging (PRIORIDADE ALTA)

**Arquivo**: `nomami-app/middleware.ts`

```typescript
// Reduzir logging em produção
const isProd = process.env.NODE_ENV === 'production';

// Não logar rotas estáticas e de health check
const skipLogging = [
  '/_next',
  '/favicon.ico',
  '/api/health', // adicionar rota de health check
  ...
];

// Em produção, logar apenas erros e rotas importantes
if (!isProd || !skipLogging.some(route => nextUrl.pathname.startsWith(route))) {
  logger.info(...);
}
```

### 2. Implementar Cache de Métricas

**Criar**: `nomami-app/lib/cache.ts`

```typescript
// Cache simples em memória com TTL
const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}
```

### 3. Paralelizar Queries SQL

**Exemplo para** `nomami-app/app/api/metrics/route.ts`:

```typescript
// ANTES (sequencial)
const activeSubscribersResult = await sql`...`;
const inactiveSubscribersResult = await sql`...`;
const mrrResult = await sql`...`;

// DEPOIS (paralelo)
const [activeSubscribersResult, inactiveSubscribersResult, mrrResult] = 
  await Promise.all([
    sql`SELECT COUNT(*) FROM subscribers WHERE status = 'ativo'`,
    sql`SELECT COUNT(*) FROM subscribers WHERE status = 'vencido'`,
    sql`SELECT SUM(value) as total_mrr FROM subscribers WHERE status = 'ativo' AND plan_type = 'mensal'`
  ]);
```

### 4. Otimizar Dockerfile

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app

# Copiar apenas package.json e instalar produção
COPY --from=build_stage /app/package.json /app/package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# Remover instalação do TypeScript
# TypeScript não é necessário em runtime

# Adicionar limites de memória
ENV NODE_OPTIONS="--max-old-space-size=512"
```

### 5. Adicionar Rota de Health Check

**Criar**: `nomami-app/app/api/health/route.ts`

```typescript
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
```

### 6. Configurar Limites no Docker Compose

```yaml
services:
  nomami-app:
    # ... configurações existentes
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    environment:
      # Adicionar
      NODE_ENV: production
      LOG_LEVEL: warn  # Reduzir logs em produção
```

### 7. Otimizar Session Timeout

**Arquivo**: `nomami-app/components/auth/session-timeout.tsx`

```typescript
// Usar throttle para reduzir chamadas
const handleActivity = useCallback(
  throttle(() => {
    resetTimeout();
  }, 5000), // Só reseta a cada 5 segundos
  [resetTimeout]
);
```

### 8. Adicionar Índices no Banco de Dados

```sql
-- Otimizar queries mais comuns
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_start_date ON subscribers(start_date);
CREATE INDEX IF NOT EXISTS idx_subscribers_next_due_date ON subscribers(next_due_date);
CREATE INDEX IF NOT EXISTS idx_subscribers_status_plan ON subscribers(status, plan_type);
```

## 📊 Monitoramento Recomendado

### Adicionar Métricas de Performance

**Criar**: `nomami-app/app/api/metrics/system/route.ts`

```typescript
export async function GET() {
  const memUsage = process.memoryUsage();
  return Response.json({
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    },
    uptime: process.uptime(),
    nodeVersion: process.version,
  });
}
```

## 🎯 Plano de Implementação

### Fase 1 - Urgente (Implementar Hoje)
1. ✅ Reduzir logging no middleware
2. ✅ Adicionar cache nas métricas do dashboard
3. ✅ Configurar limites de memória no Docker

### Fase 2 - Importante (Esta Semana)
4. ✅ Paralelizar queries SQL
5. ✅ Otimizar Dockerfile
6. ✅ Adicionar índices no banco

### Fase 3 - Melhorias (Próxima Semana)
7. ✅ Implementar throttle no session timeout
8. ✅ Adicionar monitoramento de sistema
9. ✅ Implementar rotação de logs

## 🔧 Comandos para Deploy

```bash
# 1. Fazer backup do banco
# 2. Aplicar as mudanças
cd nomami-app
git pull

# 3. Rebuild com otimizações
docker-compose down
docker-compose build --no-cache nomami-app
docker-compose up -d

# 4. Monitorar
docker stats nomami-app
docker logs -f nomami-app
```

## 📈 Resultados Esperados

- **Redução de 60-70% no uso de CPU** (principalmente pelo logging)
- **Redução de 40-50% no uso de RAM** (cache + otimizações)
- **Tempo de resposta 30-40% mais rápido** (queries paralelas + cache)
- **Estabilidade a longo prazo** (sem crescimento progressivo de memória)

## ⚠️ Observações

- O problema principal é o **logging excessivo** em produção
- A falta de **cache** causa queries desnecessárias
- Queries **sequenciais** aumentam tempo de resposta
- Sem **limites de memória**, o Node.js pode consumir toda RAM disponível
