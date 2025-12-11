# Tasks: Admin Controlled User Management

**Input**: Design documents from `/specs/013-admin-user-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create feature branch and basic folder structure (if not present)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update schema in `nomami-app/lib/db-pool.ts` (or schema definition file) to include `cpf` and `role` in `users` table.
- [ ] T003 Generate and apply DB migration for user schema changes.
- [ ] T004 Install `bcryptjs` (if not present) and creating hashing helper `nomami-app/lib/auth/password.ts`.
- [ ] T005 [P] Create Zod schemas for Admin User (create/edit) and First Access in `nomami-app/lib/validations/auth.ts`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin User Management (Priority: P1) 🎯 MVP

**Goal**: Admin can list, create, and update users directly.

**Independent Test**: Login as Admin -> Settings -> Users -> Create/Edit Users.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create Server Action for User CRUD (create, update, list) in `nomami-app/lib/actions/user-actions.ts`.
- [ ] T007 [P] [US1] Create User Form component (Add/Edit) in `nomami-app/components/admin/user-form.tsx`.
- [ ] T008 [P] [US1] Create User List component (Table with actions) in `nomami-app/components/admin/user-list.tsx`.
- [ ] T009 [US1] Create Admin User Management Page in `nomami-app/app/settings/users/page.tsx` integrating List and Form.
- [ ] T010 [US1] Add logic to handle duplicate Email/CPF errors in Server Actions and display in Form.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - User First Access Flow (Priority: P2)

**Goal**: New users can set their password using Email/CPF validation.

**Independent Test**: Access public First Access page -> Validate Credentials -> Set Password -> Login.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create Server Action for First Access (validate credentials, set password) in `nomami-app/lib/actions/auth-actions.ts`.
- [ ] T012 [P] [US2] Create First Access Form component in `nomami-app/components/auth/first-access-form.tsx`.
- [ ] T013 [US2] Create First Access Page in `nomami-app/app/(auth)/first-access/page.tsx`.
- [ ] T014 [US2] Update Login page `nomami-app/app/(auth)/login/page.tsx` to add link to First Access.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Cleanup and Security Hardening (Priority: P3)

**Goal**: Remove unauthorized entry points (Social Login, Public Signup).

**Independent Test**: Verify Login page has no social buttons; Signup route is 404/redirected.

### Implementation for User Story 3

- [ ] T015 [US3] Remove Social Providers from NextAuth config in `nomami-app/app/api/auth/[...nextauth]/route.ts` (or equivalent config file).
- [ ] T016 [US3] Remove "Sign Up" links and Social Login buttons from `nomami-app/components/login-form.tsx` (and shared auth components).
- [ ] T017 [US3] Delete or disable `nomami-app/app/(auth)/signup/page.tsx` to prevent public registration.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T018 Verify end-to-end flow: Admin creates user -> User does first access -> User logs in.
- [ ] T019 Run `npm run lint` and fix any issues.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable