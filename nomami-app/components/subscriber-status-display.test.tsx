/**
 * Property-based and unit tests for SubscriberStatusDisplay component
 * Feature: verificacao-assinantes
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { SubscriberStatusDisplay } from './subscriber-status-display';

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generates a valid subscriber name
 */
const validNameArb = fc.string({ minLength: 3, maxLength: 100 });

/**
 * Generates a valid card ID
 */
const validCardIdArb = fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase());

/**
 * Generates a valid company name
 */
const validCompanyNameArb = fc.string({ minLength: 3, maxLength: 100 });

/**
 * Generates a valid date string
 */
const validDateArb = fc.integer({
  min: Date.now() - 365 * 24 * 60 * 60 * 1000,
  max: Date.now() + 365 * 24 * 60 * 60 * 1000
}).map(ts => new Date(ts).toISOString());

/**
 * Generates an active individual subscriber
 */
const activeIndividualSubscriberArb = fc.record({
  name: validNameArb,
  card_id: validCardIdArb,
  status: fc.constant('ativo' as const),
  next_due_date: validDateArb,
  subscriber_type: fc.constant('individual' as const),
  removed_at: fc.constant(null)
});

/**
 * Generates an active corporate subscriber
 */
const activeCorporateSubscriberArb = fc.record({
  name: validNameArb,
  card_id: validCardIdArb,
  status: fc.constant('ativo' as const),
  next_due_date: validDateArb,
  subscriber_type: fc.constant('corporate' as const),
  company_name: validCompanyNameArb,
  removed_at: fc.constant(null)
});

/**
 * Generates an inactive subscriber (individual or corporate)
 */
