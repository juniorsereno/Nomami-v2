# Design Document: WhatsApp Message Cadence

## Overview

Este documento descreve o design técnico para a funcionalidade de Cadência de Mensagens WhatsApp no sistema Nomami. O sistema permitirá que administradores configurem uma sequência automatizada de mensagens (texto, imagem, vídeo) enviadas para novos assinantes após confirmação de pagamento.

A solução será implementada como uma extensão da página WhatsApp existente (`/whatsapp`), adicionando componentes de UI para gerenciamento de mensagens, integração com a API WhatsApp Evolution, e sistema de logging para monitoramento.

## Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js)"]
        WP[WhatsApp Page]
        MCF[Message Cadence Form]
        ML[Message List]
        LV[Logs Viewer]
        APC[Admin Phone Config]
    end
    
    subgraph API["API Routes"]
        CMR[/api/whatsapp/cadence]
        LR[/api/whatsapp/logs]
        CR[/api/whatsapp/config]
        SR[/api/whatsapp/send]
    end
    
    subgraph Services["Server Actions"]
        CMS[Cadence Message Service]
        WAS[WhatsApp API Service]
        LS[Logging Service]
    end
    
    subgraph External["External"]
        WAPI[WhatsApp Evolution API]
        DB[(PostgreSQL/Neon)]
    end
    
    subgraph Triggers["Triggers"]
        WH[Asaas Webhook]
    end
    
    WP --> MCF
    WP --> ML
    WP --> LV
    WP --> APC
    
    MCF --> CMR
    ML --> CMR
    LV --> LR
    APC --> CR
    
    CMR --> CMS
    LR --> LS
    CR --> CMS
    
    CMS --> DB
    LS --> DB
    
    WH --> SR
    SR --> CMS
    SR --> WAS
    WAS --> WAPI
    WAS --> LS
```

## Components and Interfaces

### 1. Database Tables

#### cadence_messages
```sql
CREATE TABLE cadence_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('text', 'image', 'video')),
    content TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_cadence_order ON cadence_messages(order_number) WHERE is_active = true;
```

#### whatsapp_config
```sql
CREATE TABLE whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### whatsapp_message_logs
```sql
CREATE TABLE whatsapp_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID,
    subscriber_name VARCHAR(255),
    subscriber_phone VARCHAR(50),
    message_id UUID REFERENCES cadence_messages(id),
    message_type VARCHAR(10),
    message_content TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    api_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_created_at ON whatsapp_message_logs(created_at DESC);
CREATE INDEX idx_logs_status ON whatsapp_message_logs(status);
```

### 2. API Interfaces

#### Cadence Messages API

```typescript
// POST /api/whatsapp/cadence - Create message
interface CreateMessageRequest {
    type: 'text' | 'image' | 'video';
    content: string;
    orderNumber: number;
}

// GET /api/whatsapp/cadence - List messages
interface ListMessagesResponse {
    messages: CadenceMessage[];
}

// PUT /api/whatsapp/cadence/[id] - Update message
interface UpdateMessageRequest {
    type?: 'text' | 'image' | 'video';
    content?: string;
    orderNumber?: number;
    isActive?: boolean;
}

// DELETE /api/whatsapp/cadence/[id] - Delete message
// Returns 204 No Content

// PUT /api/whatsapp/cadence/reorder - Reorder messages
interface ReorderRequest {
    messageIds: string[]; // Array of IDs in new order
}
```

#### Config API

```typescript
// GET /api/whatsapp/config - Get config
interface ConfigResponse {
    adminPhone: string | null;
    messageDelay: number; // milliseconds between messages
}

// PUT /api/whatsapp/config - Update config
interface UpdateConfigRequest {
    adminPhone?: string;
    messageDelay?: number;
}
```

#### Logs API

```typescript
// GET /api/whatsapp/logs - List logs with pagination
interface LogsQueryParams {
    page?: number;
    limit?: number;
    status?: 'success' | 'failed' | 'pending';
    startDate?: string;
    endDate?: string;
}

interface LogsResponse {
    logs: MessageLog[];
    total: number;
    page: number;
    totalPages: number;
}
```

### 3. WhatsApp API Service

```typescript
interface WhatsAppService {
    sendText(phone: string, text: string): Promise<ApiResponse>;
    sendImage(phone: string, imageUrl: string): Promise<ApiResponse>;
    sendVideo(phone: string, videoUrl: string): Promise<ApiResponse>;
    sendAdminNotification(message: string): Promise<ApiResponse>;
}

interface ApiResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}
```

### 4. React Components

```typescript
// Message Form Component
interface MessageFormProps {
    message?: CadenceMessage;
    onSave: (message: CreateMessageRequest) => Promise<void>;
    onCancel: () => void;
    existingOrders: number[];
}

// Message List Component
interface MessageListProps {
    messages: CadenceMessage[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (messageIds: string[]) => void;
}

// Logs Table Component
interface LogsTableProps {
    logs: MessageLog[];
    isLoading: boolean;
    onFilterChange: (filters: LogFilters) => void;
    pagination: PaginationState;
}

// Admin Config Component
interface AdminConfigProps {
    currentPhone: string | null;
    onSave: (phone: string) => Promise<void>;
}
```

