-- Migration: Add CPF and Role columns to users table
-- Feature: 013-admin-user-management

ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER' NOT NULL;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- If you have existing users, you might need to handle NULL CPFs or set a default role.
-- For now, we assume existing data is compatible or this is a fresh setup.