# Requirements Document

## Introduction

Este documento define os requisitos para a funcionalidade de **Planos Corporativos** do sistema NoMami. A funcionalidade permite que empresas contratem o clube de benefícios para seus colaboradores, com gestão centralizada de assinantes corporativos, cobrança unificada e visibilidade completa de métricas por empresa.

## Glossary

- **Company**: Empresa que contrata o plano corporativo para seus colaboradores
- **Corporate_Subscriber**: Colaborador de uma empresa que tem acesso ao clube através do plano corporativo
- **Company_Plan**: Plano contratado pela empresa, incluindo quantidade de colaboradores e valor
- **System**: O sistema NoMami de gestão do clube de benefícios
- **Admin**: Usuário administrador do sistema NoMami
- **Billing_Cycle**: Ciclo de cobrança mensal da empresa

## Requirements

### Requirement 1: Cadastro de Empresas

**User Story:** As an Admin, I want to register companies in the system, so that I can manage corporate subscription plans.

#### Acceptance Criteria

1. WHEN an Admin accesses the companies page, THE System SHALL display a button to add a new company
2. WHEN an Admin submits a new company form, THE System SHALL validate required fields (company name, CNPJ, contact email, contact phone, contact person name)
3. WHEN a valid company is submitted, THE System SHALL create the company record with status "active"
4. WHEN a company is created, THE System SHALL generate a unique company identifier
5. IF a company with the same CNPJ already exists, THEN THE System SHALL reject the creation and display an error message
6. WHEN a company is created, THE System SHALL record the creation date and the Admin who created it

### Requirement 2: Gestão de Plano Corporativo

**User Story:** As an Admin, I want to configure the corporate plan for each company, so that I can define pricing and subscriber limits.

#### Acceptance Criteria

1. WHEN an Admin views a company, THE System SHALL display the current plan configuration
2. WHEN an Admin configures a plan, THE System SHALL require: contracted quantity, price per subscriber, billing day, and start date
3. WHEN a plan is configured, THE System SHALL calculate the total monthly value (quantity × price per subscriber)
4. WHEN a plan is updated, THE System SHALL maintain history of plan changes
5. WHEN the contracted quantity changes, THE System SHALL update the next billing amount accordingly
6. THE System SHALL support plan status: active, suspended, cancelled

### Requirement 3: Gestão de Colaboradores Corporativos

**User Story:** As an Admin, I want to add and remove company employees from the corporate plan, so that I can manage who has access to club benefits.

#### Acceptance Criteria

1. WHEN an Admin views a company, THE System SHALL display a list of all corporate subscribers
2. WHEN an Admin adds a corporate subscriber, THE System SHALL require: name, CPF, phone, and email
3. WHEN a corporate subscriber is added, THE System SHALL inherit the company's billing cycle (next_due_date)
4. WHEN a corporate subscriber is added, THE System SHALL generate a unique card_id for the digital card
5. IF the number of active subscribers exceeds the contracted quantity, THEN THE System SHALL display a warning but allow the addition
6. WHEN a corporate subscriber is removed, THE System SHALL set their status to "inactive" and record the removal date
7. WHEN a corporate subscriber is removed, THE System SHALL NOT delete the record (soft delete)
8. WHEN viewing a corporate subscriber, THE System SHALL display their company association

### Requirement 4: Dashboard de Empresas

**User Story:** As an Admin, I want to see metrics about corporate plans, so that I can monitor the corporate segment performance.

#### Acceptance Criteria

1. WHEN an Admin accesses the companies page, THE System SHALL display total number of active companies
2. WHEN an Admin accesses the companies page, THE System SHALL display total number of corporate subscribers
3. WHEN an Admin accesses the companies page, THE System SHALL display total MRR from corporate plans
4. WHEN an Admin accesses the companies page, THE System SHALL display a list of all companies with subscriber count
5. WHEN viewing the companies list, THE System SHALL show: company name, CNPJ, contracted quantity, active subscribers, monthly value, status
6. WHEN an Admin clicks on a company, THE System SHALL navigate to the company detail page

