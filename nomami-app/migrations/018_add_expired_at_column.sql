-- Migration: Add expired_at column to subscribers table
-- Date: 2025-12-25
-- Description: Tracks when a subscription was marked as expired for metrics

-- Add the expired_at column
ALTER TABLE subscribers ADD COLUMN expired_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX idx_subscribers_expired_at ON subscribers(expired_at);

-- Populate expired_at for existing expired subscribers (estimate based on next_due_date)
UPDATE subscribers SET expired_at = next_due_date WHERE status = 'vencido' AND expired_at IS NULL;

COMMENT ON COLUMN subscribers.expired_at IS 'Timestamp when the subscription was marked as expired';
