# Implementation Plan: Corporate Plans

## Overview

Este plano implementa a funcionalidade de Planos Corporativos seguindo os padrões existentes do projeto NoMami. A implementação é incremental, começando pelo banco de dados, seguido pelas queries, APIs e finalmente os componentes de UI.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create migration file for companies tables
    - Create `migrations/019_create_companies_tables.sql`
    - Include: companies, company_plans, company_plan_history, company_billing_history
    - Add indexes for performance
    - _Requirements: 1.3, 1.4, 1.6, 2.4, 6.4_

  - [x] 1.2 Create migration to extend subscribers table
    - Create `migrations/020_extend_subscribers_corporate.sql`
    - Add columns: company_id, subscriber_type, removed_at
    - Add foreign key constraint and indexes
    - _Requirements: 3.3, 3.6, 8.1_

  - [x] 1.3 Run migrations and verify schema
    - Execute migrations against database
    - Verify all tables and constraints created correctly
    - _Requirements: 1.3, 1.4_

- [x] 2. Core Validation and Types
  - [x] 2.1 Create company types and validation module
    - Create `lib/companies/types.ts` with TypeScript interfaces
    - Create `lib/companies/validation.ts` with CNPJ, email, required field validators
    - _Requirements: 1.2, 1.5, 9.2, 9.4_

  - [x] 2.2 Write property tests for validation
    - **Property 1: Company and Subscriber Validation**
    - **Property 3: CNPJ Uniqueness**
    - Test CNPJ format validation with random inputs
    - Test required field validation
    - _Requirements: 1.2, 1.5, 9.4_

  - [x] 2.3 Create billing calculation utilities
    - Create `lib/companies/billing.ts` with calculation functions
    - Implement: calculateMonthlyValue, calculateNextBillingDate
    - _Requirements: 2.3, 2.5, 6.1, 6.3_

  - [x] 2.4 Write property tests for billing calculations
    - **Property 4: Billing Calculation Consistency**
    - Test formula: quantity × price = total
    - Test date calculations for various billing days
    - _Requirements: 2.3, 2.5, 6.3_

- [x] 3. Checkpoint - Verify core utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Company Queries
  - [x] 4.1 Create company queries module
    - Create `lib/companies/queries.ts`
    - Implement: createCompany, getCompanies, getCompanyById, updateCompany
    - Implement: getCompanyStats (metrics)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 9.3_

  - [x] 4.2 Write property tests for metrics accuracy
    - **Property 8: Metrics Accuracy**
    - Test that metrics match actual database counts
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.3 Create company plan queries
    - Add to `lib/companies/queries.ts`
    - Implement: createPlan, updatePlan, getPlanHistory
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

  - [x] 4.4 Write property tests for plan history
    - **Property 5: Plan History Tracking**
    - Test that updates create history records
    - _Requirements: 2.4_

- [x] 5. Corporate Subscriber Queries
  - [x] 5.1 Create corporate subscriber queries
    - Create `lib/companies/subscriber-queries.ts`
    - Implement: addCorporateSubscriber, removeCorporateSubscriber, getCompanySubscribers
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 5.2 Write property tests for soft delete
    - **Property 7: Soft Delete Preservation**
    - Test that removed subscribers remain in database
    - _Requirements: 3.6, 3.7_

  - [x] 5.3 Write property tests for billing inheritance
    - **Property 6: Corporate Subscriber Billing Inheritance**
    - Test that new subscribers inherit company billing date
    - _Requirements: 3.3_

  - [x] 5.4 Implement company status cascade
    - Add cascade logic to updateCompany function
    - Handle 'cancelled' status → deactivate all subscribers
    - _Requirements: 9.5, 9.6_

  - [x] 5.5 Write property tests for cascade behavior
    - **Property 9: Company Status Cascade Behavior**
    - Test suspended vs cancelled behavior
    - _Requirements: 9.5, 9.6_

