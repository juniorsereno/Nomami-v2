/**
 * WhatsApp API Service
 * 
 * Service for sending messages via WhatsApp Evolution API.
 * Requirements: 3.2, 3.3, 3.4, 5.2
 */

import { ApiResponse, MessageType } from './types';
import { formatPhoneForWhatsApp } from './validation';
import { getWhatsAppConfig } from './config';

// API Configuration
const WHATSAPP_API_BASE_URL = process.env.WHATSAPP_API_URL || '';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
const WHATSAPP_INSTANCE = process.env.WHATSAPP_INSTANCE || 'nomami';

/**
 * Builds the API headers for WhatsApp requests
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'apikey': WHATSAPP_API_KEY,
  };
}

/**
 * Sends a text message via WhatsApp
 * 
 * Requirements: 3.2
 * 
 * @param phone - Phone number (will be formatted to WhatsApp format)
 * @param text - Text message content
 * @returns ApiResponse with success status
 */
export async function sendText(phone: string, text: string): Promise<ApiResponse> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Número de telefone inválido',
      };
    }

    const payload = {
      number: formattedPhone,
      text: text,
      delay: 1000,
      linkPreview: false,
    };

    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/message/sendText/${WHATSAPP_INSTANCE}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem',
    };
  }
}

/**
 * Sends an image via WhatsApp
 * 
 * Requirements: 3.3
 * 
 * @param phone - Phone number (will be formatted to WhatsApp format)
 * @param imageUrl - URL of the image to send
 * @returns ApiResponse with success status
 */
export async function sendImage(phone: string, imageUrl: string): Promise<ApiResponse> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Número de telefone inválido',
      };
    }

    const payload = {
      number: formattedPhone,
      mediatype: 'image',
      mimetype: 'image/jpeg',
      media: imageUrl,
      fileName: 'image.jpg',
    };

    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/message/sendMedia/${WHATSAPP_INSTANCE}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar imagem',
    };
  }
}

/**
 * Sends a video via WhatsApp
 * 
 * Requirements: 3.4
 * 
 * @param phone - Phone number (will be formatted to WhatsApp format)
 * @param videoUrl - URL of the video to send
 * @returns ApiResponse with success status
 */
export async function sendVideo(phone: string, videoUrl: string): Promise<ApiResponse> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Número de telefone inválido',
      };
    }

    const payload = {
      number: formattedPhone,
      mediatype: 'video',
      mimetype: 'video/mp4',
      media: videoUrl,
      fileName: 'video.mp4',
    };

    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/message/sendMedia/${WHATSAPP_INSTANCE}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar vídeo',
    };
  }
}

/**
 * Sends a notification to the admin when a message fails
 * 
 * Requirements: 5.2
 * 
 * @param subscriberName - Name of the subscriber
 * @param subscriberPhone - Phone of the subscriber
 * @param subscriptionDate - Date of subscription
 * @param errorDetails - Optional error details
 * @returns ApiResponse with success status
 */
export async function sendAdminNotification(
  subscriberName: string,
  subscriberPhone: string,
  subscriptionDate: string,
  errorDetails?: string
): Promise<ApiResponse> {
  try {
    const config = await getWhatsAppConfig();
    
    if (!config.adminPhone) {
      return {
        success: false,
        error: 'Telefone do administrador não configurado',
      };
    }

    let message = `ATENÇÃO!\n\nTivemos uma nova assinatura mas não foi possível enviar a mensagem de boas-vindas.\n\nCliente: ${subscriberName}\nTelefone: ${subscriberPhone}\nData Assinatura: ${subscriptionDate}`;
    
    if (errorDetails) {
      message += `\n\nDetalhes do erro: ${errorDetails}`;
    }

    const payload = {
      number: config.adminPhone,
      text: message,
      delay: 1000,
      linkPreview: false,
    };

    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/message/sendText/${WHATSAPP_INSTANCE}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao notificar admin',
    };
  }
}

/**
 * Sends a message based on its type
 * 
 * @param phone - Phone number
 * @param type - Message type (text, image, video)
 * @param content - Message content (text or URL)
 * @returns ApiResponse with success status
 */
export async function sendMessage(
  phone: string,
  type: MessageType,
  content: string
): Promise<ApiResponse> {
  switch (type) {
    case 'text':
      return sendText(phone, content);
    case 'image':
      return sendImage(phone, content);
    case 'video':
      return sendVideo(phone, content);
    default:
      return {
        success: false,
        error: `Tipo de mensagem não suportado: ${type}`,
      };
  }
}

/**
 * Builds the payload for a text message (for testing purposes)
 */
export function buildTextPayload(phone: string, text: string) {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return {
    number: formattedPhone,
    text: text,
    delay: 1000,
    linkPreview: false,
  };
}

/**
 * Builds the payload for an image message (for testing purposes)
 */
export function buildImagePayload(phone: string, imageUrl: string) {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return {
    number: formattedPhone,
    mediatype: 'image',
    mimetype: 'image/jpeg',
    media: imageUrl,
    fileName: 'image.jpg',
  };
}

/**
 * Builds the payload for a video message (for testing purposes)
 */
export function buildVideoPayload(phone: string, videoUrl: string) {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return {
    number: formattedPhone,
    mediatype: 'video',
    mimetype: 'video/mp4',
    media: videoUrl,
    fileName: 'video.mp4',
  };
}
