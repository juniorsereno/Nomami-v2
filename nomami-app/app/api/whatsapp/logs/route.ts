/**
 * WhatsApp Message Logs API
 * 
 * GET - List message logs with pagination and filters
 * 
 * Requirements: 4.3
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db-pool';
import { logger, logError } from '@/lib/logger';
import { MessageLog, LogsResponse, MessageStatus } from '@/lib/whatsapp/types';

/**
 * GET /api/whatsapp/logs
 * 
 * Returns message logs with pagination and filtering
 * Logs are returned in reverse chronological order (most recent first)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status (success, failed, pending)
 * - startDate: Filter logs from this date (ISO format)
 * - endDate: Filter logs until this date (ISO format)
 * 
 * Requirements: 4.3
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') as MessageStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const offset = (page - 1) * limit;

    logger.info({ page, limit, status, startDate, endDate }, 'Fetching WhatsApp message logs');

    // Build query with filters
    let logsQuery;
    let countQuery;

    if (status && startDate && endDate) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE status = ${status}
          AND created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE status = ${status}
          AND created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
      `;
    } else if (status && startDate) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE status = ${status}
          AND created_at >= ${startDate}::timestamp
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE status = ${status}
          AND created_at >= ${startDate}::timestamp
      `;
    } else if (status && endDate) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE status = ${status}
          AND created_at <= ${endDate}::timestamp
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE status = ${status}
          AND created_at <= ${endDate}::timestamp
      `;
    } else if (startDate && endDate) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
      `;
    } else if (status) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE status = ${status}
      `;
    } else if (startDate) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE created_at >= ${startDate}::timestamp
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE created_at >= ${startDate}::timestamp
      `;
    } else if (endDate) {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        WHERE created_at <= ${endDate}::timestamp
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
        WHERE created_at <= ${endDate}::timestamp
      `;
    } else {
      logsQuery = sql`
        SELECT 
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
        FROM whatsapp_message_logs
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM whatsapp_message_logs
      `;
    }

    const [logsResult, countResult] = await Promise.all([logsQuery, countQuery]);

    const logs: MessageLog[] = logsResult.map(row => ({
      id: row.id,
      subscriberId: row.subscriberId,
      subscriberName: row.subscriberName,
      subscriberPhone: row.subscriberPhone,
      messageId: row.messageId,
      messageType: row.messageType,
      messageContent: row.messageContent,
      status: row.status,
      errorMessage: row.errorMessage,
      apiResponse: row.apiResponse,
      createdAt: new Date(row.createdAt),
    }));

    const total = parseInt(countResult[0]?.total || '0', 10);
    const totalPages = Math.ceil(total / limit);

    const response: LogsResponse = {
      logs,
      total,
      page,
      totalPages,
    };

    logger.info({ count: logs.length, total, page, totalPages }, 'WhatsApp message logs fetched successfully');

    return NextResponse.json(response);
  } catch (error) {
    logError(error, 'Error fetching WhatsApp message logs');
    return NextResponse.json(
      { error: 'Erro ao buscar logs de mensagens' },
      { status: 500 }
    );
  }
}
