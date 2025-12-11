# Data Model: Admin Controlled User Management

**Branch**: `013-admin-user-management`

## Entities

### User

Represents a system user (Admin or Standard).

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | UUID | Yes | Yes | Primary Key |
| name | String | Yes | No | Full name |
| email | String | Yes | Yes | Login email |
| cpf | String | Yes | Yes | **New**: Tax ID for identification/first access |
| password | String | No | No | Hashed password. Nullable initially, set on First Access. |
| role | String | Yes | No | 'ADMIN' or 'USER' (Default: USER) |
| created_at | DateTime | Yes | No | |
| updated_at | DateTime | Yes | No | |

## Database Changes

### Table: `users`

- **Add Column**: `cpf` (VARCHAR, UNIQUE)
- **Add Column**: `role` (VARCHAR, DEFAULT 'USER') - *Check if exists*
- **Modify**: `password` (Make NULLABLE if not already, to support created-but-not-activated state)

## Validation Rules

- **CPF**: Must be valid format (11 digits), unique.
- **Email**: Must be valid email format, unique.
- **Password**: Min 8 chars, at least 1 number/special char (enforced on application level).