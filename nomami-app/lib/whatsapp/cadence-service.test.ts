/**
 * Property-Based Tests for WhatsApp Cadence Service
 * 
 * Feature: whatsapp-message-cadence
 * Validates: Requirements 4.1, 4.2, 5.2
 * 
 * Note: These tests use a mock implementation to test the business logic
 * without requiring actual API calls or database connections.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MessageStatus, CadenceMessage, MessageLog } from './types';
import { replaceMessageVariables, SubscriberInfo } from './cadence-service';

/**
 * Tests for variable substitution in messages
 */
describe('WhatsApp Cadence Service - Variable Substitution', () => {
  const subscriber: SubscriberInfo = {
    id: '123',
    name: 'João Silva',
    phone: '5561999999999',
    subscriptionDate: '2024-01-15',
  };

  it('should replace {nome} with first name', () => {
    const content = 'Olá {nome}, bem-vindo!';
    const result = replaceMessageVariables(content, subscriber);
    expect(result).toBe('Olá João, bem-vindo!');
  });

  it('should replace {nome_completo} with full name', () => {
    const content = 'Olá {nome_completo}, bem-vindo!';
    const result = replaceMessageVariables(content, subscriber);
    expect(result).toBe('Olá João Silva, bem-vindo!');
  });

  it('should replace {telefone} with phone number', () => {
    const content = 'Seu telefone é {telefone}';
    const result = replaceMessageVariables(content, subscriber);
    expect(result).toBe('Seu telefone é 5561999999999');
  });

  it('should replace {data_assinatura} with subscription date', () => {
    const content = 'Você assinou em {data_assinatura}';
    const result = replaceMessageVariables(content, subscriber);
    expect(result).toBe('Você assinou em 2024-01-15');
  });

  it('should replace multiple variables in the same message', () => {
    const content = 'Olá {nome}! Seu nome completo é {nome_completo} e você assinou em {data_assinatura}.';
    const result = replaceMessageVariables(content, subscriber);
    expect(result).toBe('Olá João! Seu nome completo é João Silva e você assinou em 2024-01-15.');
  });

  it('should be case-insensitive for variable names', () => {
    const content = 'Olá {NOME}, {Nome}, {nome}!';
    const result = replaceMessageVariables(content, subscriber);
    expect(result).toBe('Olá João, João, João!');
  });

  it('should handle empty name gracefully', () => {
    const subscriberNoName: SubscriberInfo = {
      ...subscriber,
      name: '',
    };
    const content = 'Olá {nome}!';
    const result = replaceMessageVariables(content, subscriberNoName);
    expect(result).toBe('Olá Cliente!');
  });

  it('should extract first name correctly from multi-word names', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes(' ')), { minLength: 1, maxLength: 5 }),
        (nameParts) => {
          const fullName = nameParts.join(' ');
          const sub: SubscriberInfo = {
            id: '123',
            name: fullName,
            phone: '5561999999999',
            subscriptionDate: '2024-01-15',
          };
          const result = replaceMessageVariables('Olá {nome}!', sub);
          expect(result).toBe(`Olá ${nameParts[0]}!`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Mock implementation of cadence execution for testing
 * This simulates the behavior of the real service without external dependencies
 */
class MockCadenceExecutor {
  private logs: MessageLog[] = [];
  private adminNotifications: Array<{ subscriber: string; error: string }> = [];
  private adminPhone: string | null = null;
  private logIdCounter = 0;

  setAdminPhone(phone: string | null): void {
    this.adminPhone = phone;
  }

  /**
   * Simulates creating a log entry
   * Requirements: 4.1, 4.2
   */
  createLog(params: {
    subscriberId: string;
    subscriberName: string;
    subscriberPhone: string;
    messageId: string;
    messageType: string;
    messageContent: string;
    status: MessageStatus;
    errorMessage?: string;
  }): MessageLog {
    this.logIdCounter++;
    const log: MessageLog = {
      id: `log-${this.logIdCounter}`,
      subscriberId: params.subscriberId,
      subscriberName: params.subscriberName,
      subscriberPhone: params.subscriberPhone,
      messageId: params.messageId,
      messageType: params.messageType,
      messageContent: params.messageContent,
      status: params.status,
      errorMessage: params.errorMessage || null,
      apiResponse: null,
      createdAt: new Date(),
    };
    this.logs.push(log);
    return log;
  }

  /**
   * Simulates sending admin notification
   * Requirements: 5.2
   */
  notifyAdmin(subscriberName: string, errorDetails: string): boolean {
    if (!this.adminPhone) {
      return false; // No admin phone configured
    }
    this.adminNotifications.push({ subscriber: subscriberName, error: errorDetails });
    return true;
  }

  /**
   * Simulates executing cadence for a subscriber
   */
  executeCadence(
    subscriber: { id: string; name: string; phone: string },
    messages: CadenceMessage[],
    sendResults: boolean[] // true = success, false = failure
  ): { logs: MessageLog[]; adminNotified: boolean } {
    const executionLogs: MessageLog[] = [];
    let adminNotified = false;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const success = sendResults[i] ?? true;
      const status: MessageStatus = success ? 'success' : 'failed';
      const errorMessage = success ? undefined : `Failed to send message ${message.orderNumber}`;

      const log = this.createLog({
        subscriberId: subscriber.id,
        subscriberName: subscriber.name,
        subscriberPhone: subscriber.phone,
        messageId: message.id,
        messageType: message.type,
        messageContent: message.content,
        status,
        errorMessage,
      });
      executionLogs.push(log);

      // Notify admin on failure
      if (!success && this.adminPhone) {
        this.notifyAdmin(subscriber.name, errorMessage!);
        adminNotified = true;
      }
    }

    return { logs: executionLogs, adminNotified };
  }

  getLogs(): MessageLog[] {
    return this.logs;
  }

  getAdminNotifications(): Array<{ subscriber: string; error: string }> {
    return this.adminNotifications;
  }

  clear(): void {
    this.logs = [];
    this.adminNotifications = [];
    this.logIdCounter = 0;
  }
}

describe('WhatsApp Cadence Service - Property Tests', () => {
  let executor: MockCadenceExecutor;

  beforeEach(() => {
    executor = new MockCadenceExecutor();
  });

  // Arbitraries for generating test data
  const subscriberArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    phone: fc.tuple(
      fc.integer({ min: 11, max: 30 }),
      fc.integer({ min: 90000000, max: 99999999 })
    ).map(([ddd, number]) => `55${ddd}9${number}@s.whatsapp.net`),
  });

  const messageArb = fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('text', 'image', 'video') as fc.Arbitrary<'text' | 'image' | 'video'>,
    content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    orderNumber: fc.integer({ min: 1, max: 100 }),
    isActive: fc.constant(true),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

  const messagesArb = fc.array(messageArb, { minLength: 1, maxLength: 10 })
    .map(messages => messages.map((m, i) => ({ ...m, orderNumber: i + 1 })));

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
    it('should create a log for every message sent', () => {
      fc.assert(
        fc.property(
          subscriberArb,
          messagesArb,
          (subscriber, messages) => {
            executor.clear();
            
            // All messages succeed
            const sendResults = messages.map(() => true);
            const { logs } = executor.executeCadence(subscriber, messages, sendResults);
            
            // Should have one log per message
            expect(logs.length).toBe(messages.length);
            
            // Each log should have correct fields
            for (let i = 0; i < logs.length; i++) {
              const log = logs[i];
              const message = messages[i];
              
              expect(log.subscriberPhone).toBe(subscriber.phone);
              expect(log.subscriberName).toBe(subscriber.name);
              expect(log.messageType).toBe(message.type);
              expect(log.messageContent).toBe(message.content);
              expect(log.status).toBe('success');
              expect(log.createdAt).toBeInstanceOf(Date);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include error message for failed sends', () => {
      fc.assert(
        fc.property(
          subscriberArb,
          messagesArb,
          (subscriber, messages) => {
            executor.clear();
            
            // All messages fail
            const sendResults = messages.map(() => false);
            const { logs } = executor.executeCadence(subscriber, messages, sendResults);
            
            // Each log should have error message
            for (const log of logs) {
              expect(log.status).toBe('failed');
              expect(log.errorMessage).not.toBeNull();
              expect(log.errorMessage!.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create logs with mixed success/failure statuses', () => {
      fc.assert(
        fc.property(
          subscriberArb,
          messagesArb,
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (subscriber, messages, results) => {
            executor.clear();
            
            // Ensure results array matches messages length
            const sendResults = messages.map((_, i) => results[i % results.length]);
            const { logs } = executor.executeCadence(subscriber, messages, sendResults);
            
            // Verify each log matches expected status
            for (let i = 0; i < logs.length; i++) {
              const expectedSuccess = sendResults[i];
              expect(logs[i].status).toBe(expectedSuccess ? 'success' : 'failed');
              
              if (!expectedSuccess) {
                expect(logs[i].errorMessage).not.toBeNull();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 11: Admin Notification on Failure
   * 
   * For any failed message send attempt where adminPhone is configured,
   * a notification should be sent to the admin containing the subscriber's name and phone.
   * 
   * Validates: Requirements 5.2
   */
  describe('Property 11: Admin Notification on Failure', () => {
    it('should notify admin when message fails and admin phone is configured', () => {
      fc.assert(
        fc.property(
          subscriberArb,
          messagesArb,
          (subscriber, messages) => {
            executor.clear();
            executor.setAdminPhone('5561999999999@s.whatsapp.net');
            
            // All messages fail
            const sendResults = messages.map(() => false);
            const { adminNotified } = executor.executeCadence(subscriber, messages, sendResults);
            
            // Admin should be notified
            expect(adminNotified).toBe(true);
            
            // Should have notifications
            const notifications = executor.getAdminNotifications();
            expect(notifications.length).toBeGreaterThan(0);
            
            // Each notification should contain subscriber name
            for (const notification of notifications) {
              expect(notification.subscriber).toBe(subscriber.name);
              expect(notification.error.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not notify admin when admin phone is not configured', () => {
      fc.assert(
        fc.property(
          subscriberArb,
          messagesArb,
          (subscriber, messages) => {
            executor.clear();
            executor.setAdminPhone(null); // No admin phone
            
            // All messages fail
            const sendResults = messages.map(() => false);
            const { adminNotified } = executor.executeCadence(subscriber, messages, sendResults);
            
            // Admin should NOT be notified
            expect(adminNotified).toBe(false);
            
            // Should have no notifications
            const notifications = executor.getAdminNotifications();
            expect(notifications.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not notify admin when all messages succeed', () => {
      fc.assert(
        fc.property(
          subscriberArb,
          messagesArb,
          (subscriber, messages) => {
            executor.clear();
            executor.setAdminPhone('5561999999999@s.whatsapp.net');
            
            // All messages succeed
            const sendResults = messages.map(() => true);
            const { adminNotified } = executor.executeCadence(subscriber, messages, sendResults);
            
            // Admin should NOT be notified
            expect(adminNotified).toBe(false);
            
            // Should have no notifications
            const notifications = executor.getAdminNotifications();
            expect(notifications.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