const inactiveSubscriberArb = fc.oneof(
  fc.record({
    name: validNameArb,
    card_id: validCardIdArb,
    status: fc.constant('inativo' as const),
    next_due_date: validDateArb,
    subscriber_type: fc.constantFrom('individual' as const, 'corporate' as const),
    company_name: fc.option(validCompanyNameArb),
    removed_at: fc.constant(null)
  }),
  fc.record({
    name: validNameArb,
    card_id: validCardIdArb,
    status: fc.constant('ativo' as const),
    next_due_date: validDateArb,
    subscriber_type: fc.constant('corporate' as const),
    company_name: validCompanyNameArb,
    removed_at: fc.date().map(d => d.toISOString())
  })
);

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe('Property-Based Tests - SubscriberStatusDisplay', () => {
  
  // Property 11: Status Display for Active Subscribers
  // Validates: Requirements 2.7, 2.9, 2.10, 2.11, 2.12, 6.2, 6.4, 6.5, 6.6, 6.7
  it('Property 11: Status Display for Active Subscribers - should display all required information for active subscribers', () => {
    fc.assert(
      fc.property(
        fc.oneof(activeIndividualSubscriberArb, activeCorporateSubscriberArb),
        (subscriber) => {
          const { container } = render(
            <SubscriberStatusDisplay subscriber={subscriber} isActive={true} />
          );
          
          const text = container.textContent || '';
          
          // Should display "✅ ASSINATURA ATIVA"
          expect(text).toContain('✅ ASSINATURA ATIVA');
          
          // Should display subscriber name
          expect(text).toContain(subscriber.name);
          
          // Should display card_id
          expect(text).toContain(subscriber.card_id);
          
          // Should display formatted date in pt-BR
          const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          expect(text).toContain(formattedDate);
          
          // Should display correct type
          const expectedType = subscriber.subscriber_type === 'individual' ? 'Individual' : 'Corporativo';
          expect(text).toContain(expectedType);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 12: Status Display for Inactive Subscribers
  // Validates: Requirements 2.8, 2.9, 2.10, 2.11, 2.12, 6.3, 6.4, 6.5, 6.6, 6.7
  it('Property 12: Status Display for Inactive Subscribers - should display all required information for inactive subscribers', () => {
    fc.assert(
      fc.property(
        inactiveSubscriberArb,
        (subscriber) => {
          const { container } = render(
            <SubscriberStatusDisplay subscriber={subscriber} isActive={false} />
          );
          
          const text = container.textContent || '';
          
          // Should display "❌ ASSINATURA VENCIDA"
          expect(text).toContain('❌ ASSINATURA VENCIDA');
          
          // Should display subscriber name
          expect(text).toContain(subscriber.name);
          
          // Should display card_id
          expect(text).toContain(subscriber.card_id);
          
          // Should display formatted date in pt-BR
          const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          expect(text).toContain(formattedDate);
          
          // Should display correct type
          const expectedType = subscriber.subscriber_type === 'individual' ? 'Individual' : 'Corporativo';
          expect(text).toContain(expectedType);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 13: Corporate Company Name Display
  // Validates: Requirements 2.13, 6.8
  it('Property 13: Corporate Company Name Display - should display company name for corporate subscribers', () => {
    fc.assert(
      fc.property(
        activeCorporateSubscriberArb,
        (subscriber) => {
          const { container } = render(
            <SubscriberStatusDisplay subscriber={subscriber} isActive={true} />
          );
          
          const text = container.textContent || '';
          
          // Should display company name for corporate subscribers
          if (subscriber.company_name) {
            expect(text).toContain(subscriber.company_name);
            expect(text).toContain('Empresa:');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 14: Date Formatting Consistency
  // Validates: Requirements 2.11, 6.6
  it('Property 14: Date Formatting Consistency - should format all dates in pt-BR (DD/MM/YYYY)', () => {
    fc.assert(
      fc.property(
        fc.oneof(activeIndividualSubscriberArb, activeCorporateSubscriberArb, inactiveSubscriberArb),
        (subscriber) => {
          const { container } = render(
            <SubscriberStatusDisplay 
              subscriber={subscriber} 
              isActive={subscriber.status === 'ativo' && !subscriber.removed_at} 
            />
          );
          
          const text = container.textContent || '';
          
          // Format date in pt-BR
          const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          // Should contain the formatted date
          expect(text).toContain(formattedDate);
          
          // Verify pt-BR format (DD/MM/YYYY)
          const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
          expect(text).toMatch(dateRegex);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// UNIT TESTS - SPECIFIC CASES
// ============================================================================

describe('Unit Tests - SubscriberStatusDisplay', () => {
  
  // Test: Rendering with active subscriber
  // Validates: Requirements 2.7, 2.9, 2.10, 2.11, 2.12
  it('should render correctly with an active subscriber', () => {
    const subscriber = {
      name: 'João da Silva',
      card_id: 'ABC123',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      removed_at: null
    };
    
    const { container } = render(
      <SubscriberStatusDisplay subscriber={subscriber} isActive={true} />
    );
    
    const text = container.textContent || '';
    
    expect(text).toContain('✅ ASSINATURA ATIVA');
    expect(text).toContain('João da Silva');
    expect(text).toContain('ABC123');
    expect(text).toContain('Individual');
    
    // Check for formatted date (accounting for timezone)
    const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    expect(text).toContain(formattedDate);
  });

  // Test: Rendering with inactive subscriber
  // Validates: Requirements 2.8, 2.9, 2.10, 2.11, 2.12
  it('should render correctly with an inactive subscriber', () => {
    const subscriber = {
      name: 'Maria Santos',
      card_id: 'XYZ789',
      status: 'inativo',
      next_due_date: '2024-01-15T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      removed_at: null
    };
    
    const { container } = render(
      <SubscriberStatusDisplay subscriber={subscriber} isActive={false} />
    );
    
    const text = container.textContent || '';
    
    expect(text).toContain('❌ ASSINATURA VENCIDA');
    expect(text).toContain('Maria Santos');
    expect(text).toContain('XYZ789');
    expect(text).toContain('Individual');
    
    // Check for formatted date (accounting for timezone)
    const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    expect(text).toContain(formattedDate);
  });

  // Test: Display company name only for corporate subscribers
  // Validates: Requirements 2.13
  it('should display company name only for corporate subscribers', () => {
    const corporateSubscriber = {
      name: 'Pedro Oliveira',
      card_id: 'CORP456',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'corporate' as const,
      company_name: 'Tech Corp LTDA',
      removed_at: null
    };
    
    const { container: corporateContainer } = render(
      <SubscriberStatusDisplay subscriber={corporateSubscriber} isActive={true} />
    );
    
    const corporateText = corporateContainer.textContent || '';
    
    expect(corporateText).toContain('Corporativo');
    expect(corporateText).toContain('Empresa:');
    expect(corporateText).toContain('Tech Corp LTDA');
    
    // Test individual subscriber should NOT have company name
    const individualSubscriber = {
      name: 'Ana Costa',
      card_id: 'IND123',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      removed_at: null
    };
    
    const { container: individualContainer } = render(
      <SubscriberStatusDisplay subscriber={individualSubscriber} isActive={true} />
    );
    
    const individualText = individualContainer.textContent || '';
    
    expect(individualText).toContain('Individual');
    expect(individualText).not.toContain('Empresa:');
  });

  // Test: Date formatting in pt-BR
  // Validates: Requirements 2.11
  it('should format date in pt-BR format (DD/MM/YYYY)', () => {
    const subscriber = {
      name: 'Test User',
      card_id: 'TEST123',
      status: 'ativo',
      next_due_date: '2024-03-05T12:00:00.000Z',
      subscriber_type: 'individual' as const,
      removed_at: null
    };
    
    const { container } = render(
      <SubscriberStatusDisplay subscriber={subscriber} isActive={true} />
    );
    
    const text = container.textContent || '';
    
    // Should contain date in DD/MM/YYYY format
    const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    expect(text).toContain(formattedDate);
    
    // Verify pt-BR format pattern (DD/MM/YYYY)
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    expect(text).toMatch(dateRegex);
  });

  // Test: Corporate subscriber without company name
  it('should not display company field if company_name is not provided', () => {
    const subscriber = {
      name: 'Corporate User',
      card_id: 'CORP999',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'corporate' as const,
      removed_at: null
    };
    
    const { container } = render(
      <SubscriberStatusDisplay subscriber={subscriber} isActive={true} />
    );
    
    const text = container.textContent || '';
    
    expect(text).toContain('Corporativo');
    expect(text).not.toContain('Empresa:');
  });

  // Test: Visual styling for active status
  it('should apply green color for active status', () => {
    const subscriber = {
      name: 'Active User',
      card_id: 'ACT123',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      removed_at: null
    };
    
    const { container } = render(
      <SubscriberStatusDisplay subscriber={subscriber} isActive={true} />
    );
    
    // Check for green color class
    const statusElement = container.querySelector('.text-green-600');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.textContent).toContain('✅ ASSINATURA ATIVA');
  });

  // Test: Visual styling for inactive status
  it('should apply red color for inactive status', () => {
    const subscriber = {
      name: 'Inactive User',
      card_id: 'INACT123',
      status: 'inativo',
      next_due_date: '2024-01-15T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      removed_at: null
    };
    
    const { container } = render(
      <SubscriberStatusDisplay subscriber={subscriber} isActive={false} />
    );
    
    // Check for red color class
    const statusElement = container.querySelector('.text-red-600');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.textContent).toContain('❌ ASSINATURA VENCIDA');
  });
});
