-- Migration: Create whatsapp_message_logs table for message sending logs
-- Feature: whatsapp-message-cadence
-- Requirements: 4.1, 4.2

CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID,
    subscriber_name VARCHAR(255),
    subscriber_phone VARCHAR(50),
    message_id UUID REFERENCES cadence_messages(id) ON DELETE SET NULL,
    message_type VARCHAR(10),
    message_content TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    api_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for reverse chronological ordering (most recent first)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at 
ON whatsapp_message_logs(created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status 
ON whatsapp_message_logs(status);

-- Composite index for common query pattern (status + date range)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status_date 
ON whatsapp_message_logs(status, created_at DESC);

COMMENT ON TABLE whatsapp_message_logs IS 'Logs of WhatsApp message sending attempts';
COMMENT ON COLUMN whatsapp_message_logs.subscriber_id IS 'Reference to the subscriber (if available)';
COMMENT ON COLUMN whatsapp_message_logs.subscriber_name IS 'Subscriber name at time of sending';
COMMENT ON COLUMN whatsapp_message_logs.subscriber_phone IS 'Subscriber phone number';
COMMENT ON COLUMN whatsapp_message_logs.message_id IS 'Reference to the cadence message sent';
COMMENT ON COLUMN whatsapp_message_logs.message_type IS 'Type of message: text, image, or video';
COMMENT ON COLUMN whatsapp_message_logs.message_content IS 'Content of the message sent';
COMMENT ON COLUMN whatsapp_message_logs.status IS 'Send status: success, failed, or pending';
COMMENT ON COLUMN whatsapp_message_logs.error_message IS 'Error description if sending failed';
COMMENT ON COLUMN whatsapp_message_logs.api_response IS 'Raw API response from WhatsApp';