- [x] 6. Checkpoint - Verify queries
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. API Routes
  - [x] 7.1 Create companies API routes
    - Create `app/api/companies/route.ts` (GET list, POST create)
    - Create `app/api/companies/[id]/route.ts` (GET detail, PUT update, DELETE)
    - _Requirements: 1.1, 1.2, 1.3, 4.4, 4.6, 9.1, 9.2_

  - [x] 7.2 Create company subscribers API routes
    - Create `app/api/companies/[id]/subscribers/route.ts` (GET list, POST add)
    - Create `app/api/companies/[id]/subscribers/[subscriberId]/route.ts` (DELETE remove)
    - _Requirements: 3.1, 3.2, 3.6, 5.4, 5.5, 5.6_

  - [x] 7.3 Create company stats API route
    - Create `app/api/companies/stats/route.ts`
    - Return: totalCompanies, totalCorporateSubscribers, corporateMrr
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.4 Create export API routes
    - Create `app/api/companies/export/route.ts` (companies CSV)
    - Create `app/api/companies/[id]/subscribers/export/route.ts` (subscribers CSV)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 7.5 Write property tests for export completeness
    - **Property 12: Export Data Completeness**
    - Test that CSV contains all required fields
    - _Requirements: 10.2, 10.4_

- [x] 8. Extend Existing Subscribers
  - [x] 8.1 Update subscribers queries for corporate filter
    - Modify `lib/queries.ts` getSubscribers to support type filter
    - Add company_name to subscriber response for corporate type
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 8.2 Write property tests for filter accuracy
    - **Property 11: Subscriber Type Filter Accuracy**
    - Test filter returns correct subscriber types
    - _Requirements: 8.2, 8.5_

  - [x] 8.3 Update subscribers table columns component
    - Modify `app/subscribers/columns.tsx` to show company badge
    - Add company name column for corporate subscribers
    - _Requirements: 8.1, 8.3_

- [x] 9. Checkpoint - Verify APIs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. UI Components - Companies Page
  - [x] 10.1 Create companies page structure
    - Create `app/empresas/page.tsx` following partners page pattern
    - Add to sidebar navigation in `components/app-sidebar.tsx`
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

  - [x] 10.2 Create company section cards component
    - Create `components/company-section-cards.tsx`
    - Display: total companies, total subscribers, corporate MRR
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 10.3 Create companies table component
    - Create `app/empresas/columns.tsx` with column definitions
    - Create `components/companies-table.tsx` using DataTable
    - Show: name, CNPJ, contracted qty, active subscribers, monthly value, status
    - _Requirements: 4.5, 4.6_

  - [x] 10.4 Create add company form
    - Create `components/add-company-form.tsx` dialog
    - Include company info and plan configuration fields
    - _Requirements: 1.1, 1.2, 2.2_

- [x] 11. UI Components - Company Detail Page
  - [x] 11.1 Create company detail page
    - Create `app/empresas/[id]/page.tsx`
    - Display company info, plan info, subscriber metrics
    - _Requirements: 5.1, 5.2, 5.3, 6.2_

  - [x] 11.2 Create company subscribers table
    - Create `components/company-subscribers-table.tsx`
    - Include status filter and search functionality
    - _Requirements: 5.4, 5.5, 5.6_

  - [x] 11.3 Create add corporate subscriber form
    - Create `components/add-corporate-subscriber-form.tsx` dialog
    - Include: name, CPF, phone, email fields
    - Show warning if exceeding contracted quantity
    - _Requirements: 3.2, 3.5_

  - [x] 11.4 Create edit company dialog
    - Create `components/edit-company-dialog.tsx`
    - Allow editing all fields except CNPJ
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 12. Digital Card Extension
  - [x] 12.1 Extend digital card for corporate subscribers
    - Modify `components/digital-card.tsx` to show company name
    - Handle inactive corporate subscriber display
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 12.2 Write property tests for card display
    - **Property 10: Digital Card Display Completeness**
    - Test that all required fields are displayed
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 12.3 Update card API to handle corporate subscribers
    - Modify card lookup to include company information
    - _Requirements: 7.1, 7.2_

- [x] 13. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Test end-to-end flow: create company → add subscribers → view card

## Notes

- All tasks including property-based tests are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Follow existing code patterns from partners and subscribers modules
