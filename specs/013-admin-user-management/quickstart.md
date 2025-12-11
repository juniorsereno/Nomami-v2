# Quickstart: Admin User Management

## Prerequisites
- Logged in as Admin user (requires manual DB seed for first admin if none exists).

## Admin Flow
1. Navigate to `/settings` -> "Users" tab.
2. Click "Add User".
3. Fill Name, Email, CPF.
4. User is created (status: Pending First Access).

## User Flow
1. Go to `/login`.
2. Click "First Access".
3. Enter Email and CPF.
4. If valid, set new Password.
5. Login with Email + Password.

## Development Verification
- Run `npm run test` to verify auth flows.
- Use `npx drizzle-kit push` (or prisma equivalent) to apply schema changes.