# Design Document: Corporate Plans

## Overview

Este documento descreve a arquitetura e design técnico para a funcionalidade de Planos Corporativos do sistema NoMami. A funcionalidade permite que empresas contratem o clube de benefícios para seus colaboradores, com gestão centralizada, cobrança unificada e visibilidade de métricas.

A implementação seguirá os padrões existentes do projeto:
- Next.js 15 App Router com Server Components
- Neon Postgres (serverless) com queries SQL diretas
- TypeScript com tipagem forte
- Tailwind CSS + Radix UI para componentes

## Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js App Router"
        CP[Companies Page<br/>/empresas]
        CD[Company Detail<br/>/empresas/[id]]
        SF[Subscribers Filter<br/>type: corporate]
        DC[Digital Card<br/>/card/[cardId]]
    end
    
    subgraph "API Routes"
        AC[/api/companies]
        ACD[/api/companies/[id]]
        ACS[/api/companies/[id]/subscribers]
        AST[/api/companies/stats]
        AEX[/api/companies/export]
    end
    
    subgraph "Services"
        CQ[Company Queries]
        CSQ[Corporate Subscriber Queries]
        BQ[Billing Queries]
    end
    
    subgraph "Database - Neon Postgres"
        CT[(companies)]
        CPT[(company_plans)]
        CPH[(company_plan_history)]
        CBH[(company_billing_history)]
        ST[(subscribers)]
    end
    
    CP --> AC
    CP --> AST
    CD --> ACD
    CD --> ACS
    SF --> AC
    
    AC --> CQ
    ACD --> CQ
    ACS --> CSQ
    AST --> CQ
    AEX --> CQ
    
    CQ --> CT
    CQ --> CPT
    CQ --> CPH
    CSQ --> ST
    BQ --> CBH

```

## Components and Interfaces

### API Endpoints

#### Companies CRUD

```typescript
// GET /api/companies - List all companies
interface CompanyListResponse {
  data: Company[];
  total: number;
}

// POST /api/companies - Create company
interface CreateCompanyRequest {
  name: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  plan: {
    contractedQuantity: number;
    pricePerSubscriber: number;
    billingDay: number; // 1-28
    startDate: string; // ISO date
  };
}

// GET /api/companies/[id] - Get company details
interface CompanyDetailResponse {
  company: Company;
  plan: CompanyPlan;
  metrics: {
    activeSubscribers: number;
    inactiveSubscribers: number;
    utilizationPercentage: number;
  };
}

// PUT /api/companies/[id] - Update company
interface UpdateCompanyRequest {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  status?: 'active' | 'suspended' | 'cancelled';
}

// DELETE /api/companies/[id] - Soft delete company
```

#### Corporate Subscribers

```typescript
// GET /api/companies/[id]/subscribers - List company subscribers
interface CompanySubscribersResponse {
  data: CorporateSubscriber[];
  total: number;
}

// POST /api/companies/[id]/subscribers - Add subscriber
interface AddCorporateSubscriberRequest {
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

// DELETE /api/companies/[id]/subscribers/[subscriberId] - Remove subscriber (soft delete)
```

#### Stats and Export

```typescript
// GET /api/companies/stats - Get corporate metrics
interface CompanyStatsResponse {
  totalCompanies: number;
  totalCorporateSubscribers: number;
  corporateMrr: number;
}

// GET /api/companies/export - Export companies CSV
// GET /api/companies/[id]/subscribers/export - Export company subscribers CSV
```

### React Components

```typescript
// Companies Page Components
CompaniesPage           // Main page with stats and list
CompanySectionCards     // Metrics cards (companies, subscribers, MRR)
CompaniesTable          // DataTable with company list
AddCompanyForm          // Dialog form for new company
CompanyActions          // Row actions (view, edit, delete)

// Company Detail Components
CompanyDetailPage       // Detail page with tabs
CompanyInfoCard         // Company information display
CompanyPlanCard         // Plan configuration display
CompanySubscribersTable // Subscribers list with filters
AddCorporateSubscriberForm // Dialog form for new subscriber
EditCompanyDialog       // Edit company information

// Shared Components (reuse existing)
DataTable               // Existing table component
SectionCards            // Existing metrics cards
DigitalCard             // Existing card component (extended)
```

## Data Models

### Database Schema

```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Company plans table
CREATE TABLE company_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contracted_quantity INTEGER NOT NULL,
  price_per_subscriber DECIMAL(10,2) NOT NULL,
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 28),
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company plan history (for tracking changes)
CREATE TABLE company_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contracted_quantity INTEGER NOT NULL,
  price_per_subscriber DECIMAL(10,2) NOT NULL,
  billing_day INTEGER NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by UUID REFERENCES users(id)
);

