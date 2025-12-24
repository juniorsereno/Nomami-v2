/**
 * WhatsApp Message Log Service
 * 
 * Business logic for managing message logs.
 * This service can be used by API routes and tested independently.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { MessageLog, MessageStatus } from './types';

/**
 * In-memory log store for testing
 * In production, this would be replaced with database operations
 */
export class LogStore {
  private logs: Map<string, MessageLog> = new Map();
  private idCounter = 0;

  /**
   * Generates a unique ID for a new log
   */
  private generateId(): string {
    this.idCounter++;
    return `log-${this.idCounter}-${Date.now()}`;
  }

  /**
   * Creates a new message log entry
   * Requirements: 4.1, 4.2
   */
  create(params: {
    subscriberId?: string;
    subscriberName?: string;
    subscriberPhone?: string;
    messageId?: string;
    messageType?: string;
    messageContent?: string;
    status: MessageStatus;
    errorMessage?: string;
    apiResponse?: Record<string, unknown>;
  }): MessageLog {
    const log: MessageLog = {
      id: this.generateId(),
      subscriberId: params.subscriberId || null,
      subscriberName: params.subscriberName || null,
      subscriberPhone: params.subscriberPhone || null,
      messageId: params.messageId || null,
      messageType: params.messageType || null,
      messageContent: params.messageContent || null,
      status: params.status,
      errorMessage: params.errorMessage || null,
      apiResponse: params.apiResponse || null,
      createdAt: new Date(),
    };

    this.logs.set(log.id, log);
    return log;
  }

  /**
   * Gets a log by ID
   */
  getById(id: string): MessageLog | null {
    return this.logs.get(id) || null;
  }

  /**
   * Gets all logs ordered by createdAt descending (most recent first)
   * Requirements: 4.3
   */
  getAll(options?: {
    status?: MessageStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): { logs: MessageLog[]; total: number } {
    let filtered = Array.from(this.logs.values());

    // Apply filters
    if (options?.status) {
      filtered = filtered.filter(log => log.status === options.status);
    }
    if (options?.startDate) {
      filtered = filtered.filter(log => log.createdAt >= options.startDate!);
    }
    if (options?.endDate) {
      filtered = filtered.filter(log => log.createdAt <= options.endDate!);
    }

    // Sort by createdAt descending (most recent first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;

    // Apply pagination
    if (options?.page && options?.limit) {
      const offset = (options.page - 1) * options.limit;
      filtered = filtered.slice(offset, offset + options.limit);
    }

    return { logs: filtered, total };
  }

  /**
   * Clears all logs (for testing)
   */
  clear(): void {
    this.logs.clear();
    this.idCounter = 0;
  }

  /**
   * Gets the count of logs
   */
  count(): number {
    return this.logs.size;
  }
}

/**
 * Validates that logs are in descending order by createdAt
 */
export function validateLogOrdering(logs: MessageLog[]): boolean {
  if (logs.length <= 1) return true;
  
  for (let i = 1; i < logs.length; i++) {
    if (logs[i].createdAt.getTime() > logs[i - 1].createdAt.getTime()) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates that a log entry has all required fields
 */
export function validateLogFields(log: MessageLog): boolean {
  // Required fields
  if (!log.id) return false;
  if (!log.status) return false;
  if (!log.createdAt) return false;
  
  // If status is 'failed', errorMessage should be present
  // (this is a soft validation - we don't enforce it strictly)
  
  return true;
}
