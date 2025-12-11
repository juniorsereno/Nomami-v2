# Research: Admin Controlled User Management and Authentication

**Branch**: `013-admin-user-management` | **Date**: 2025-12-10

## Unknowns & Clarifications

### 1. Password Hashing Strategy
**Decision**: Use `bcrypt` via `bcryptjs` (common in Node ecosystem) or `argon2`. Will check `package.json` for existing auth libraries.
**Rationale**: Industry standard for secure password storage.
**Alternatives**: SHA-256 (insecure without salt/work factor), Plaintext (never).

### 2. First Access Security Token
**Decision**: The "First Access" flow will rely on **strict matching of Email and CPF** as the verification method.
**Rationale**: Simplicity and alignment with the requirement "create user with name, email, cpf -> user inputs email, cpf -> sets password". No email service dependency required for this MVP phase.
**Security Note**: This assumes Email and CPF are secret enough for an initial claim. Rate limiting is crucial to prevent brute-forcing CPF against an Email.

### 3. Role Management
**Decision**: A simple `role` column in the `users` table (e.g., 'ADMIN', 'USER').
**Rationale**: The spec implies an "Admin" and regular "Users".
**Alternatives**: Separate tables (too complex), Boolean `is_admin` (less extensible).

### 4. Database Schema Updates
**Decision**: Need to ensure `users` table has `cpf` (unique), `role`, and `password_hash`. Social auth fields (`provider`, `providerAccountId`) can be made nullable or removed if cleaning up strictly.
**Rationale**: Supports the new requirements.

## Technology Choices

| Technology | Choice | Context |
|------------|--------|---------|
| Form Handling | React Hook Form + Zod | Standard for Next.js apps |
| UI Components | Shadcn UI | Existing project standard |
| Auth State | NextAuth.js (Credentials Provider) | Existing, just stripping social providers |
| DB Access | Drizzle or Prisma | Check project for `nomami-app/lib/db-pool.ts` to confirm usage. |