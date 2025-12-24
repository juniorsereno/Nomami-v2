/**
 * Property-Based Tests for WhatsApp Log Service
 * 
 * Feature: whatsapp-message-cadence
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  LogStore,
  validateLogOrdering,
  validateLogFields,
} from './log-service';
import { MessageStatus } from './types';

describe('WhatsApp Log Service - Property Tests', () => {
  let store: LogStore;

  beforeEach(() => {
    store = new LogStore();
  });

  // Arbitraries for generating test data
  const statusArb = fc.constantFrom<MessageStatus>('success', 'failed', 'pending');
  
  const phoneArb = fc.tuple(
    fc.integer({ min: 11, max: 30 }),
    fc.integer({ min: 90000000, max: 99999999 })
  ).map(([ddd, number]) => `55${ddd}9${number}@s.whatsapp.net`);

  const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
  
  const errorMessageArb = fc.string({ minLength: 1, maxLength: 500 });

  /**
   * Feature: whatsapp-message-cadence, Property 8: Log Creation with Correct Fields
   * 
   * For any message send attempt (success or failure), a log entry should be created
   * containing: subscriberPhone, messageType, status, and timestamp.
   * Failed attempts should additionally contain errorMessage.
   * 
   * Validates: Requirements 4.1, 4.2
   */
  describe('Property 8: Log Creation with Correct Fields', () => {
    it('should create logs with all required fields for success status', () => {
      fc.assert(
        fc.property(
          phoneArb,
          nameArb,
          fc.constantFrom<MessageStatus>('success'),
          (phone, name, status) => {
            store.clear();
            
            const log = store.create({
              subscriberPhone: phone,
              subscriberName: name,
              messageType: 'text',
              messageContent: 'Test message',
              status,
            });
            
            // Verify required fields
            expect(log.id).toBeTruthy();
            expect(log.subscriberPhone).toBe(phone);
            expect(log.messageType).toBe('text');
            expect(log.status).toBe(status);
            expect(log.createdAt).toBeInstanceOf(Date);
            
            // Validate using helper function
            expect(validateLogFields(log)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create logs with error message for failed status', () => {
      fc.assert(
        fc.property(
          phoneArb,
          nameArb,
          errorMessageArb,
          (phone, name, errorMessage) => {
            store.clear();
            
            const log = store.create({
              subscriberPhone: phone,
              subscriberName: name,
              messageType: 'text',
              messageContent: 'Test message',
              status: 'failed',
              errorMessage,
            });
            
            // Verify required fields
            expect(log.id).toBeTruthy();
            expect(log.subscriberPhone).toBe(phone);
            expect(log.status).toBe('failed');
            expect(log.errorMessage).toBe(errorMessage);
            expect(log.createdAt).toBeInstanceOf(Date);
            
            // Validate using helper function
            expect(validateLogFields(log)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist and retrieve logs correctly', () => {
      fc.assert(
        fc.property(
          phoneArb,
          statusArb,
          (phone, status) => {
            store.clear();
            
            const created = store.create({
              subscriberPhone: phone,
              status,
            });
            
            const retrieved = store.getById(created.id);
            
            expect(retrieved).not.toBeNull();
            expect(retrieved!.id).toBe(created.id);
            expect(retrieved!.subscriberPhone).toBe(phone);
            expect(retrieved!.status).toBe(status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 9: Log Ordering
   * 
   * For any set of logs retrieved from the database, they should always be
   * sorted in descending order by createdAt (most recent first).
   * 
   * Validates: Requirements 4.3
   */
  describe('Property 9: Log Ordering', () => {
    it('should always return logs sorted by createdAt descending', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }), // Number of logs to create
          (numLogs) => {
            store.clear();
            
            // Create logs with small delays to ensure different timestamps
            const createdLogs: string[] = [];
            for (let i = 0; i < numLogs; i++) {
              const log = store.create({
                subscriberPhone: `5511999999${i.toString().padStart(3, '0')}@s.whatsapp.net`,
                status: i % 2 === 0 ? 'success' : 'failed',
                errorMessage: i % 2 === 1 ? `Error ${i}` : undefined,
              });
              createdLogs.push(log.id);
            }
            
            // Get all logs
            const { logs } = store.getAll();
            
            // Verify they are sorted by createdAt descending
            expect(validateLogOrdering(logs)).toBe(true);
            
            // Additional check: first log should be the most recent
            for (let i = 1; i < logs.length; i++) {
              expect(logs[i].createdAt.getTime()).toBeLessThanOrEqual(logs[i - 1].createdAt.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain ordering after filtering by status', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 30 }),
          statusArb,
          (numLogs, filterStatus) => {
            store.clear();
            
            // Create logs with mixed statuses
            for (let i = 0; i < numLogs; i++) {
              const statuses: MessageStatus[] = ['success', 'failed', 'pending'];
              store.create({
                subscriberPhone: `5511999999${i.toString().padStart(3, '0')}@s.whatsapp.net`,
                status: statuses[i % 3],
              });
            }
            
            // Get filtered logs
            const { logs } = store.getAll({ status: filterStatus });
            
            // Verify ordering is maintained
            expect(validateLogOrdering(logs)).toBe(true);
            
            // Verify all logs have the correct status
            for (const log of logs) {
              expect(log.status).toBe(filterStatus);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain ordering with pagination', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 5, max: 10 }),
          (numLogs, page, limit) => {
            store.clear();
            
            // Create logs
            for (let i = 0; i < numLogs; i++) {
              store.create({
                subscriberPhone: `5511999999${i.toString().padStart(3, '0')}@s.whatsapp.net`,
                status: 'success',
              });
            }
            
            // Get paginated logs
            const { logs } = store.getAll({ page, limit });
            
            // Verify ordering is maintained within the page
            expect(validateLogOrdering(logs)).toBe(true);
            
            // Verify page size
            const expectedSize = Math.min(limit, Math.max(0, numLogs - (page - 1) * limit));
            expect(logs.length).toBeLessThanOrEqual(expectedSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
