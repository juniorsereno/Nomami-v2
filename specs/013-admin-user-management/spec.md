# Feature Specification: Admin Controlled User Management and Authentication

**Feature Branch**: `013-admin-user-management`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Crie uma especificação para login, cadastro de usuários, gerenciamento de senha, gerenciamento de usuários. O nosso sistema é um sistema de gerenciamento então temos um adm que devemos criar um cadastro diretamente no banco, porém temos que remover qualquer opção de registro externo para criar novos usuários pois só o adm deve ter uma opção nas configuração para controlar os usuários criados, criar usuários, trocar senhas (sem ver a senha atual), trocar nome e email..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin User Management (Priority: P1)

As an Administrator, I want to manage system users from a settings panel so that I can control who has access to the system.

**Why this priority**: This is the fundamental security requirement. Only authorized users created by the admin should exist.

**Independent Test**: Can be tested by logging in as Admin, navigating to Settings > Users, and performing Create, Update, and Password Change actions.

**Acceptance Scenarios**:

1. **Given** I am logged in as Admin, **When** I navigate to User Management and click "Add User", **Then** I can enter Name, Email, and CPF to create a record (Password is not set yet).
2. **Given** an existing user, **When** I edit their profile, **Then** I can update their Name and Email.
3. **Given** an existing user, **When** I select "Change Password", **Then** I can set a new password directly without seeing the old one.
4. **Given** I attempt to create a user with an email or CPF that already exists, **When** I save, **Then** the system displays a duplicate error.

---

### User Story 2 - User First Access Flow (Priority: P2)

As a new User created by the Admin, I want to set my password securely using my CPF and Email so that I can access the system for the first time.

**Why this priority**: Essential for onboarding new users since public registration is being removed.

**Independent Test**: Can be tested by creating a user (via DB or Admin UI) with no password, then using the public "First Access" page to set credentials.

**Acceptance Scenarios**:

1. **Given** I am on the Login page, **When** I click "First Access", **Then** I am taken to a verification form.
2. **Given** I am on the First Access form, **When** I enter a valid Email and CPF combination that exists in the system, **Then** I am prompted to create a new password.
3. **Given** I enter invalid credentials (mismatching Email/CPF), **When** I submit, **Then** I see a generic error message.
4. **Given** I successfully set my password, **When** the process completes, **Then** I can log in with my Email and new Password.

---

### User Story 3 - Cleanup and Security Hardening (Priority: P3)

As a System Owner, I want to remove unauthorized entry points (Social Login, Public Signup) so that access is strictly controlled by the Admin.

**Why this priority**: Enforces the business rule that only Admin-approved users can access the system.

**Independent Test**: visual inspection of the Login page and verification that old routes (e.g., /signup) are inaccessible or redirect.

**Acceptance Scenarios**:

1. **Given** I am on the Login page, **When** I view the options, **Then** I see only "Login" and "First Access" (no "Sign Up", no "Google/GitHub" buttons).
2. **Given** a user attempts to access the old registration URL (if applicable), **When** they load the page, **Then** they are redirected to Login or shown a 404/403.

### Edge Cases

- **Duplicate Data**: Admin attempts to create a user with an existing Email or CPF -> System shows clear error identifying the field.
- **Re-registration**: User attempts "First Access" flow after already setting a password -> System blocks request, directing them to Login.
- **Invalid Input**: Admin or User enters invalid CPF format -> System validates format before submission.
- **Self-Lockout**: Admin attempts to disable or delete their own account -> System prevents action to ensure system remains accessible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an Admin interface to List, Create, and Edit users.
- **FR-002**: System MUST require Name, Email, and CPF for user creation by Admin.
- **FR-003**: System MUST enforce uniqueness for Email and CPF in the database.
- **FR-004**: System MUST allow Admin to override/set a user's password directly (blind reset).
- **FR-005**: System MUST provide a "First Access" public route.
- **FR-006**: "First Access" MUST validate user identity via strict matching of Email and CPF.
- **FR-007**: System MUST allow password setting only after successful First Access validation.
- **FR-008**: System MUST remove all references to Social Login (Google, GitHub) from the frontend.
- **FR-009**: System MUST remove/disable public "Sign Up" functionality.

### Key Entities *(include if feature involves data)*

- **User**: Represents a system user. Attributes: ID, Name, Email, CPF, Password (Hash), CreatedAt, UpdatedAt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can create a new user account in under 30 seconds.
- **SC-002**: 100% of public registration attempts (via UI or old routes) are blocked.
- **SC-003**: Users can successfully set their password via "First Access" with valid CPF/Email.
- **SC-004**: Login page loads with zero external dependencies (no social auth scripts).
