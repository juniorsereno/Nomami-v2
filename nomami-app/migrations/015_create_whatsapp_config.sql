-- Migration: Create whatsapp_config table for key-value configuration
-- Feature: whatsapp-message-cadence
-- Requirements: 5.1, 6.2

CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration values
INSERT INTO whatsapp_config (key, value) VALUES 
    ('admin_phone', ''),
    ('message_delay', '3000')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE whatsapp_config IS 'Key-value store for WhatsApp configuration settings';
COMMENT ON COLUMN whatsapp_config.key IS 'Configuration key (e.g., admin_phone, message_delay)';
COMMENT ON COLUMN whatsapp_config.value IS 'Configuration value';
