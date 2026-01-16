/**
 * Property-based and unit tests for subscriber validation
 * Feature: verificacao-assinantes
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateSubscriberStatus, Subscriber } from './subscriber-validation';

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe('Property-Based Tests - Subscriber Validation', () => {
  
  // Property 4: Active Status Validation
  // Validates: Requirements 3.1, 3.5
  it('Property 4: Active Status Validation - subscribers with status=ativo, future due date, and no removal should be active', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 100 }),
          card_id: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
          next_due_date: fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 }).map(ts => new Date(ts).toISOString()),
          status: fc.constant('ativo' as const),
          plan_type: fc.string({ minLength: 1, maxLength: 50 }),
          subscriber_type: fc.constantFrom('individual' as const, 'corporate' as const),
          company_id: fc.option(fc.uuid()),
          company_name: fc.option(fc.string({ minLength: 3, maxLength: 100 })),
          removed_at: fc.constant(null)
        }),
        (subscriber) => {
          const result = validateSubscriberStatus(subscriber);
          
          // For active subscribers with future due dates and no removal, isActive should be true
          expect(result.isActive).toBe(true);
          expect(result.reason).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Inactive Status Validation
  // Validates: Requirements 3.2, 3.4
  it('Property 5: Inactive Status Validation - subscribers with status=inativo OR expired due date should be inactive', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Case 1: Status inactive
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 100 }),
            card_id: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
            next_due_date: fc.integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }).map(ts => new Date(ts).toISOString()),
            status: fc.constant('inativo' as const),
            plan_type: fc.string({ minLength: 1, maxLength: 50 }),
            subscriber_type: fc.constantFrom('individual' as const, 'corporate' as const),
            company_id: fc.option(fc.uuid()),
            company_name: fc.option(fc.string({ minLength: 3, maxLength: 100 })),
            removed_at: fc.constant(null)
          }),
          // Case 2: Expired due date (at least 1 day in the past)
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 100 }),
            card_id: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
            next_due_date: fc.integer({ 
              min: Date.now() - 365 * 24 * 60 * 60 * 1000, 
              max: Date.now() - 86400000 // At least 1 day in the past
            }).map(ts => new Date(ts).toISOString()),
            status: fc.constant('ativo' as const),
            plan_type: fc.string({ minLength: 1, maxLength: 50 }),
            subscriber_type: fc.constantFrom('individual' as const, 'corporate' as const),
            company_id: fc.option(fc.uuid()),
            company_name: fc.option(fc.string({ minLength: 3, maxLength: 100 })),
            removed_at: fc.constant(null)
          })
        ),
        (subscriber) => {
          const result = validateSubscriberStatus(subscriber);
          
          // Subscribers with inactive status or expired due date should be inactive
          expect(result.isActive).toBe(false);
          expect(result.reason).toBeDefined();
          expect(['expired', 'inactive']).toContain(result.reason);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6: Corporate Removed Status Validation
  // Validates: Requirements 3.3
  it('Property 6: Corporate Removed Status Validation - corporate subscribers with removed_at filled should be inactive', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 100 }),
          card_id: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
          next_due_date: fc.integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }).map(ts => new Date(ts).toISOString()),
          status: fc.constantFrom('ativo' as const, 'inativo' as const),
          plan_type: fc.string({ minLength: 1, maxLength: 50 }),
          subscriber_type: fc.constant('corporate' as const),
          company_id: fc.uuid(),
          company_name: fc.string({ minLength: 3, maxLength: 100 }),
          removed_at: fc.integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() }).map(ts => new Date(ts).toISOString())
        }),
        (subscriber) => {
          const result = validateSubscriberStatus(subscriber);
          
          // Corporate subscribers with removed_at filled should always be inactive with reason 'removed'
          expect(result.isActive).toBe(false);
          expect(result.reason).toBe('removed');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// UNIT TESTS - EDGE CASES
// ============================================================================

describe('Unit Tests - Edge Cases', () => {
  
  // Test: Subscriber with due date exactly today
  // Validates: Requirements 3.1, 3.2
  it('should consider subscriber with due date exactly today as ACTIVE', () => {
    const today = new Date();
    const subscriber: Subscriber = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      card_id: 'ABC123',
      next_due_date: today.toISOString(),
      status: 'ativo',
      plan_type: 'monthly',
      subscriber_type: 'individual',
      removed_at: null
    };
    
    const result = validateSubscriberStatus(subscriber);
    
    expect(result.isActive).toBe(true);
    expect(result.reason).toBeUndefined();
  });
  
  // Test: Corporate subscriber with removed_at null
  // Validates: Requirements 3.3, 3.5
  it('should consider corporate subscriber with removed_at=null as ACTIVE (if other conditions met)', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const subscriber: Subscriber = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Corporate User',
      card_id: 'CORP123',
      next_due_date: futureDate.toISOString(),
      status: 'ativo',
      plan_type: 'corporate',
      subscriber_type: 'corporate',
      company_id: 'company-123',
      company_name: 'Test Company',
      removed_at: null
    };
    
    const result = validateSubscriberStatus(subscriber);
    
    expect(result.isActive).toBe(true);
    expect(result.reason).toBeUndefined();
  });
  
  // Test: Corporate subscriber with removed_at filled
  // Validates: Requirements 3.3
  it('should consider corporate subscriber with removed_at filled as INACTIVE', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const removedDate = new Date();
    
    const subscriber: Subscriber = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Removed Corporate User',
      card_id: 'CORP456',
      next_due_date: futureDate.toISOString(),
      status: 'ativo',
      plan_type: 'corporate',
      subscriber_type: 'corporate',
      company_id: 'company-123',
      company_name: 'Test Company',
      removed_at: removedDate.toISOString()
    };
    
    const result = validateSubscriberStatus(subscriber);
    
    expect(result.isActive).toBe(false);
    expect(result.reason).toBe('removed');
  });
  
  // Test: Inactive status with future due date
  // Validates: Requirements 3.2, 3.4
  it('should consider subscriber with status=inativo as INACTIVE even with future due date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const subscriber: Subscriber = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Inactive User',
      card_id: 'INACT123',
      next_due_date: futureDate.toISOString(),
      status: 'inativo',
      plan_type: 'monthly',
      subscriber_type: 'individual',
      removed_at: null
    };
    
    const result = validateSubscriberStatus(subscriber);
    
    expect(result.isActive).toBe(false);
    expect(result.reason).toBe('inactive');
  });
  
  // Test: Active status with past due date
  // Validates: Requirements 3.1, 3.2
  it('should consider subscriber with past due date as INACTIVE even with status=ativo', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const subscriber: Subscriber = {
      id: '123e4567-e89b-12d3-a456-426614174004',
      name: 'Expired User',
      card_id: 'EXP123',
      next_due_date: pastDate.toISOString(),
      status: 'ativo',
      plan_type: 'monthly',
      subscriber_type: 'individual',
      removed_at: null
    };
    
    const result = validateSubscriberStatus(subscriber);
    
    expect(result.isActive).toBe(false);
    expect(result.reason).toBe('expired');
  });
  
  // Test: Corporate subscriber with multiple inactive conditions
  // Validates: Requirements 3.3, 3.4
  it('should prioritize removed_at check for corporate subscribers (removed takes precedence)', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const removedDate = new Date();
    
    const subscriber: Subscriber = {
      id: '123e4567-e89b-12d3-a456-426614174005',
      name: 'Multi-Inactive Corporate User',
      card_id: 'MULTI123',
      next_due_date: pastDate.toISOString(),
      status: 'inativo',
      plan_type: 'corporate',
      subscriber_type: 'corporate',
      company_id: 'company-123',
      company_name: 'Test Company',
      removed_at: removedDate.toISOString()
    };
    
    const result = validateSubscriberStatus(subscriber);
    
    expect(result.isActive).toBe(false);
    expect(result.reason).toBe('removed'); // Should be 'removed' not 'inactive' or 'expired'
  });
});
