---
description: "Task list for Public Partners Page & Logo Upload"
---

# Tasks: Public Partners Page & Logo Upload

**Input**: Design documents from `/specs/010-public-partners-page/`
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: US1 (Admin Upload), US2 (Public Page)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create directory structure (`app/parceiros`, `app/api/upload`, `public/uploads`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T002 Setup database schema (add `logo_url` column to `parceiros` table)
- [ ] T003 [P] Create `PartnerCard` component in `nomami-app/components/partner-card.tsx`
- [ ] T004 [P] Create `api/upload` route in `nomami-app/app/api/upload/route.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Admin Uploads Partner Logo (Priority: P1)

**Goal**: Enable admins to upload and associate logos with partners

**Independent Test**: Upload an image via the Add Partner form and verify it appears in `public/uploads` and is linked in the DB.

### Implementation for User Story 1

- [ ] T005 [US1] Update `getPartners` query in `nomami-app/lib/queries.ts` to include `logo_url`
- [ ] T006 [US1] Update `api/partners` route to handle `logo_url` in POST/PUT requests
- [ ] T007 [US1] Update `AddPartnerForm` in `nomami-app/components/add-partner-form.tsx` to include file input and upload logic
- [ ] T008 [US1] Update `PartnerActions` (edit dialog) to handle logo updates

**Checkpoint**: Admin can upload logos for partners

---

## Phase 4: User Story 2 - Subscriber Views Public Partners Page (Priority: P1)

**Goal**: Publicly accessible page listing all partners

**Independent Test**: Navigate to `/parceiros` without login and see the list of partners with logos.

### Implementation for User Story 2

- [ ] T009 [US2] Create `app/parceiros/page.tsx` fetching data via `getPartners`
- [ ] T010 [US2] Implement grid layout using `PartnerCard` in `app/parceiros/page.tsx`
- [ ] T011 [US2] Ensure responsiveness and styling matches "modern" requirement

**Checkpoint**: Public page is functional and responsive

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T012 Verify error handling for large file uploads
- [ ] T013 Verify default image behavior if logo is missing