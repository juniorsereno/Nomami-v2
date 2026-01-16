# Design Document: Sistema de Verificação de Assinantes

## Overview

O sistema de verificação de assinantes adiciona três funcionalidades principais ao aplicativo NoMami existente:

1. **Exibição do Card ID**: Modificação do componente `digital-card.tsx` para exibir o número da carteirinha de forma visível
2. **Página de Consulta Manual**: Nova página pública em `/consulta` onde parceiros podem verificar status digitando o número da carteirinha
3. **Verificação via QR Code**: Adição de QR code no cartão digital que direciona para página de verificação automática em `/verificar/[card_id]`

O sistema utiliza a infraestrutura existente (Next.js 15, TypeScript, PostgreSQL via Neon, Tailwind CSS) e a query `getSubscriberByCardId` já implementada.

## Architecture

### Estrutura de Diretórios

```
nomami-app/
├── app/
│   ├── consulta/
│   │   └── page.tsx                    # Página de consulta manual
│   ├── verificar/
│   │   └── [card_id]/
│   │       └── page.tsx                # Página de verificação via QR code
│   └── api/
│       └── consulta/
│           └── route.ts                # API endpoint para consulta
├── components/
│   ├── digital-card.tsx                # Modificado: adiciona card_id e QR code
│   └── subscriber-status-display.tsx   # Novo: componente reutilizável para exibir status
└── lib/
    ├── queries.ts                      # Já existe: getSubscriberByCardId
    └── subscriber-validation.ts        # Novo: lógica de validação de status
```

### Fluxo de Dados

```mermaid
graph TD
    A[Assinante visualiza cartão digital] --> B[Cartão exibe card_id e QR code]
    B --> C[Parceiro escaneia QR code OU digita card_id]
    C --> D{Método de verificação}
    D -->|QR Code| E[/verificar/ABC123]
    D -->|Manual| F[/consulta + input]
    E --> G[API /api/consulta?card_id=ABC123]
    F --> G
    G --> H[getSubscriberByCardId]
    H --> I[validateSubscriberStatus]
    I --> J[Retorna status + dados]
    J --> K[Exibe resultado visual]
```

## Components and Interfaces

### 1. Modificação do DigitalCard Component

**Arquivo**: `components/digital-card.tsx`

**Mudanças**:
- Adicionar exibição do `card_id` abaixo do nome do titular
- Adicionar QR code no canto inferior esquerdo
- Importar e usar `QRCodeSVG` de `qrcode.react`

**Estrutura Visual**:
```
┌─────────────────────────────────────┐
│ [Logo NoMami]          [Badge Tipo] │
│                                     │
│                          [Chip]     │
│                                     │
│ Nome do Titular                     │
│ Cartão Nº: ABC123                   │
│                                     │
│ [QR]              Válido Até: XX/XX │
└─────────────────────────────────────┘
```

**Props do QRCodeSVG**:
```typescript
<QRCodeSVG
  value={`https://${domain}/verificar/${subscriber.card_id}`}
  size={40}
  bgColor="#FFFFFF"
  fgColor="#000000"
  level="M"
  marginSize={1}
/>
```

### 2. SubscriberStatusDisplay Component

**Arquivo**: `components/subscriber-status-display.tsx`

**Propósito**: Componente reutilizável para exibir o status e informações do assinante de forma consistente nas páginas de consulta e verificação.

**Interface**:
```typescript
interface SubscriberStatusDisplayProps {
  subscriber: {
    name: string;
    card_id: string;
    status: string;
    next_due_date: string;
    subscriber_type: 'individual' | 'corporate';
    company_name?: string;
    removed_at?: string | null;
  };
  isActive: boolean;
}
```

**Estrutura Visual**:
```
┌─────────────────────────────────────┐
│                                     │
│   ✅ ASSINATURA ATIVA               │
│   (ou ❌ ASSINATURA VENCIDA)        │
│                                     │
│   Nome: João da Silva               │
│   Cartão Nº: ABC123                 │
│   Validade: 31/12/2024              │
│   Tipo: Individual                  │
│   Empresa: [se corporativo]         │
│                                     │
└─────────────────────────────────────┘
```

### 3. Consulta Page

**Arquivo**: `app/consulta/page.tsx`

**Funcionalidade**:
- Página pública (sem autenticação)
- Input para card_id com conversão automática para maiúsculas
- Botão de consulta
- Exibição de resultado usando `SubscriberStatusDisplay`

**Estados**:
- `loading`: Durante busca
- `notFound`: Card_id não encontrado
- `success`: Assinante encontrado (exibe status)

### 4. Verificar Page

**Arquivo**: `app/verificar/[card_id]/page.tsx`

**Funcionalidade**:
- Página pública (sem autenticação)
- Recebe card_id via URL params
- Busca automática ao carregar
- Exibição de resultado usando `SubscriberStatusDisplay`

**Diferença da página Consulta**: Não tem input, busca automaticamente baseado no parâmetro da URL.

### 5. API Route

**Arquivo**: `app/api/consulta/route.ts`

**Endpoint**: `GET /api/consulta?card_id=ABC123`

**Resposta Success (200)**:
```typescript
{
  name: string;
  card_id: string;
  status: string;
  next_due_date: string;
  subscriber_type: 'individual' | 'corporate';
  company_name?: string;
  removed_at?: string | null;
  isActive: boolean;
}
```

**Resposta Not Found (404)**:
```typescript
{
  error: "Carteirinha não encontrada"
}
```

**Resposta Error (500)**:
```typescript
{
  error: "Erro ao buscar assinante"
}
```

## Data Models

### Subscriber (já existente)

```typescript
interface Subscriber {
  id: string;
  name: string;
  card_id: string;
  next_due_date: string;
  status: 'ativo' | 'inativo';
  plan_type: string;
  subscriber_type: 'individual' | 'corporate';
  company_id?: string;
  company_name?: string;
  removed_at?: string | null;
}
```

### SubscriberStatus (novo)

```typescript
interface SubscriberStatus {
  isActive: boolean;
  reason?: 'expired' | 'inactive' | 'removed';
}
```

## Subscriber Validation Logic

**Arquivo**: `lib/subscriber-validation.ts`

**Função**: `validateSubscriberStatus(subscriber: Subscriber): SubscriberStatus`

**Lógica**:

```typescript
function validateSubscriberStatus(subscriber: Subscriber): SubscriberStatus {
  const today = new Date();
  const dueDate = new Date(subscriber.next_due_date);
  
  // Assinante corporativo removido
  if (subscriber.subscriber_type === 'corporate' && subscriber.removed_at !== null) {
    return { isActive: false, reason: 'removed' };
  }
  
  // Status inativo
  if (subscriber.status === 'inativo') {
    return { isActive: false, reason: 'inactive' };
  }
  
  // Data de vencimento expirada
  if (dueDate < today) {
    return { isActive: false, reason: 'expired' };
  }
  
  // Assinante ativo
  return { isActive: true };
}
```

**Regras de Validação**:
1. Assinante corporativo com `removed_at` preenchido → VENCIDO
2. Assinante com `status='inativo'` → VENCIDO
3. Assinante com `next_due_date < hoje` → VENCIDO
4. Caso contrário → ATIVO

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Card ID Formatting

*For any* assinante com um card_id válido, quando o Cartão_Digital é renderizado, o texto exibido deve conter o prefixo "Cartão Nº: " seguido do card_id.

**Validates: Requirements 1.3**

### Property 2: Card ID Display Across Subscriber Types

*For any* assinante (individual ou corporativo), o Cartão_Digital deve exibir o card_id de forma visível.

**Validates: Requirements 1.5**

### Property 3: Input Uppercase Conversion

*For any* string digitada no campo de input da página de consulta, o valor deve ser automaticamente convertido para maiúsculas.

**Validates: Requirements 2.4**

### Property 4: Active Status Validation

*For any* assinante onde status='ativo' E next_due_date >= data atual E (se corporativo) removed_at IS NULL, a função validateSubscriberStatus deve retornar isActive=true.

**Validates: Requirements 3.1, 3.5**

### Property 5: Inactive Status Validation

*For any* assinante onde status='inativo' OU next_due_date < data atual, a função validateSubscriberStatus deve retornar isActive=false.

**Validates: Requirements 3.2, 3.4**

### Property 6: Corporate Removed Status Validation

*For any* assinante corporativo onde removed_at IS NOT NULL, a função validateSubscriberStatus deve retornar isActive=false com reason='removed'.

**Validates: Requirements 3.3**

### Property 7: API Response Completeness

*For any* assinante encontrado pela API, o JSON de resposta deve conter todos os campos: name, card_id, status, next_due_date, subscriber_type, company_name (se corporativo), e isActive.

**Validates: Requirements 4.3**

### Property 8: API Success Status Code

*For any* card_id válido que corresponde a um assinante existente, a API deve retornar HTTP status 200.

**Validates: Requirements 4.4**

### Property 9: QR Code URL Pattern

*For any* assinante com um card_id válido, o QR code gerado deve codificar uma URL no formato `https://[dominio]/verificar/[card_id]`.

