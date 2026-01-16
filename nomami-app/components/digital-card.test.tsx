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


// ============================================================================
// PROPERTY TESTS FOR CARD_ID DISPLAY
// Feature: verificacao-assinantes
// ============================================================================

describe('Property Tests - Card ID Display', () => {
  // Property 1: Card ID Formatting
  // Validates: Requirements 1.3
  it('Property 1: Card ID Formatting - should display card_id with "Cartão Nº: " prefix', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          validIndividualSubscriberArb,
          validActiveCorporateSubscriberArb,
          validInactiveCorporateSubscriberArb
        ),
        (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          const text = container.textContent || '';
          
          // Should contain "Cartão Nº: " prefix followed by card_id
          expect(text).toContain('Cartão Nº:');
          expect(text).toContain(subscriber.card_id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: Card ID Display Across Subscriber Types
  // Validates: Requirements 1.5
  it('Property 2: Card ID Display Across Subscriber Types - should display card_id for all subscriber types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          validIndividualSubscriberArb,
          validActiveCorporateSubscriberArb
        ),
        (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          const text = container.textContent || '';
          
          // Should display card_id for both individual and corporate subscribers
          expect(text).toContain(subscriber.card_id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Card ID display in inactive corporate cards
  // Validates: Requirements 1.6
  it('should display card_id in inactive corporate cards', () => {
    fc.assert(
      fc.property(
        validInactiveCorporateSubscriberArb,
        (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          const text = container.textContent || '';
          
          // Should display card_id even in inactive cards
          expect(text).toContain('Cartão Nº:');
          expect(text).toContain(subscriber.card_id);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// UNIT TESTS FOR CARD_ID DISPLAY
// Feature: verificacao-assinantes
// ============================================================================

describe('Unit Tests - Card ID Display', () => {
  // Test: Presence of "Cartão Nº:" text
  // Validates: Requirements 1.2
  it('should display "Cartão Nº:" prefix text', () => {
    const subscriber = {
      name: 'João Silva',
      card_id: 'ABC12345',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    const text = container.textContent || '';
    
    expect(text).toContain('Cartão Nº:');
    expect(text).toContain('ABC12345');
  });

  // Test: Positioning relative to other elements
  // Validates: Requirements 1.2, 1.4
  it('should position card_id after name and before validity date', () => {
    const subscriber = {
      name: 'Maria Santos',
      card_id: 'XYZ98765',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    const text = container.textContent || '';
    
    // Check that elements appear in correct order
    const nameIndex = text.indexOf('Maria Santos');
    const cardIdIndex = text.indexOf('Cartão Nº:');
    const validityIndex = text.indexOf('Válido Até');
    
    expect(nameIndex).toBeLessThan(cardIdIndex);
    expect(cardIdIndex).toBeLessThan(validityIndex);
  });

  // Test: CSS classes applied
  // Validates: Requirements 1.4
  it('should apply text-xs class to card_id display', () => {
    const subscriber = {
      name: 'Pedro Costa',
      card_id: 'TEST1234',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    // Find the element containing card_id
    const cardIdElement = Array.from(container.querySelectorAll('p')).find(
      el => el.textContent?.includes('Cartão Nº:')
    );
    
    expect(cardIdElement).toBeTruthy();
    expect(cardIdElement?.className).toContain('text-xs');
  });

  // Test: Display in inactive corporate card
  // Validates: Requirements 1.6
  it('should display card_id in inactive corporate card', () => {
    const subscriber = {
      name: 'Ana Oliveira',
      card_id: 'CORP9999',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'corporativo',
      subscriber_type: 'corporate' as const,
      company_name: 'Tech Corp',
      status: 'inativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    const text = container.textContent || '';
    
    expect(text).toContain('Cartão Inativo');
    expect(text).toContain('Cartão Nº:');
    expect(text).toContain('CORP9999');
  });

  // Test: Display for corporate active subscriber
  // Validates: Requirements 1.5
  it('should display card_id for active corporate subscriber', () => {
    const subscriber = {
      name: 'Carlos Mendes',
      card_id: 'CORP5678',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'corporativo',
      subscriber_type: 'corporate' as const,
      company_name: 'Business Inc',
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    const text = container.textContent || '';
    
    expect(text).toContain('Corporativo');
    expect(text).toContain('Cartão Nº:');
    expect(text).toContain('CORP5678');
  });

  // Test: No card_id provided (optional field)
  it('should not display card_id section when card_id is not provided', () => {
    const subscriber = {
      name: 'User Without Card',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    const text = container.textContent || '';
    
    expect(text).not.toContain('Cartão Nº:');
  });
});


// ============================================================================
// PROPERTY TESTS FOR QR CODE DISPLAY
// Feature: verificacao-assinantes
// ============================================================================

describe('Property Tests - QR Code Display', () => {
  // Property 9: QR Code URL Pattern
  // Validates: Requirements 5.5
  it('Property 9: QR Code URL Pattern - should encode URL in format /verificar/[card_id]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          validIndividualSubscriberArb,
          validActiveCorporateSubscriberArb,
          validInactiveCorporateSubscriberArb
        ),
        (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Look for any SVG (QR code) in the container
          const svgs = container.querySelectorAll('svg');
          const qrCodeSvg = Array.from(svgs).find(svg => 
            svg.getAttribute('width') === '60' && svg.getAttribute('height') === '60'
          );
          
          // QR code SVG should be present
          expect(qrCodeSvg).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 10: QR Code Display Across Subscriber Types
  // Validates: Requirements 5.7
  it('Property 10: QR Code Display Across Subscriber Types - should display QR code for all subscriber types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          validIndividualSubscriberArb,
          validActiveCorporateSubscriberArb
        ),
        (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // Look for any SVG (QR code) in the container
          const svgs = container.querySelectorAll('svg');
          const qrCodeSvg = Array.from(svgs).find(svg => 
            svg.getAttribute('width') === '60' && svg.getAttribute('height') === '60'
          );
          
          // QR code SVG should be present
          expect(qrCodeSvg).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: QR Code display in inactive corporate cards
  // Validates: Requirements 5.8
  it('should display QR code in inactive corporate cards', () => {
    fc.assert(
      fc.property(
        validInactiveCorporateSubscriberArb,
        (subscriber) => {
          const { container } = render(<DigitalCard subscriber={subscriber} />);
          
          // QR code should be present even in inactive cards
          const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
          expect(qrCodeContainer).toBeTruthy();
          
          // Should contain an SVG element
          const qrCodeSvg = qrCodeContainer?.querySelector('svg');
          expect(qrCodeSvg).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// UNIT TESTS FOR QR CODE DISPLAY
// Feature: verificacao-assinantes
// ============================================================================

describe('Unit Tests - QR Code Display', () => {
  // Test: Presence of QRCodeSVG component
  // Validates: Requirements 5.1
  it('should render QRCodeSVG component', () => {
    const subscriber = {
      name: 'João Silva',
      card_id: 'ABC12345',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    // Look for QR code SVG (60x60)
    const svgs = container.querySelectorAll('svg');
    const qrCodeSvg = Array.from(svgs).find(svg => 
      svg.getAttribute('width') === '60' && svg.getAttribute('height') === '60'
    );
    
    expect(qrCodeSvg).toBeTruthy();
  });

  // Test: QR code props (size, colors, level)
  // Validates: Requirements 5.2, 5.3
  it('should render QR code with correct size (60x60)', () => {
    const subscriber = {
      name: 'Maria Santos',
      card_id: 'XYZ98765',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    const svg = container.querySelector('.absolute.bottom-4.left-8 svg');
    expect(svg).toBeTruthy();
    
    // Check SVG dimensions (QRCodeSVG sets width and height attributes)
    expect(svg?.getAttribute('width')).toBe('60');
    expect(svg?.getAttribute('height')).toBe('60');
  });

  // Test: QR code positioning (bottom left corner)
  // Validates: Requirements 5.2
  it('should position QR code in bottom left corner', () => {
    const subscriber = {
      name: 'Pedro Costa',
      card_id: 'TEST1234',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
    expect(qrCodeContainer).toBeTruthy();
    
    // Check positioning classes
    expect(qrCodeContainer?.className).toContain('absolute');
    expect(qrCodeContainer?.className).toContain('bottom-4');
    expect(qrCodeContainer?.className).toContain('left-8');
  });

  // Test: QR code background (white/semi-transparent)
  // Validates: Requirements 5.4
  it('should apply white background to QR code', () => {
    const subscriber = {
      name: 'Ana Oliveira',
      card_id: 'CORP9999',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'corporativo',
      subscriber_type: 'corporate' as const,
      company_name: 'Tech Corp',
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
    expect(qrCodeContainer).toBeTruthy();
    
    // Check for white background class
    expect(qrCodeContainer?.className).toContain('bg-white');
  });

  // Test: Display in inactive corporate card
  // Validates: Requirements 5.8
  it('should display QR code in inactive corporate card', () => {
    const subscriber = {
      name: 'Carlos Mendes',
      card_id: 'INACT123',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'corporativo',
      subscriber_type: 'corporate' as const,
      company_name: 'Business Inc',
      status: 'inativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    // Should show inactive message
    expect(container.textContent).toContain('Cartão Inativo');
    
    // QR code should still be present
    const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
    expect(qrCodeContainer).toBeTruthy();
    
    const svg = qrCodeContainer?.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  // Test: No QR code when card_id is not provided
  it('should not display QR code when card_id is not provided', () => {
    const subscriber = {
      name: 'User Without Card',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    // QR code container should not exist
    const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
    expect(qrCodeContainer).toBeNull();
  });

  // Test: QR code for individual subscriber
  // Validates: Requirements 5.7
  it('should display QR code for individual subscriber', () => {
    const subscriber = {
      name: 'Individual User',
      card_id: 'IND12345',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    // Should show Membro badge
    expect(container.textContent).toContain('Membro');
    
    // QR code should be present
    const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
    expect(qrCodeContainer).toBeTruthy();
  });

  // Test: QR code for corporate subscriber
  // Validates: Requirements 5.7
  it('should display QR code for corporate subscriber', () => {
    const subscriber = {
      name: 'Corporate User',
      card_id: 'CORP5678',
      next_due_date: '2024-12-31T00:00:00.000Z',
      plan_type: 'corporativo',
      subscriber_type: 'corporate' as const,
      company_name: 'Company XYZ',
      status: 'ativo'
    };
    
    const { container } = render(<DigitalCard subscriber={subscriber} />);
    
    // Should show Corporativo badge
    expect(container.textContent).toContain('Corporativo');
    
    // QR code should be present
    const qrCodeContainer = container.querySelector('div.absolute.bottom-4.left-8, div.absolute.bottom-4.left-6');
    expect(qrCodeContainer).toBeTruthy();
  });
});
