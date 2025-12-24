/**
 * WhatsApp Cadence Execution Service
 * 
 * Service for executing the message cadence for new subscribers.
 * Handles sending messages in sequence with delays and logging.
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2, 5.2, 5.3, 5.4
 */

import sql from '@/lib/db-pool';
import { logger, logError } from '@/lib/logger';
import { CadenceMessage, MessageLog, MessageStatus } from './types';
import { sendMessage, sendAdminNotification } from './api-service';
import { getWhatsAppConfig } from './config';

/**
 * Subscriber information for cadence execution
 */
export interface SubscriberInfo {
  id: string;
  name: string;
  phone: string;
  subscriptionDate: string;
}

/**
 * Result of cadence execution
 */
export interface CadenceExecutionResult {
  success: boolean;
  messagesAttempted: number;
  messagesSucceeded: number;
  messagesFailed: number;
  errors: string[];
}

/**
 * Delays execution for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extracts the first name from a full name
 */
function getFirstName(fullName: string): string {
  if (!fullName || fullName.trim().length === 0) {
    return 'Cliente';
  }
  return fullName.trim().split(/\s+/)[0];
}

/**
 * Replaces variables in message content with subscriber data
 * Supported variables:
 * - {nome} - First name of the subscriber
 * - {nome_completo} - Full name of the subscriber
 * - {telefone} - Phone number of the subscriber
 * - {data_assinatura} - Subscription date
 */
export function replaceMessageVariables(
  content: string,
  subscriber: SubscriberInfo
): string {
  const firstName = getFirstName(subscriber.name);
  
  // Use a function replacer to avoid issues with special regex replacement patterns ($&, $`, etc.)
  return content
    .replace(/\{nome\}/gi, () => firstName)
    .replace(/\{nome_completo\}/gi, () => subscriber.name || 'Cliente')
    .replace(/\{telefone\}/gi, () => subscriber.phone || '')
    .replace(/\{data_assinatura\}/gi, () => subscriber.subscriptionDate || '');
}

/**
 * Fetches all active cadence messages ordered by order_number
 * Requirements: 3.1
 */