**Validates: Requirements 5.5**

### Property 10: QR Code Display Across Subscriber Types

*For any* assinante (individual ou corporativo), o Cartão_Digital deve exibir um QR code.

**Validates: Requirements 5.7**

### Property 11: Status Display for Active Subscribers

*For any* assinante com isActive=true, o componente SubscriberStatusDisplay deve exibir o texto "✅ ASSINATURA ATIVA", o nome completo, o card_id, a data de validade formatada em pt-BR, e o tipo correto (Individual/Corporativo).

**Validates: Requirements 2.7, 2.9, 2.10, 2.11, 2.12, 6.2, 6.4, 6.5, 6.6, 6.7**

### Property 12: Status Display for Inactive Subscribers

*For any* assinante com isActive=false, o componente SubscriberStatusDisplay deve exibir o texto "❌ ASSINATURA VENCIDA", o nome completo, o card_id, a data de validade formatada em pt-BR, e o tipo correto (Individual/Corporativo).

**Validates: Requirements 2.8, 2.9, 2.10, 2.11, 2.12, 6.3, 6.4, 6.5, 6.6, 6.7**

### Property 13: Corporate Company Name Display

*For any* assinante corporativo (subscriber_type='corporate'), o componente SubscriberStatusDisplay deve exibir o nome da empresa quando company_name está presente.

**Validates: Requirements 2.13, 6.8**

### Property 14: Date Formatting Consistency

*For any* data válida (next_due_date), quando formatada para exibição, deve seguir o padrão pt-BR (DD/MM/YYYY).

**Validates: Requirements 2.11, 6.6**

## Error Handling

### API Error Responses

1. **Card ID Not Found (404)**:
   - Quando: `getSubscriberByCardId` retorna undefined/null
   - Resposta: `{ error: "Carteirinha não encontrada" }`
   - Status: 404

2. **Database Error (500)**:
   - Quando: Erro na conexão ou query do banco de dados
   - Resposta: `{ error: "Erro ao buscar assinante" }`
   - Status: 500
   - Log: Erro completo deve ser logado no servidor

3. **Invalid Card ID Format**:
   - Quando: card_id vazio ou inválido
   - Resposta: `{ error: "Card ID inválido" }`
   - Status: 400

### UI Error States

1. **Página de Consulta**:
   - Card ID não encontrado: Exibir mensagem "Carteirinha não encontrada"
   - Erro de rede: Exibir mensagem "Erro ao consultar. Tente novamente."
   - Loading state: Exibir spinner ou skeleton

2. **Página de Verificação**:
   - Card ID inválido na URL: Exibir mensagem "Carteirinha inválida"
   - Card ID não encontrado: Exibir mensagem "Carteirinha não encontrada"
   - Erro de rede: Exibir mensagem "Erro ao verificar. Tente novamente."

### Component Error Boundaries

- Ambas as páginas públicas devem ter error boundaries para capturar erros de renderização
- Erros devem ser logados mas não devem expor detalhes técnicos ao usuário
- Fallback UI deve ser amigável e sugerir ações (ex: "Tente novamente" ou "Verifique o número da carteirinha")

## Testing Strategy

### Dual Testing Approach

O sistema utilizará uma abordagem dupla de testes:

1. **Unit Tests**: Para casos específicos, edge cases e condições de erro
2. **Property-Based Tests**: Para propriedades universais que devem valer para todos os inputs

Ambos os tipos de teste são complementares e necessários para cobertura abrangente.

### Property-Based Testing