## Data Models

```typescript
// Core Types
interface CadenceMessage {
    id: string;
    type: 'text' | 'image' | 'video';
    content: string;
    orderNumber: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface MessageLog {
    id: string;
    subscriberId: string | null;
    subscriberName: string | null;
    subscriberPhone: string | null;
    messageId: string | null;
    messageType: string | null;
    messageContent: string | null;
    status: 'success' | 'failed' | 'pending';
    errorMessage: string | null;
    apiResponse: Record<string, unknown> | null;
    createdAt: Date;
}

interface WhatsAppConfig {
    adminPhone: string | null;
    messageDelay: number;
}

// Validation Types
interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message Persistence Round-Trip

*For any* valid CadenceMessage, creating it and then retrieving it by ID should return an equivalent message with matching type, content, and orderNumber.

**Validates: Requirements 1.5**

### Property 2: Message Update Persistence

*For any* existing CadenceMessage and valid update payload, updating the message and then retrieving it should return the updated values.

**Validates: Requirements 1.7**

### Property 3: Message Deletion with Reordering

*For any* list of N active messages with orders 1 to N, deleting a message at position K should result in N-1 messages with contiguous orders from 1 to N-1.

**Validates: Requirements 1.8**

### Property 4: Message Ordering Invariant

*For any* set of active cadence messages retrieved from the database, they should always be sorted in ascending order by orderNumber.

**Validates: Requirements 1.6, 3.1**

### Property 5: Empty Text Validation Rejection

*For any* string composed entirely of whitespace characters (including empty string), attempting to create a text message should fail validation.

**Validates: Requirements 2.1**

### Property 6: Invalid URL Validation Rejection

*For any* string that is not a valid HTTP/HTTPS URL, attempting to create an image or video message should fail validation.

**Validates: Requirements 2.2, 2.3**

### Property 7: API Payload Format Correctness

*For any* CadenceMessage, the generated WhatsApp API payload should match the expected format: text messages use sendText endpoint with "number" and "text" fields; image messages use sendMedia with mediatype "image"; video messages use sendMedia with mediatype "video".

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 8: Log Creation with Correct Fields

*For any* message send attempt (success or failure), a log entry should be created containing: subscriberPhone, messageType, status, and timestamp. Failed attempts should additionally contain errorMessage.

**Validates: Requirements 4.1, 4.2**

### Property 9: Log Ordering

*For any* set of logs retrieved from the database, they should always be sorted in descending order by createdAt (most recent first).

**Validates: Requirements 4.3**

### Property 10: Phone Number Formatting

*For any* valid Brazilian phone number input (with or without country code, with or without formatting), the stored format should match the pattern: digits followed by "@s.whatsapp.net".

**Validates: Requirements 6.4**

### Property 11: Admin Notification on Failure

*For any* failed message send attempt where adminPhone is configured, a notification should be sent to the admin containing the subscriber's name and phone.

**Validates: Requirements 5.2**

### Property 12: Text Preview Truncation

*For any* text message content with length greater than 100 characters, the preview should be exactly 100 characters followed by "...".

**Validates: Requirements 7.3**

### Property 13: Drag Reorder Consistency

*For any* reorder operation moving message from position A to position B, all messages between A and B (inclusive) should have their orderNumber updated, and the final sequence should be contiguous from 1 to N.

**Validates: Requirements 7.2**

## Error Handling

### API Error Handling

1. **WhatsApp API Failures**
   - Retry up to 3 times with exponential backoff (1s, 2s, 4s)
   - Log each attempt with status
   - After final failure, log as "failed" and trigger admin notification

2. **Database Errors**
   - Return 500 status with generic error message
   - Log detailed error server-side
   - Do not expose internal error details to client

3. **Validation Errors**
   - Return 400 status with specific validation messages
   - Client should display these messages to user

### UI Error Handling

1. **Network Errors**
   - Display toast notification with retry option
   - Maintain form state for retry

2. **Validation Errors**
   - Display inline error messages next to invalid fields
   - Prevent form submission until errors are resolved

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

- Message form validation with various inputs
- Phone number formatting edge cases
- Text truncation at exactly 100 characters
- API payload generation for each message type
- Log filtering and pagination logic

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript to verify universal properties:

- Each property test will run minimum 100 iterations
- Tests will be tagged with format: **Feature: whatsapp-message-cadence, Property N: [property text]**

Properties to implement:
1. Message persistence round-trip
2. Message ordering invariant
3. Empty text validation rejection
4. Invalid URL validation rejection
5. Phone number formatting
6. Text preview truncation
7. Reorder consistency

### Integration Tests

- Full CRUD flow for cadence messages
- Webhook trigger to message sending flow
- Log creation on success and failure scenarios