async function getActiveCadenceMessages(): Promise<CadenceMessage[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        type,
        content,
        order_number as "orderNumber",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cadence_messages
      WHERE is_active = true
      ORDER BY order_number ASC
    `;

    return result.map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      orderNumber: row.orderNumber,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  } catch (error) {
    logError(error, 'Error fetching cadence messages');
    return [];
  }
}

/**
 * Creates a log entry for a message send attempt
 * Requirements: 4.1, 4.2
 */
async function createMessageLog(params: {
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  messageId: string;
  messageType: string;
  messageContent: string;
  status: MessageStatus;
  errorMessage?: string;
  apiResponse?: Record<string, unknown>;
}): Promise<MessageLog | null> {
  try {
    // Check if subscriberId is a valid UUID, otherwise use null
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.subscriberId);
    const subscriberIdValue = isValidUUID ? params.subscriberId : null;

    const result = await sql`
      INSERT INTO whatsapp_message_logs (
        subscriber_id,
        subscriber_name,
        subscriber_phone,
        message_id,
        message_type,
        message_content,
        status,
        error_message,
        api_response,
        created_at
      )
      VALUES (
        ${subscriberIdValue}::uuid,
        ${params.subscriberName},
        ${params.subscriberPhone},
        ${params.messageId}::uuid,
        ${params.messageType},
        ${params.messageContent},
        ${params.status},
        ${params.errorMessage || null},
        ${params.apiResponse ? JSON.stringify(params.apiResponse) : null},
        NOW()
      )
      RETURNING 
        id,
        subscriber_id as "subscriberId",
        subscriber_name as "subscriberName",
        subscriber_phone as "subscriberPhone",
        message_id as "messageId",
        message_type as "messageType",
        message_content as "messageContent",
        status,
        error_message as "errorMessage",
        api_response as "apiResponse",
        created_at as "createdAt"
    `;

    return {
      id: result[0].id,
      subscriberId: result[0].subscriberId,
      subscriberName: result[0].subscriberName,
      subscriberPhone: result[0].subscriberPhone,
      messageId: result[0].messageId,
      messageType: result[0].messageType,
      messageContent: result[0].messageContent,
      status: result[0].status,
      errorMessage: result[0].errorMessage,
      apiResponse: result[0].apiResponse,
      createdAt: new Date(result[0].createdAt),
    };
  } catch (error) {
    logError(error, 'Error creating message log');
    return null;
  }
}

/**
 * Notifies the admin about a failed message
 * Requirements: 5.2, 5.3, 5.4
 */
async function notifyAdminOnFailure(
  subscriber: SubscriberInfo,
  errorDetails: string
): Promise<void> {
  try {
    const config = await getWhatsAppConfig();
    
    // If admin phone is not configured, just log and return
    // Requirements: 5.3
    if (!config.adminPhone) {
      logger.warn(
        { subscriberId: subscriber.id, error: errorDetails },
        'Admin phone not configured, skipping failure notification'
      );
      return;
    }

    logger.info(
      { subscriberId: subscriber.id, adminPhone: config.adminPhone },
      'Sending failure notification to admin'
    );

    const result = await sendAdminNotification(
      subscriber.name,
      subscriber.phone,
      subscriber.subscriptionDate,
      errorDetails
    );

    if (!result.success) {
      // Log secondary failure without retrying
      // Requirements: 5.4
      logger.error(
        { 
          subscriberId: subscriber.id, 
          adminPhone: config.adminPhone,
          error: result.error 
        },
        'Failed to send admin notification (secondary failure)'
      );
    } else {
      logger.info(
        { subscriberId: subscriber.id },
        'Admin notification sent successfully'
      );
    }
  } catch (error) {
    // Log secondary failure without retrying
    logError(error, 'Error sending admin notification');
  }
}

/**
 * Executes the cadence for a new subscriber
 * Sends all active messages in order with configurable delay
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2
 */
export async function executeCadence(
  subscriber: SubscriberInfo
): Promise<CadenceExecutionResult> {
  const result: CadenceExecutionResult = {
    success: true,
    messagesAttempted: 0,
    messagesSucceeded: 0,
    messagesFailed: 0,
    errors: [],
  };

  logger.info(
    { subscriberId: subscriber.id, subscriberName: subscriber.name },
    'Starting cadence execution'
  );

  try {
    // Get all active messages
    const messages = await getActiveCadenceMessages();
    
    if (messages.length === 0) {
      logger.info({ subscriberId: subscriber.id }, 'No cadence messages configured');
      return result;
    }

    // Get configuration for delay
    const config = await getWhatsAppConfig();
    const messageDelay = config.messageDelay || 2000;

    logger.info(
      { 
        subscriberId: subscriber.id, 
        messageCount: messages.length,
        messageDelay 
      },
      'Executing cadence with messages'
    );

    // Send each message in order
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      result.messagesAttempted++;

      logger.info(
        { 
          subscriberId: subscriber.id, 
          messageId: message.id,
          messageOrder: message.orderNumber,
          messageType: message.type 
        },
        'Sending cadence message'
      );

      // Send the message with variable substitution
      const processedContent = replaceMessageVariables(message.content, subscriber);
      
      const sendResult = await sendMessage(
        subscriber.phone,
        message.type,
        processedContent
      );

      // Create log entry (log the processed content)
      const logStatus: MessageStatus = sendResult.success ? 'success' : 'failed';
      await createMessageLog({
        subscriberId: subscriber.id,
        subscriberName: subscriber.name,
        subscriberPhone: subscriber.phone,
        messageId: message.id,
        messageType: message.type,
        messageContent: processedContent,
        status: logStatus,
        errorMessage: sendResult.error,
        apiResponse: sendResult.data as Record<string, unknown> | undefined,
      });

      if (sendResult.success) {
        result.messagesSucceeded++;
        logger.info(
          { 
            subscriberId: subscriber.id, 
            messageId: message.id 
          },
          'Cadence message sent successfully'
        );
      } else {
        result.messagesFailed++;
        result.errors.push(`Message ${message.orderNumber}: ${sendResult.error}`);
        result.success = false;
        
        logger.error(
          { 
            subscriberId: subscriber.id, 
            messageId: message.id,
            error: sendResult.error 
          },
          'Failed to send cadence message'
        );

        // Notify admin about the failure
        await notifyAdminOnFailure(
          subscriber,
          `Falha ao enviar mensagem ${message.orderNumber}: ${sendResult.error}`
        );
      }

      // Wait before sending next message (except for the last one)
      if (i < messages.length - 1) {
        await delay(messageDelay);
      }
    }

    logger.info(
      { 
        subscriberId: subscriber.id,
        messagesAttempted: result.messagesAttempted,
        messagesSucceeded: result.messagesSucceeded,
        messagesFailed: result.messagesFailed 
      },
      'Cadence execution completed'
    );

    return result;
  } catch (error) {
    logError(error, 'Error executing cadence');
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    // Notify admin about the general failure
    await notifyAdminOnFailure(
      subscriber,
      `Erro geral na execução da cadência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
    
    return result;
  }
}
