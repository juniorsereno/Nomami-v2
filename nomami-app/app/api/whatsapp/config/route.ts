/**
 * WhatsApp Configuration API
 * 
 * GET - Get current WhatsApp configuration
 * PUT - Update WhatsApp configuration
 * 
 * Requirements: 5.1, 6.1, 6.2, 6.4
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger, logError } from '@/lib/logger';
import { getWhatsAppConfig, updateWhatsAppConfig } from '@/lib/whatsapp/config';
import { validatePhoneNumber, formatPhoneForWhatsApp } from '@/lib/whatsapp/validation';
import { ConfigResponse, UpdateConfigRequest } from '@/lib/whatsapp/types';

// Validation schema for updating config
const updateConfigSchema = z.object({
  adminPhone: z.string().optional(),
  messageDelay: z.number().int().positive().optional(),
  cadenceEnabled: z.boolean().optional(),
});

/**
 * GET /api/whatsapp/config
 * 
 * Returns the current WhatsApp configuration
 * Requirements: 6.1
 */
export async function GET() {
  try {
    logger.info('Fetching WhatsApp configuration');

    const config = await getWhatsAppConfig();

    const response: ConfigResponse = {
      adminPhone: config.adminPhone,
      messageDelay: config.messageDelay,
      cadenceEnabled: config.cadenceEnabled,
    };

    logger.info('WhatsApp configuration fetched successfully');

    return NextResponse.json(response);
  } catch (error) {
    logError(error, 'Error fetching WhatsApp configuration');
    return NextResponse.json(
      { error: 'Erro ao buscar configuração do WhatsApp' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/whatsapp/config
 * 
 * Updates the WhatsApp configuration
 * Requirements: 5.1, 6.2, 6.4
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = updateConfigSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.flatten() }, 'Invalid config data');
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updates: UpdateConfigRequest = validation.data;

    // Validate and format phone number if provided
    if (updates.adminPhone !== undefined) {
      if (updates.adminPhone === '' || updates.adminPhone === null) {
        // Allow clearing the admin phone
        updates.adminPhone = '';
      } else {
        const phoneValidation = validatePhoneNumber(updates.adminPhone);
        if (!phoneValidation.isValid) {
          return NextResponse.json(
            { error: phoneValidation.errors[0] },
            { status: 400 }
          );
        }

        // Format to WhatsApp format (digits@s.whatsapp.net)
        const formattedPhone = formatPhoneForWhatsApp(updates.adminPhone);
        if (!formattedPhone) {
          return NextResponse.json(
            { error: 'Erro ao formatar número de telefone' },
            { status: 400 }
          );
        }
        updates.adminPhone = formattedPhone;
      }
    }

    logger.info({ updates }, 'Updating WhatsApp configuration');

    const success = await updateWhatsAppConfig(updates);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao salvar configuração' },
        { status: 500 }
      );
    }

    // Fetch updated config
    const config = await getWhatsAppConfig();

    const response: ConfigResponse = {
      adminPhone: config.adminPhone,
      messageDelay: config.messageDelay,
      cadenceEnabled: config.cadenceEnabled,
    };

    logger.info('WhatsApp configuration updated successfully');

    return NextResponse.json(response);
  } catch (error) {
    logError(error, 'Error updating WhatsApp configuration');
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração do WhatsApp' },
      { status: 500 }
    );
  }
}
