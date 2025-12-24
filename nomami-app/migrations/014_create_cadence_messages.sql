-- Migration: Create cadence_messages table for WhatsApp message cadence
-- Feature: whatsapp-message-cadence
-- Requirements: 1.5, 1.6

CREATE TABLE IF NOT EXISTS cadence_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('text', 'image', 'video')),
    content TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique index for order_number on active messages only
-- This ensures no two active messages can have the same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_cadence_order_active 
ON cadence_messages(order_number) 
WHERE is_active = true;

-- Index for faster queries on active messages
CREATE INDEX IF NOT EXISTS idx_cadence_is_active 
ON cadence_messages(is_active);

COMMENT ON TABLE cadence_messages IS 'Stores WhatsApp cadence messages sent to new subscribers';
COMMENT ON COLUMN cadence_messages.type IS 'Message type: text, image, or video';
COMMENT ON COLUMN cadence_messages.content IS 'Message content (text) or URL (image/video)';
COMMENT ON COLUMN cadence_messages.order_number IS 'Sequence order for sending messages';
COMMENT ON COLUMN cadence_messages.is_active IS 'Whether the message is active in the cadence';
