/**
 * WhatsApp Configuration Service
 * 
 * Manages WhatsApp configuration stored in the database.
 */

import { WhatsAppConfig } from './types';
import { neon } from '@neondatabase/serverless';

const DEFAULT_MESSAGE_DELAY = 2000; // 2 seconds between messages
const DEFAULT_CADENCE_ENABLED = false; // Disabled by default for safety

/**
 * Gets the WhatsApp configuration from the database
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      SELECT key, value FROM whatsapp_config
      WHERE key IN ('admin_phone', 'message_delay', 'cadence_enabled')
    `;
    
    const config: WhatsAppConfig = {
      adminPhone: null,
      messageDelay: DEFAULT_MESSAGE_DELAY,
      cadenceEnabled: DEFAULT_CADENCE_ENABLED,
    };
    
    for (const row of result) {
      if (row.key === 'admin_phone') {
        config.adminPhone = row.value;
      } else if (row.key === 'message_delay') {
        config.messageDelay = parseInt(row.value, 10) || DEFAULT_MESSAGE_DELAY;
      } else if (row.key === 'cadence_enabled') {
        config.cadenceEnabled = row.value === 'true';
      }
    }
    
    return config;
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return {
      adminPhone: null,
      messageDelay: DEFAULT_MESSAGE_DELAY,
      cadenceEnabled: DEFAULT_CADENCE_ENABLED,
    };
  }
}

/**
 * Updates the WhatsApp configuration in the database
 */
export async function updateWhatsAppConfig(
  config: Partial<WhatsAppConfig>
): Promise<boolean> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    if (config.adminPhone !== undefined) {
      await sql`
        INSERT INTO whatsapp_config (key, value, updated_at)
        VALUES ('admin_phone', ${config.adminPhone}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${config.adminPhone}, updated_at = NOW()
      `;
    }
    
    if (config.messageDelay !== undefined) {
      await sql`
        INSERT INTO whatsapp_config (key, value, updated_at)
        VALUES ('message_delay', ${config.messageDelay.toString()}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${config.messageDelay.toString()}, updated_at = NOW()
      `;
    }
    
    if (config.cadenceEnabled !== undefined) {
      await sql`
        INSERT INTO whatsapp_config (key, value, updated_at)
        VALUES ('cadence_enabled', ${config.cadenceEnabled.toString()}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${config.cadenceEnabled.toString()}, updated_at = NOW()
      `;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    return false;
  }
}