**Biblioteca**: [fast-check](https://github.com/dubzzz/fast-check) (já instalada no projeto)

**Configuração**:
- Mínimo de 100 iterações por teste de propriedade
- Cada teste deve referenciar a propriedade do design usando comentário
- Formato do comentário: `// Feature: verificacao-assinantes, Property N: [descrição]`

**Arquivos de Teste**:

1. **`lib/subscriber-validation.test.ts`**:
   - Property 4: Active Status Validation
   - Property 5: Inactive Status Validation
   - Property 6: Corporate Removed Status Validation
   - Property 14: Date Formatting Consistency

2. **`components/digital-card.test.tsx`**:
   - Property 1: Card ID Formatting
   - Property 2: Card ID Display Across Subscriber Types
   - Property 9: QR Code URL Pattern
   - Property 10: QR Code Display Across Subscriber Types

3. **`components/subscriber-status-display.test.tsx`**:
   - Property 11: Status Display for Active Subscribers
   - Property 12: Status Display for Inactive Subscribers
   - Property 13: Corporate Company Name Display

4. **`app/api/consulta/route.test.ts`**:
   - Property 7: API Response Completeness
   - Property 8: API Success Status Code

5. **`app/consulta/page.test.tsx`**:
   - Property 3: Input Uppercase Conversion

**Generators para Property-Based Testing**:

```typescript
// Gerador de assinantes válidos
const subscriberArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 100 }),
  card_id: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
  next_due_date: fc.date(),
  status: fc.constantFrom('ativo', 'inativo'),
  plan_type: fc.string(),
  subscriber_type: fc.constantFrom('individual', 'corporate'),
  company_id: fc.option(fc.uuid()),
  company_name: fc.option(fc.string({ minLength: 3, maxLength: 100 })),
  removed_at: fc.option(fc.date().map(d => d.toISOString()))
});

// Gerador de assinantes ativos
const activeSubscriberArbitrary = subscriberArbitrary.map(s => ({
  ...s,
  status: 'ativo' as const,
  next_due_date: new Date(Date.now() + 86400000).toISOString(), // +1 dia
  removed_at: null
}));

// Gerador de assinantes inativos
const inactiveSubscriberArbitrary = fc.oneof(
  // Status inativo
  subscriberArbitrary.map(s => ({ ...s, status: 'inativo' as const })),
  // Data vencida
  subscriberArbitrary.map(s => ({
    ...s,
    next_due_date: new Date(Date.now() - 86400000).toISOString() // -1 dia
  })),
  // Corporativo removido
  subscriberArbitrary.map(s => ({
    ...s,
    subscriber_type: 'corporate' as const,
    removed_at: new Date().toISOString()
  }))
);
```

### Unit Testing

**Foco dos Unit Tests**:
- Casos específicos de edge cases (ex: card_id vazio, datas limites)
- Integração entre componentes
- Comportamento de UI (clicks, inputs, navegação)
- Casos de erro específicos (404, 500, network errors)

**Arquivos de Teste**:

1. **`app/consulta/page.test.tsx`**:
   - Renderização inicial da página
   - Comportamento do botão de consulta
   - Exibição de loading state
   - Exibição de mensagem "Carteirinha não encontrada"
   - Navegação e interação do usuário

2. **`app/verificar/[card_id]/page.test.tsx`**:
   - Renderização com card_id válido
   - Renderização com card_id inválido
   - Loading state automático
   - Exibição de erro

3. **`app/api/consulta/route.test.ts`**:
   - Resposta 404 para card_id inexistente
   - Resposta 400 para card_id inválido
   - Tratamento de erro de banco de dados

4. **`components/digital-card.test.tsx`**:
   - Renderização de cartão inativo (corporativo removido)
   - Posicionamento de elementos
   - Classes CSS aplicadas

**Ferramentas**:
- **Vitest**: Framework de testes (já configurado)
- **React Testing Library**: Para testes de componentes
- **MSW (Mock Service Worker)**: Para mockar API calls (se necessário)

### Integration Testing

**Fluxos End-to-End**:

1. **Fluxo de Consulta Manual**:
   - Usuário acessa /consulta
   - Digita card_id
   - Clica em consultar
   - Vê resultado correto

2. **Fluxo de QR Code**:
   - Assinante visualiza cartão digital
   - QR code é exibido
   - Scan do QR code leva para /verificar/[card_id]
   - Página exibe status correto

3. **Fluxo de Validação**:
   - API recebe card_id
   - Busca no banco de dados
   - Valida status
   - Retorna resposta correta

**Nota**: Integration tests devem usar banco de dados de teste ou mocks para garantir isolamento.

### Test Coverage Goals

- **Lógica de Validação**: 100% (crítico para negócio)
- **API Routes**: 90%+
- **Componentes UI**: 80%+
- **Páginas**: 70%+

### Continuous Integration

- Todos os testes devem passar antes de merge
- Property-based tests devem rodar com seed fixo em CI para reprodutibilidade
- Coverage reports devem ser gerados e monitorados
