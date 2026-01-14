/**
 * WhatsApp Cadence Message Service
 * 
 * Business logic for managing cadence messages.
 * This service can be used by API routes and tested independently.
 * 
 * Requirements: 1.5, 1.6, 1.7, 1.8
 */

import { CadenceMessage, CreateMessageRequest, UpdateMessageRequest } from './types';
import { validateTextMessage, validateMediaUrl } from './validation';

/**
 * In-memory message store for testing
 * In production, this would be replaced with database operations
 */
export class MessageStore {
  private messages: Map<string, CadenceMessage> = new Map();
  private idCounter = 0;

  /**
   * Generates a unique ID for a new message
   */
  private generateId(): string {
    this.idCounter++;
    return `msg-${this.idCounter}-${Date.now()}`;
  }

  /**
   * Creates a new cadence message
   * Requirements: 1.5
   */
  create(request: CreateMessageRequest): CadenceMessage | null {
    // Validate content based on type
    if (request.type === 'text') {
      const validation = validateTextMessage(request.content);
      if (!validation.isValid) return null;
    } else {
      const validation = validateMediaUrl(request.content);
      if (!validation.isValid) return null;
    }

    // Shift existing messages if order conflicts
    const existingAtOrder = this.getByOrder(request.orderNumber);
    if (existingAtOrder) {
      this.shiftOrdersFrom(request.orderNumber);
    }

    const now = new Date();
    const message: CadenceMessage = {
      id: this.generateId(),
      type: request.type,
      content: request.content,
      orderNumber: request.orderNumber,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.messages.set(message.id, message);
    return message;
  }

  /**
   * Gets a message by ID
   */
  getById(id: string): CadenceMessage | null {
    return this.messages.get(id) || null;
  }

  /**
   * Gets a message by order number
   */
  getByOrder(orderNumber: number): CadenceMessage | null {
    for (const message of this.messages.values()) {
      if (message.orderNumber === orderNumber && message.isActive) {
        return message;
      }
    }
    return null;
  }

  /**
   * Gets all active messages ordered by order_number
   * Requirements: 1.6
   */
  getAllActive(): CadenceMessage[] {
    const active = Array.from(this.messages.values())
      .filter(m => m.isActive)
      .sort((a, b) => a.orderNumber - b.orderNumber);
    return active;
  }

  /**
   * Updates an existing message
   * Requirements: 1.7
   */
  update(id: string, updates: UpdateMessageRequest): CadenceMessage | null {
    const existing = this.messages.get(id);
    if (!existing) return null;

    // Validate content if being updated
    const newType = updates.type || existing.type;
    const newContent = updates.content || existing.content;

    if (updates.type || updates.content) {
      if (newType === 'text') {
        const validation = validateTextMessage(newContent);
        if (!validation.isValid) return null;
      } else {
        const validation = validateMediaUrl(newContent);
        if (!validation.isValid) return null;
      }
    }

    const updated: CadenceMessage = {
      ...existing,
      type: updates.type ?? existing.type,
      content: updates.content ?? existing.content,
      orderNumber: updates.orderNumber ?? existing.orderNumber,
      isActive: updates.isActive ?? existing.isActive,
      updatedAt: new Date(),
    };

    this.messages.set(id, updated);
    return updated;
  }

  /**
   * Deletes a message and reorders remaining messages
   * Requirements: 1.8
   */
  delete(id: string): boolean {
    const existing = this.messages.get(id);
    if (!existing) return false;

    const deletedOrder = existing.orderNumber;
    this.messages.delete(id);

    // Reorder remaining messages
    for (const message of this.messages.values()) {
      if (message.isActive && message.orderNumber > deletedOrder) {
        message.orderNumber--;
        message.updatedAt = new Date();
      }
    }

    return true;
  }

  /**
   * Reorders messages based on array of IDs
   */
  reorder(messageIds: string[]): CadenceMessage[] | null {
    // Verify all IDs exist
    for (const id of messageIds) {
      if (!this.messages.has(id)) return null;
    }

    // Update order numbers
    for (let i = 0; i < messageIds.length; i++) {
      const message = this.messages.get(messageIds[i]);
      if (message) {
        message.orderNumber = i + 1;
        message.updatedAt = new Date();
      }
    }

    return this.getAllActive();
  }

  /**
   * Shifts order numbers from a given position
   */
  private shiftOrdersFrom(fromOrder: number): void {
    for (const message of this.messages.values()) {
      if (message.isActive && message.orderNumber >= fromOrder) {
        message.orderNumber++;
        message.updatedAt = new Date();
      }
    }
  }

  /**
   * Clears all messages (for testing)
   */
  clear(): void {
    this.messages.clear();
    this.idCounter = 0;
  }

  /**
   * Gets the count of active messages
   */
  count(): number {
    return Array.from(this.messages.values()).filter(m => m.isActive).length;
  }
}

/**
 * Validates that messages are in contiguous order starting from 1
 */
export function validateMessageOrdering(messages: CadenceMessage[]): boolean {
  if (messages.length === 0) return true;
  
  const sorted = [...messages].sort((a, b) => a.orderNumber - b.orderNumber);
  
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].orderNumber !== i + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Truncates text for preview (100 chars + ellipsis)
 * Requirements: 7.3
 */
export function truncateForPreview(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
