/**
 * Property-based tests for Digital Card Display
 * **Property 10: Digital Card Display Completeness**
 * **Validates: Requirements 7.2, 7.3, 7.4**
 * 
 * Feature: corporate-plans
 * 
 * *For any* corporate subscriber card access via card_id, the displayed card SHALL contain:
 * subscriber name, company name, card_id, validity date, and status.
 * If the subscriber is inactive, the card SHALL display an expired/invalid message.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { DigitalCard } from './digital-card';

// ============ Generators ============

/**
 * Generates a valid subscriber name
 */
const validNameArb = fc.stringMatching(/^[A-Z][a-z]{2,15}(\s[A-Z][a-z]{2,15}){1,3}$/);

/**
 * Generates a valid company name
 */
const validCompanyNameArb = fc.stringMatching(/^[A-Z][a-zA-Z\s]{3,30}$/);

/**
 * Generates a valid card ID (8 alphanumeric characters)
 */
const validCardIdArb = fc.stringMatching(/^[A-Z0-9]{8}$/);

/**
 * Generates a valid future date string
 */
const validFutureDateArb = fc.integer({
  min: Date.now(),
  max: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
}).map(timestamp => new Date(timestamp).toISOString());

/**
 * Generates a valid plan type
 */
const validPlanTypeArb = fc.constantFrom('mensal', 'anual', 'corporativo');

/**
 * Generates a valid individual subscriber
 */
const validIndividualSubscriberArb = fc.record({
  name: validNameArb,
  card_id: validCardIdArb,
  next_due_date: validFutureDateArb,
  plan_type: validPlanTypeArb,
  subscriber_type: fc.constant('individual' as const),
  status: fc.constant('ativo' as const),
});

/**
 * Generates a valid active corporate subscriber
 */
const validActiveCorporateSubscriberArb = fc.record({
  name: validNameArb,
  card_id: validCardIdArb,
  next_due_date: validFutureDateArb,
  plan_type: fc.constant('corporativo'),
  subscriber_type: fc.constant('corporate' as const),
  company_name: validCompanyNameArb,
  status: fc.constant('ativo' as const),
});

/**
 * Generates a valid inactive corporate subscriber
 */
const validInactiveCorporateSubscriberArb = fc.record({
  name: validNameArb,
  card_id: validCardIdArb,
  next_due_date: validFutureDateArb,
  plan_type: fc.constant('corporativo'),
  subscriber_type: fc.constant('corporate' as const),
  company_name: validCompanyNameArb,
  status: fc.constant('inativo' as const),
});

// ============ Property Tests ============

describe('Property 10: Digital Card Display Completeness', () => {
  describe('Individual Subscriber Cards', () => {
    it('should display subscriber name for all individual subscribers', () => {
      fc.assert(
        fc.property(validIndividualSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the name is displayed
          expect(container.textContent).toContain(subscriber.name);
        }),
        { numRuns: 100 }
      );
    });

    it('should display validity date for all individual subscribers', () => {
      fc.assert(
        fc.property(validIndividualSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the formatted date is displayed
          const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR');
          expect(container.textContent).toContain(formattedDate);
        }),
        { numRuns: 100 }
      );
    });

    it('should display "Membro" badge for individual subscribers', () => {
      fc.assert(
        fc.property(validIndividualSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the member badge is displayed
          expect(container.textContent).toContain('Membro');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Active Corporate Subscriber Cards', () => {
    it('should display subscriber name for all active corporate subscribers', () => {
      fc.assert(
        fc.property(validActiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the name is displayed
          expect(container.textContent).toContain(subscriber.name);
        }),
        { numRuns: 100 }
      );
    });

    it('should display company name for all active corporate subscribers', () => {
      fc.assert(
        fc.property(validActiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the company name is displayed
          expect(container.textContent).toContain(subscriber.company_name);
        }),
        { numRuns: 100 }
      );
    });

    it('should display validity date for all active corporate subscribers', () => {
      fc.assert(
        fc.property(validActiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the formatted date is displayed
          const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR');
          expect(container.textContent).toContain(formattedDate);
        }),
        { numRuns: 100 }
      );
    });

    it('should display "Corporativo" badge for corporate subscribers', () => {
      fc.assert(
        fc.property(validActiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the corporate badge is displayed
          expect(container.textContent).toContain('Corporativo');
        }),
        { numRuns: 100 }
      );
    });

    it('should display "Empresa" label for corporate subscribers', () => {
      fc.assert(
        fc.property(validActiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the "Empresa" label is displayed
          expect(container.textContent).toContain('Empresa');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Inactive Corporate Subscriber Cards', () => {
    it('should display inactive message for all inactive corporate subscribers', () => {
      fc.assert(
        fc.property(validInactiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the inactive message is displayed
          expect(container.textContent).toContain('Cartão Inativo');
        }),
        { numRuns: 100 }
      );
    });

    it('should display company name in inactive card for corporate subscribers', () => {
      fc.assert(
        fc.property(validInactiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the company name is displayed
          expect(container.textContent).toContain(subscriber.company_name);
        }),
        { numRuns: 100 }
      );
    });

    it('should display contact message for inactive corporate subscribers', () => {
      fc.assert(
        fc.property(validInactiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that the contact message is displayed
          expect(container.textContent).toContain('Entre em contato com sua empresa');
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT display validity date for inactive corporate subscribers', () => {
      fc.assert(
        fc.property(validInactiveCorporateSubscriberArb, (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Check that "Válido Até" is NOT displayed for inactive cards
          expect(container.textContent).not.toContain('Válido Até');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Card Display Consistency', () => {
    it('should always display "Nome do Titular" label for active subscribers', () => {
      fc.assert(
        fc.property(
          fc.oneof(validIndividualSubscriberArb, validActiveCorporateSubscriberArb),
          (subscriber) => {
            const { container } = render(<DigitalCard subscriber={subscriber} />);
            
            // Check that the label is displayed
            expect(container.textContent).toContain('Nome do Titular');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always display "Válido Até" label for active subscribers', () => {
      fc.assert(
        fc.property(
          fc.oneof(validIndividualSubscriberArb, validActiveCorporateSubscriberArb),
          (subscriber) => {
            const { container } = render(<DigitalCard subscriber={subscriber} />);
            
            // Check that the label is displayed
            expect(container.textContent).toContain('Válido Até');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always display partner link for active subscribers', () => {
      fc.assert(
        fc.property(
          fc.oneof(validIndividualSubscriberArb, validActiveCorporateSubscriberArb),
          (subscriber) => {
            const { container } = render(<DigitalCard subscriber={subscriber} />);
            
            // Check that the partner link is displayed
            expect(container.textContent).toContain('Ver Lista de Parceiros');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
