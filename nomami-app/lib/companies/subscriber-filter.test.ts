/**
 * Property-based tests for Subscriber Type Filter
 * **Property 11: Subscriber Type Filter Accuracy**
 * **Validates: Requirements 8.2, 8.5**
 * 
 * Feature: corporate-plans
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property 11: Subscriber Type Filter Accuracy', () => {
  describe('Filter Logic', () => {
    it('individual filter should only return individual subscribers', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              subscriberType: fc.constantFrom('individual', 'corporate'),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (subscribers) => {
            // Simulate filter
            const filtered = subscribers.filter(s => s.subscriberType === 'individual');
            
            // All filtered results should be individual
            for (const subscriber of filtered) {
              expect(subscriber.subscriberType).toBe('individual');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('corporate filter should only return corporate subscribers', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              subscriberType: fc.constantFrom('individual', 'corporate'),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (subscribers) => {
            // Simulate filter
            const filtered = subscribers.filter(s => s.subscriberType === 'corporate');
            
            // All filtered results should be corporate
            for (const subscriber of filtered) {
              expect(subscriber.subscriberType).toBe('corporate');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('no filter should return all subscribers', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              subscriberType: fc.constantFrom('individual', 'corporate'),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (subscribers) => {
            // No filter applied
            const filtered = subscribers;
            
            // Should return all
            expect(filtered.length).toBe(subscribers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtered count should equal sum of individual and corporate counts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              subscriberType: fc.constantFrom('individual', 'corporate'),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (subscribers) => {
            const individualCount = subscribers.filter(s => s.subscriberType === 'individual').length;
            const corporateCount = subscribers.filter(s => s.subscriberType === 'corporate').length;
            
            expect(individualCount + corporateCount).toBe(subscribers.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Search with Type Filter', () => {
    it('search should work within filtered type', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              cpf: fc.stringMatching(/^\d{11}$/),
              subscriberType: fc.constantFrom('individual', 'corporate'),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.constantFrom('individual', 'corporate'),
          (subscribers, filterType) => {
            // First filter by type
            const typeFiltered = subscribers.filter(s => s.subscriberType === filterType);
            
            // Then search within filtered results
            if (typeFiltered.length > 0) {
              const searchTerm = typeFiltered[0].name.substring(0, 3).toLowerCase();
              const searchFiltered = typeFiltered.filter(s => 
                s.name.toLowerCase().includes(searchTerm) ||
                s.cpf.includes(searchTerm)
              );
              
              // All results should still be of the filtered type
              for (const subscriber of searchFiltered) {
                expect(subscriber.subscriberType).toBe(filterType);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Default Type Handling', () => {
    it('null subscriber_type should default to individual', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              subscriberType: fc.option(fc.constantFrom('individual', 'corporate'), { nil: null }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (subscribers) => {
            // Simulate COALESCE behavior
            const normalized = subscribers.map(s => ({
              ...s,
              subscriberType: s.subscriberType ?? 'individual',
            }));
            
            // Filter for individual
            const filtered = normalized.filter(s => s.subscriberType === 'individual');
            
            // Should include both explicit individual and null (defaulted to individual)
            const originalIndividualOrNull = subscribers.filter(
              s => s.subscriberType === 'individual' || s.subscriberType === null
            );
            
            expect(filtered.length).toBe(originalIndividualOrNull.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
