/**
 * WhatsApp Message Cadence Types
 * 
 * Core types for the WhatsApp message cadence system.
 * Requirements: 1.5, 4.1
 */

// Message type enum
export type MessageType = 'text' | 'image' | 'video';

// Message status enum
export type MessageStatus = 'success' | 'failed' | 'pending';

/**
 * Cadence Message - represents a single message in the cadence sequence
 * Requirements: 1.5
 */
export interface CadenceMessage {
  id: string;
  type: MessageType;
  content: string;
  orderNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Log - records each message send attempt
 * Requirements: 4.1
 */
export interface MessageLog {
  id: string;
  subscriberId: string | null;
  subscriberName: string | null;
  subscriberPhone: string | null;
  messageId: string | null;
  messageType: string | null;
  messageContent: string | null;
  status: MessageStatus;
  errorMessage: string | null;
  apiResponse: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * WhatsApp Configuration
 */
export interface WhatsAppConfig {
  adminPhone: string | null;
  messageDelay: number; // milliseconds between messages
  cadenceEnabled: boolean; // whether cadence is enabled for new subscribers
}

/**
 * Validation Result - returned by validation functions
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// API Request/Response types

export interface CreateMessageRequest {
  type: MessageType;
  content: string;
  orderNumber: number;
}

export interface UpdateMessageRequest {
  type?: MessageType;
  content?: string;
  orderNumber?: number;
  isActive?: boolean;
}

export interface ListMessagesResponse {
  messages: CadenceMessage[];
}

export interface ReorderRequest {
  messageIds: string[];
}

export interface ConfigResponse {
  adminPhone: string | null;
  messageDelay: number;
  cadenceEnabled: boolean;
}

export interface UpdateConfigRequest {
  adminPhone?: string;
  messageDelay?: number;
  cadenceEnabled?: boolean;
}

export interface LogsQueryParams {
  page?: number;
  limit?: number;
  status?: MessageStatus;
  startDate?: string;
  endDate?: string;
}

export interface LogsResponse {
  logs: MessageLog[];
  total: number;
  page: number;
  totalPages: number;
}

// WhatsApp API types

export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
