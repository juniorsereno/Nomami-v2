# Quickstart: Usando o Logger

Este guia explica como utilizar o novo utilitário de logging no backend.

## Instalação

As dependências já devem estar instaladas:
```bash
npm install pino
npm install -D pino-pretty
```

## Uso Básico

Importe o logger de `lib/logger.ts`:

```typescript
import { logger } from '@/lib/logger';

// Info
logger.info('Iniciando processamento de dados');

// Com metadados (Contexto)
logger.info({ userId: '123', action: 'update_profile' }, 'Perfil atualizado com sucesso');

// Erro
try {
  // ... código que pode falhar
} catch (error) {
  logger.error(error, 'Falha ao processar pagamento');
}
```

## Uso em API Routes

```typescript
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Logar entrada
  logger.info({ 
    url: request.url, 
    method: request.method,
    body // Cuidado: o logger já tem regras de redaction, mas evite logar binários
  }, 'API Request Received');

  // ... processamento

  return Response.json({ success: true });
}
```

## Uso em Webhooks

Para webhooks, é crucial logar o payload recebido para debug.

```typescript
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const payload = await request.json();
  
  logger.info({ 
    webhookSource: 'asaas', // ou 'stripe'
    payload 
  }, 'Webhook Received');

  // ...
}
```

## Visualização

Em desenvolvimento, os logs serão formatados e coloridos automaticamente no terminal.
Em produção, serão JSON puro para fácil ingestão.