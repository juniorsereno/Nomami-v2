-- Migration: Extend subscribers table for corporate plans feature
-- Requirements: 3.3, 3.6, 8.1

-- Add company_id column to link corporate subscribers to their company
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add subscriber_type column to distinguish individual from corporate subscribers
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS subscriber_type VARCHAR(20) DEFAULT 'individual' CHECK (subscriber_type IN ('individual', 'corporate'));

-- Add removed_at column for soft delete tracking of corporate subscribers
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_company_id ON subscribers(company_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_type ON subscribers(subscriber_type);
CREATE INDEX IF NOT EXISTS idx_subscribers_removed_at ON subscribers(removed_at);

-- Composite index for corporate subscriber queries
CREATE INDEX IF NOT EXISTS idx_subscribers_corporate ON subscribers(company_id, status) WHERE subscriber_type = 'corporate';
