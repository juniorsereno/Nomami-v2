---
description: "Task list for backend logging improvement"
---

# Tasks: Melhoria de Logs do Backend

**Input**: Design documents from `/specs/001-melhoria-logs-backend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Tests are OPTIONAL. Manual verification is the chosen strategy per research.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install pino and pino-pretty dependencies in nomami-app/package.json
- [x] T002 [P] Create logger configuration file in nomami-app/lib/logger.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement logger instance with redaction rules in nomami-app/lib/logger.ts
- [x] T004 [P] Create helper function for safe payload logging in nomami-app/lib/logger.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Monitoramento de Tráfego API (Priority: P1) 🎯 MVP

**Goal**: Logar todas as requisições HTTP recebidas e enviadas pelo backend.

**Independent Test**: Fazer requisições para a API e verificar logs no console.

### Implementation for User Story 1

- [x] T005 [US1] Create or update middleware to log incoming requests in nomami-app/middleware.ts
- [x] T006 [US1] Instrument Asaas service calls with logging in nomami-app/lib/asaas.ts (or equivalent service file)
- [x] T007 [US1] Instrument Stripe service calls with logging in nomami-app/lib/stripe.ts (or equivalent service file)
- [x] T008 [US1] Add logging to generic fetch wrapper if exists in nomami-app/lib/api.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Debug de Webhooks (Priority: P1)

**Goal**: Logar payloads completos de webhooks recebidos para auditoria e debug.

**Independent Test**: Enviar payload simulado para endpoints de webhook e verificar log.

### Implementation for User Story 2

- [x] T009 [US2] Add payload logging to Asaas webhook handler in nomami-app/app/api/webhook/asaas/route.ts
- [x] T010 [US2] Add payload logging to Stripe webhook handler in nomami-app/app/api/webhook/stripe/route.ts
- [x] T011 [US2] Implement error logging with stack trace in webhook catch blocks

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Rastreabilidade de Ações de Negócio (Priority: P2)

**Goal**: Logs específicos em pontos chave do negócio (busca, alterações).

**Independent Test**: Executar ações de negócio na UI e verificar logs contextuais.

### Implementation for User Story 3

- [x] T012 [US3] Add business context logging to Client Search in nomami-app/app/api/telemedicine/clients/route.ts
- [x] T013 [US3] Add logging to Subscriber creation/update in nomami-app/app/api/subscribers/route.ts (Covered by Webhook instrumentation)
- [x] T014 [US3] Add logging to Partner management actions in nomami-app/app/api/partners/route.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T015 Verify no sensitive data leaks in logs (PII check)
- [x] T016 Ensure timestamps are consistent across all log entries
- [x] T017 Validate quickstart.md instructions against implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent

### Within Each User Story

- Logger setup before usage
- Middleware before specific routes

### Parallel Opportunities

- T006 (Asaas) and T007 (Stripe) can be done in parallel
- T009 (Asaas Webhook) and T010 (Stripe Webhook) can be done in parallel
- US1, US2, and US3 are largely independent once `logger.ts` is ready

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Traffic Monitoring)
4. Complete Phase 4: User Story 2 (Webhooks - Critical for payments)
5. **STOP and VALIDATE**: Verify visibility of traffic and webhooks
6. Deploy/demo if ready

### Incremental Delivery

1. Foundation ready
2. Add Traffic Logs → Deploy
3. Add Webhook Logs → Deploy
4. Add Business Logs → Deploy