-- Company billing history
CREATE TABLE company_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  billing_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  subscriber_count INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extend subscribers table (add columns)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS subscriber_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX idx_subscribers_company_id ON subscribers(company_id);
CREATE INDEX idx_subscribers_type ON subscribers(subscriber_type);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_company_plans_company_id ON company_plans(company_id);
```

### TypeScript Types

```typescript
interface Company {
  id: string;
  name: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  status: 'active' | 'suspended' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

interface CompanyPlan {
  id: string;
  companyId: string;
  contractedQuantity: number;
  pricePerSubscriber: number;
  billingDay: number;
  startDate: Date;
  nextBillingDate: Date;
  status: 'active' | 'suspended' | 'cancelled';
  totalMonthlyValue: number; // computed: contractedQuantity * pricePerSubscriber
}

interface CorporateSubscriber {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  companyId: string;
  companyName: string;
  subscriberType: 'corporate';
  status: 'ativo' | 'inativo' | 'vencido';
  cardId: string;
  startDate: Date;
  nextDueDate: Date;
  removedAt?: Date;
}

interface CompanyBillingHistory {
  id: string;
  companyId: string;
  billingDate: Date;
  amount: number;
  subscriberCount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Company and Subscriber Validation

*For any* company creation or corporate subscriber addition request, if any required field is missing or invalid (empty string, invalid CNPJ format, invalid email format), the system SHALL reject the request and return a validation error.

**Validates: Requirements 1.2, 3.2, 9.2**

### Property 2: Unique Identifier Generation

*For any* set of companies and subscribers in the system, all company IDs, subscriber IDs, and card_ids SHALL be unique. Creating a new company or subscriber SHALL never produce a duplicate identifier.

**Validates: Requirements 1.4, 3.4**

### Property 3: CNPJ Uniqueness

*For any* company creation request where a company with the same CNPJ already exists, the system SHALL reject the creation. *For any* company update request attempting to change the CNPJ, the system SHALL reject the update.

**Validates: Requirements 1.5, 9.4**

### Property 4: Billing Calculation Consistency

*For any* company plan with contracted quantity Q and price per subscriber P, the total monthly value SHALL equal Q × P. When the contracted quantity changes, the next billing amount SHALL be recalculated using the new quantity.

**Validates: Requirements 2.3, 2.5, 6.3**

### Property 5: Plan History Tracking

*For any* plan update operation, the system SHALL create a history record containing the previous plan values before applying the update. The history record count SHALL increase by exactly 1 for each update.

**Validates: Requirements 2.4**

### Property 6: Corporate Subscriber Billing Inheritance

*For any* corporate subscriber added to a company, the subscriber's next_due_date SHALL equal the company's next_billing_date. The subscriber SHALL inherit the company's billing cycle.

**Validates: Requirements 3.3**

### Property 7: Soft Delete Preservation

*For any* corporate subscriber removal operation, the subscriber record SHALL remain in the database with status "inativo" and removed_at timestamp set. The record SHALL be retrievable by ID or CPF after removal.

**Validates: Requirements 3.6, 3.7**

### Property 8: Metrics Accuracy

*For any* point in time, the corporate metrics SHALL satisfy:
- totalCompanies = COUNT of companies WHERE status = 'active'
- totalCorporateSubscribers = COUNT of subscribers WHERE subscriber_type = 'corporate' AND status = 'ativo'
- corporateMrr = SUM of (contracted_quantity × price_per_subscriber) for all active company plans

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: Company Status Cascade Behavior

*For any* company status change:
- When status changes to 'suspended', all corporate subscribers SHALL retain their current status
- When status changes to 'cancelled', all corporate subscribers SHALL have their status set to 'inativo'

**Validates: Requirements 9.5, 9.6**

### Property 10: Digital Card Display Completeness

*For any* corporate subscriber card access via card_id, the displayed card SHALL contain: subscriber name, company name, card_id, validity date, and status. If the subscriber is inactive, the card SHALL display an expired/invalid message.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 11: Subscriber Type Filter Accuracy

*For any* subscriber list filter by type:
- Filter 'corporate' SHALL return only subscribers WHERE subscriber_type = 'corporate'
- Filter 'individual' SHALL return only subscribers WHERE subscriber_type = 'individual'
- Search by CPF or card_id SHALL return the subscriber regardless of type

**Validates: Requirements 8.2, 8.5**

### Property 12: Export Data Completeness

*For any* export operation, the generated CSV SHALL contain all required fields: company name, CNPJ, subscriber name, CPF, status, start date. No required field SHALL be empty for active records.

**Validates: Requirements 10.2, 10.4**

## Error Handling

### Validation Errors

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| INVALID_CNPJ | CNPJ format is invalid | 400 |
| DUPLICATE_CNPJ | Company with CNPJ already exists | 409 |
| INVALID_EMAIL | Email format is invalid | 400 |
| MISSING_REQUIRED_FIELD | Required field is missing | 400 |
| INVALID_BILLING_DAY | Billing day must be 1-28 | 400 |
| COMPANY_NOT_FOUND | Company ID does not exist | 404 |
| SUBSCRIBER_NOT_FOUND | Subscriber ID does not exist | 404 |
| CNPJ_IMMUTABLE | Cannot change CNPJ after creation | 400 |

### Business Logic Errors

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| COMPANY_CANCELLED | Cannot add subscribers to cancelled company | 400 |
| DUPLICATE_CPF | Subscriber with CPF already exists in company | 409 |
| SUBSCRIBER_ALREADY_INACTIVE | Subscriber is already inactive | 400 |

### Warning Conditions (Non-blocking)

| Warning Code | Description |
|--------------|-------------|
| OVER_CONTRACTED_QUANTITY | Active subscribers exceed contracted quantity |
| PAYMENT_OVERDUE | Company has overdue payment |

## Testing Strategy

### Unit Tests

Unit tests will cover:
- CNPJ validation function (format, check digit)
- Email validation function
- Billing calculation functions
- Date calculation for next billing date
- CSV export formatting

### Property-Based Tests

Property-based tests will use **fast-check** library (already available in the project via vitest) to verify:

1. **Validation Properties** (Property 1): Generate random company/subscriber data with missing/invalid fields
2. **Uniqueness Properties** (Property 2, 3): Generate multiple creation requests and verify no duplicates
3. **Billing Calculation** (Property 4): Generate random quantities and prices, verify formula
4. **Soft Delete** (Property 7): Generate removal operations, verify record preservation
5. **Metrics Accuracy** (Property 8): Generate random company/subscriber states, verify metric calculations
6. **Cascade Behavior** (Property 9): Generate status changes, verify subscriber states
7. **Filter Accuracy** (Property 11): Generate mixed subscriber types, verify filter results

Each property test will run minimum 100 iterations.

### Integration Tests

Integration tests will verify:
- API endpoint responses
- Database constraint enforcement
- End-to-end flows (create company → add subscribers → update plan → export)

### Test File Structure

```
nomami-app/
├── lib/
│   └── companies/
│       ├── validation.ts
│       ├── validation.test.ts      # Unit tests
│       ├── validation.property.test.ts  # Property tests
│       ├── queries.ts
│       └── queries.test.ts
├── app/
│   └── api/
│       └── companies/
│           └── route.test.ts       # API integration tests
```
