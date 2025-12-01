# Research: Melhoria de Logs do Backend

## Decisions

### 1. Biblioteca de Logging

**Decision**: Utilizar `pino` para logging estruturado.

**Rationale**:
- **Performance**: Pino é conhecido por ser extremamente rápido e ter baixo overhead.
- **Estrutura**: Gera logs em JSON por padrão, o que é ideal para ingestão por ferramentas de monitoramento (Datadog, CloudWatch, etc.) no futuro.
- **Flexibilidade**: Permite redação de dados sensíveis (redact) facilmente, crucial para logs de pagamentos e dados de usuários.
- **DX**: Com `pino-pretty` (apenas em desenvolvimento), oferece uma visualização colorida e legível no console, atendendo ao requisito de "visibilidade total".

**Alternatives Considered**:
- **Console.log nativo**: Simples, zero dependências. Rejeitado porque não oferece estrutura consistente, níveis de log (info, warn, error) padronizados ou redação automática de dados sensíveis.
- **Winston**: Muito popular e flexível, mas mais pesado e verboso para configurar que o Pino.

### 2. Estratégia de Testes

**Decision**: Testes manuais e verificação visual.

**Rationale**:
- O projeto atual (`nomami-app`) não possui frameworks de teste (Jest/Vitest) configurados no `package.json`.
- Introduzir um framework de testes completo está fora do escopo desta tarefa de melhoria de logs.
- A validação será feita garantindo que os logs aparecem no stdout conforme esperado ao exercitar a aplicação.

**Alternatives Considered**:
- **Instalar Jest/Vitest**: Rejeitado para evitar "scope creep" e configurações complexas de ambiente (Next.js + TS + ESM) neste momento.

### 3. Middleware de Logging HTTP

**Decision**: Implementar um middleware customizado no Next.js (`middleware.ts`) ou utilizar `pino-http` se compatível com o App Router/Edge.

**Rationale**:
- O Middleware do Next.js intercepta requisições antes de chegarem às rotas, sendo o lugar ideal para logar "Request Received".
- Para "Response Sent", o middleware também pode logar, mas em Server Actions e API Routes, pode ser necessário um wrapper ou utilitário específico, já que o middleware do Next.js roda em Edge Runtime e tem limitações.
- **Refinamento**: Dado que o Next.js App Router usa Server Components e Server Actions, o middleware tradicional pode não capturar o corpo da resposta ou detalhes internos de processamento. Focaremos em:
    1.  `middleware.ts` para logar a entrada da requisição (URL, Method, IP).
    2.  Um wrapper `withLogger` ou chamadas explícitas em Server Actions/API Routes para logar o processamento e resultado.

## Action Items

- Instalar `pino` e `pino-pretty` (dev dependency).
- Criar `lib/logger.ts` configurando o Pino.
- Configurar `middleware.ts` para logs de tráfego HTTP.
- Criar utilitário para logar payloads de Webhook com segurança (redact).