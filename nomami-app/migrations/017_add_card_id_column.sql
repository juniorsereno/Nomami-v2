-- Migration: Add card_id column to subscribers table
-- Date: 2025-12-25
-- Description: Adds a unique card_id field for digital card URLs (independent of CPF)

-- Add the card_id column
ALTER TABLE subscribers ADD COLUMN card_id VARCHAR(12) UNIQUE;

-- Generate card_id for existing subscribers
UPDATE subscribers 
SET card_id = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8)) 
WHERE card_id IS NULL;

-- Create index for faster lookups
CREATE INDEX idx_subscribers_card_id ON subscribers(card_id);

COMMENT ON COLUMN subscribers.card_id IS 'Unique identifier for digital card URL access';
