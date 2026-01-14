/**
 * Property-Based Tests for WhatsApp Message Service
 * 
 * Feature: whatsapp-message-cadence
 * Validates: Requirements 1.5, 1.6, 1.7, 1.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  MessageStore,
  validateMessageOrdering,
  truncateForPreview,
} from './message-service';
import { CreateMessageRequest, MessageType } from './types';

describe('WhatsApp Message Service - Property Tests', () => {
  let store: MessageStore;

  beforeEach(() => {
    store = new MessageStore();
  });

  // Arbitraries for generating test data
  const _messageTypeArb = fc.constantFrom<MessageType>('text', 'image', 'video');
  
  const textContentArb = fc.string({ minLength: 1, maxLength: 500 })
    .filter(s => s.trim().length > 0);
  
  const urlContentArb = fc.webUrl({ validSchemes: ['https'] });
  
  const orderNumberArb = fc.integer({ min: 1, max: 100 });

  // Generate valid create request based on type
  const createRequestArb = fc.oneof(
    // Text message
    fc.record({
      type: fc.constant<MessageType>('text'),
      content: textContentArb,
      orderNumber: orderNumberArb,
    }),
    // Image message
    fc.record({
      type: fc.constant<MessageType>('image'),
      content: urlContentArb,
      orderNumber: orderNumberArb,
    }),
    // Video message
    fc.record({
      type: fc.constant<MessageType>('video'),
      content: urlContentArb,
      orderNumber: orderNumberArb,
    })
  ) as fc.Arbitrary<CreateMessageRequest>;

  /**
   * Feature: whatsapp-message-cadence, Property 1: Message Persistence Round-Trip
   * 
   * For any valid CadenceMessage, creating it and then retrieving it by ID
   * should return an equivalent message with matching type, content, and orderNumber.
   * 
   * Validates: Requirements 1.5
   */
  describe('Property 1: Message Persistence Round-Trip', () => {
    it('should persist and retrieve messages with matching properties', () => {
      fc.assert(
        fc.property(createRequestArb, (request) => {
          store.clear();
          
          const created = store.create(request);
          expect(created).not.toBeNull();
          
          const retrieved = store.getById(created!.id);
          expect(retrieved).not.toBeNull();
          
          // Verify round-trip preserves data
          expect(retrieved!.type).toBe(request.type);
          expect(retrieved!.content).toBe(request.content);
          expect(retrieved!.orderNumber).toBe(request.orderNumber);
          expect(retrieved!.isActive).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 2: Message Update Persistence
   * 
   * For any existing CadenceMessage and valid update payload, updating the message
   * and then retrieving it should return the updated values.
   * 
   * Validates: Requirements 1.7
   */
  describe('Property 2: Message Update Persistence', () => {
    it('should persist updates and retrieve updated values', () => {
      fc.assert(
        fc.property(
          createRequestArb,
          textContentArb,
          (request, newContent) => {
            store.clear();
            
            // Create initial message
            const created = store.create(request);
            expect(created).not.toBeNull();
            
            // Update with new content (only for text type to ensure valid content)
            const updateRequest = {
              type: 'text' as MessageType,
              content: newContent,
            };
            
            const updated = store.update(created!.id, updateRequest);
            expect(updated).not.toBeNull();
            
            // Retrieve and verify
            const retrieved = store.getById(created!.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved!.type).toBe('text');
            expect(retrieved!.content).toBe(newContent);
            expect(retrieved!.updatedAt.getTime()).toBeGreaterThanOrEqual(created!.createdAt.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 3: Message Deletion with Reordering
   * 
   * For any list of N active messages with orders 1 to N, deleting a message at position K
   * should result in N-1 messages with contiguous orders from 1 to N-1.
   * 
   * Validates: Requirements 1.8
   */
  describe('Property 3: Message Deletion with Reordering', () => {
    it('should maintain contiguous ordering after deletion', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Number of messages
          fc.integer({ min: 0, max: 9 }),   // Index to delete
          (numMessages, deleteIndex) => {
            store.clear();
            
            // Create N messages with orders 1 to N
            const createdIds: string[] = [];
            for (let i = 1; i <= numMessages; i++) {
              const msg = store.create({
                type: 'text',
                content: `Message ${i}`,
                orderNumber: i,
              });
              if (msg) createdIds.push(msg.id);
            }
            
            expect(createdIds.length).toBe(numMessages);
            
            // Delete message at index (clamped to valid range)
            const actualDeleteIndex = deleteIndex % createdIds.length;
            const idToDelete = createdIds[actualDeleteIndex];
            
            const deleted = store.delete(idToDelete);
            expect(deleted).toBe(true);
            
            // Verify remaining messages
            const remaining = store.getAllActive();
            expect(remaining.length).toBe(numMessages - 1);
            
            // Verify contiguous ordering from 1 to N-1
            expect(validateMessageOrdering(remaining)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 4: Message Ordering Invariant
   * 
   * For any set of active cadence messages retrieved from the database,
   * they should always be sorted in ascending order by orderNumber.
   * 
   * Validates: Requirements 1.6, 3.1
   */
  describe('Property 4: Message Ordering Invariant', () => {
    it('should always return messages sorted by orderNumber', () => {
      fc.assert(
        fc.property(
          fc.array(orderNumberArb, { minLength: 1, maxLength: 20 }),
          (orderNumbers) => {
            store.clear();
            
            // Create messages in random order
            for (const order of orderNumbers) {
              store.create({
                type: 'text',
                content: `Message at order ${order}`,
                orderNumber: order,
              });
            }
            
            // Get all active messages
            const messages = store.getAllActive();
            
            // Verify they are sorted by orderNumber
            for (let i = 1; i < messages.length; i++) {
              expect(messages[i].orderNumber).toBeGreaterThan(messages[i - 1].orderNumber);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 13: Drag Reorder Consistency
   * 
   * For any reorder operation moving message from position A to position B,
   * all messages between A and B (inclusive) should have their orderNumber updated,
   * and the final sequence should be contiguous from 1 to N.
   * 
   * Validates: Requirements 7.2
   */
  describe('Property 13: Drag Reorder Consistency', () => {
    it('should maintain contiguous ordering after reorder', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // Number of messages
          fc.integer({ min: 0, max: 9 }),   // From index
          fc.integer({ min: 0, max: 9 }),   // To index
          (numMessages, fromIdx, toIdx) => {
            store.clear();
            
            // Create N messages with orders 1 to N
            const createdIds: string[] = [];
            for (let i = 1; i <= numMessages; i++) {
              const msg = store.create({
                type: 'text',
                content: `Message ${i}`,
                orderNumber: i,
              });
              if (msg) createdIds.push(msg.id);
            }
            
            // Clamp indices to valid range
            const actualFromIdx = fromIdx % createdIds.length;
            const actualToIdx = toIdx % createdIds.length;
            
            // Perform reorder (simulate drag from A to B)
            const reorderedIds = [...createdIds];
            const [movedId] = reorderedIds.splice(actualFromIdx, 1);
            reorderedIds.splice(actualToIdx, 0, movedId);
            
            // Apply reorder
            store.reorder(reorderedIds);
            
            // Verify results
            const messages = store.getAllActive();
            expect(messages.length).toBe(numMessages);
            
            // Verify contiguous ordering from 1 to N
            expect(validateMessageOrdering(messages)).toBe(true);
            
            // Verify the order matches the reordered IDs
            for (let i = 0; i < messages.length; i++) {
              expect(messages[i].id).toBe(reorderedIds[i]);
              expect(messages[i].orderNumber).toBe(i + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 12: Text Preview Truncation
   * 
   * For any text message content with length greater than 100 characters,
   * the preview should be exactly 100 characters followed by "...".
   * 
   * Validates: Requirements 7.3
   */
  describe('Property 12: Text Preview Truncation', () => {
    it('should truncate long text to 100 chars + ellipsis', () => {
      const longTextArb = fc.string({ minLength: 101, maxLength: 1000 });

      fc.assert(
        fc.property(longTextArb, (longText) => {
          const preview = truncateForPreview(longText);
          
          // Should be exactly 103 characters (100 + "...")
          expect(preview.length).toBe(103);
          
          // Should end with "..."
          expect(preview.endsWith('...')).toBe(true);
          
          // First 100 chars should match original
          expect(preview.slice(0, 100)).toBe(longText.slice(0, 100));
        }),
        { numRuns: 100 }
      );
    });

    it('should not truncate short text', () => {
      const shortTextArb = fc.string({ minLength: 0, maxLength: 100 });

      fc.assert(
        fc.property(shortTextArb, (shortText) => {
          const preview = truncateForPreview(shortText);
          
          // Should be unchanged
          expect(preview).toBe(shortText);
          
          // Should not have ellipsis
          if (shortText.length < 100) {
            expect(preview.endsWith('...')).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
