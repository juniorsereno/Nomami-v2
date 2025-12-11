# Implementation Plan: Admin Controlled User Management and Authentication

**Branch**: `013-admin-user-management` | **Date**: 2025-12-10 | **Spec**: [Link to Spec](./spec.md)
**Input**: Feature specification from `/specs/013-admin-user-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This plan outlines the implementation of an admin-controlled user management system and a "First Access" flow for new users, replacing the existing public registration and social login options.

The solution involves:
1.  Extending the Admin interface in `nomami-app` to manage users (Create, Edit, Blind Password Reset).
2.  Creating a "First Access" public route for users to set their password using Email/CPF validation.
3.  Removing Social Login (Google, GitHub) and public Sign Up components/routes.
4.  Enforcing Email and CPF uniqueness and validation.

## Technical Context

**Language/Version**: TypeScript / Node.js (Next.js 14+ App Router)
**Primary Dependencies**: Next.js, React, Tailwind CSS, Shadcn UI, Hook Form, Zod
**Storage**: Neon (PostgreSQL)
**Testing**: Jest / React Testing Library (assumed standard for Next.js)
**Target Platform**: Web (Vercel/Node)
**Project Type**: Web Application
**Performance Goals**: Standard web app responsiveness (< 200ms interaction)
**Constraints**: Secure password handling (hashing), strict role-based access (Admin only for user mgmt)
**Scale/Scope**: Admin module + Public auth flow modification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **Library-First**: N/A (Feature is direct app integration, not a library).
*   **CLI Interface**: N/A (Web UI feature).
*   **Test-First**: Will follow standard testing practices for critical auth flows.
*   **Integration Testing**: Essential for the First Access flow (Email/CPF -> Password Set -> Login).
*   **Simplicity**: Removing external auth providers simplifies the auth architecture significantly.

## Project Structure

### Documentation (this feature)

```text
specs/013-admin-user-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
nomami-app/
├── app/
│   ├── (auth)/
│   │   ├── first-access/      # NEW: First access flow page
│   │   ├── login/             # UPDATE: Remove social/signup links
│   │   └── signup/            # DELETE/DISABLE
│   ├── settings/
│   │   └── users/             # NEW: Admin User Management
│   └── api/
│       ├── auth/
│       │   ├── first-access/  # NEW: Validate and set password endpoint
│       │   └── [...nextauth]/ # UPDATE: Remove providers
│       └── admin/
│           └── users/         # NEW: CRUD endpoints for users
├── components/
│   ├── admin/
│   │   ├── user-form.tsx      # NEW
│   │   └── user-list.tsx      # NEW
│   └── auth/
│       └── first-access-form.tsx # NEW
└── lib/
    ├── actions/
    │   └── user-actions.ts    # NEW: Server actions for user mgmt
    └── validations/
        └── auth.ts            # UPDATE: Schemas for first access
```

**Structure Decision**: Integrated into existing Next.js App Router structure. `app/(auth)` for public flows, `app/settings/users` for protected admin flows. Server Actions preferred for form handling over pure API routes where applicable for simplicity and type safety.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