### Requirement 5: Detalhes da Empresa

**User Story:** As an Admin, I want to view detailed information about a company, so that I can manage their corporate plan effectively.

#### Acceptance Criteria

1. WHEN an Admin views a company detail page, THE System SHALL display company information (name, CNPJ, contact details)
2. WHEN an Admin views a company detail page, THE System SHALL display plan information (contracted quantity, price, billing day, total value)
3. WHEN an Admin views a company detail page, THE System SHALL display subscriber metrics (active count, inactive count, utilization percentage)
4. WHEN an Admin views a company detail page, THE System SHALL display a table of all corporate subscribers
5. WHEN viewing subscribers table, THE System SHALL allow filtering by status (active, inactive)
6. WHEN viewing subscribers table, THE System SHALL allow searching by name, CPF, or phone

### Requirement 6: Cobrança Corporativa

**User Story:** As an Admin, I want to track billing information for corporate plans, so that I can manage company payments.

#### Acceptance Criteria

1. WHEN a company is created with a plan, THE System SHALL set the next billing date based on the billing day
2. WHEN viewing a company, THE System SHALL display the next billing date and amount
3. WHEN the billing day arrives, THE System SHALL calculate the billing amount based on contracted quantity
4. THE System SHALL store billing history for each company
5. WHEN a payment is registered, THE System SHALL update the next billing date to the following month
6. IF a company has overdue payment, THEN THE System SHALL display a visual indicator on the company card

### Requirement 7: Carteirinha Digital Corporativa

**User Story:** As a Corporate_Subscriber, I want to access my digital membership card, so that I can use club benefits at partner locations.

#### Acceptance Criteria

1. WHEN a corporate subscriber accesses their card via card_id, THE System SHALL display the digital card
2. WHEN displaying the card, THE System SHALL show: subscriber name, company name, card_id, validity date
3. WHEN displaying the card, THE System SHALL show the card status (active, inactive, expired)
4. IF the corporate subscriber is inactive, THEN THE System SHALL display an expired/invalid card message
5. THE System SHALL use the same card display component as individual subscribers

### Requirement 8: Integração com Assinantes Existentes

**User Story:** As an Admin, I want to distinguish between individual and corporate subscribers, so that I can manage them appropriately.

#### Acceptance Criteria

1. WHEN viewing the main subscribers list, THE System SHALL indicate if a subscriber is corporate (company badge)
2. WHEN filtering subscribers, THE System SHALL allow filtering by subscriber type (individual, corporate)
3. WHEN viewing a corporate subscriber in the main list, THE System SHALL display their company name
4. THE System SHALL NOT allow editing company-related fields of corporate subscribers from the main subscribers page
5. WHEN a corporate subscriber is searched by CPF or card_id, THE System SHALL return the subscriber regardless of type

### Requirement 9: Edição de Empresa

**User Story:** As an Admin, I want to edit company information, so that I can keep company data up to date.

#### Acceptance Criteria

1. WHEN an Admin clicks edit on a company, THE System SHALL display an edit form with current values
2. WHEN an Admin updates company information, THE System SHALL validate all required fields
3. WHEN company information is updated, THE System SHALL record the update timestamp
4. THE System SHALL NOT allow changing the company CNPJ after creation
5. WHEN an Admin changes company status to "suspended", THE System SHALL NOT deactivate corporate subscribers automatically
6. WHEN an Admin changes company status to "cancelled", THE System SHALL set all corporate subscribers to inactive

### Requirement 10: Relatórios Corporativos

**User Story:** As an Admin, I want to export corporate plan data, so that I can generate reports and share with stakeholders.

#### Acceptance Criteria

1. WHEN viewing the companies list, THE System SHALL provide an export option
2. WHEN exporting, THE System SHALL generate a CSV file with company and subscriber data
3. WHEN viewing a company detail, THE System SHALL provide an option to export subscriber list
4. THE exported data SHALL include: company name, CNPJ, subscriber name, CPF, status, start date
