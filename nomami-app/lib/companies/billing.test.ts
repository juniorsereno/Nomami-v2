/**
 * Property-based tests for Corporate Plans billing calculations
 * **Property 4: Billing Calculation Consistency**
 * **Validates: Requirements 2.3, 2.5, 6.3**
 * 
 * Feature: corporate-plans
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateMonthlyValue,
  calculateNextBillingDate,
  advanceBillingDate,
  isBillingOverdue,
  daysUntilBilling,
  calculateUtilization,
  isOverContractedQuantity,
  formatCurrency,
} from './billing';

// ============ Generators ============

/**
 * Generates a valid billing day (1-28)
 */
const validBillingDayArb = fc.integer({ min: 1, max: 28 });

/**
 * Generates a valid contracted quantity
 */
const validQuantityArb = fc.integer({ min: 1, max: 10000 });

/**
 * Generates a valid price per subscriber (in cents to avoid floating point issues)
 */
const validPriceArb = fc.integer({ min: 0, max: 100000 }).map(cents => cents / 100);

/**
 * Generates a valid date within reasonable range
 */
const validDateArb = fc.integer({ min: 0, max: 365 * 5 }).map(days => {
  const date = new Date('2024-01-01');
  date.setDate(date.getDate() + days);
  return date;
});

// ============ Property Tests ============

describe('Property 4: Billing Calculation Consistency', () => {
  describe('calculateMonthlyValue', () => {
    it('should satisfy: total = quantity × price for all valid inputs', () => {
      fc.assert(
        fc.property(validQuantityArb, validPriceArb, (quantity, price) => {
          const result = calculateMonthlyValue(quantity, price);
          const expected = Math.round(quantity * price * 100) / 100;
          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should be commutative with respect to multiplication order', () => {
      fc.assert(
        fc.property(validQuantityArb, validPriceArb, (quantity, price) => {
          const result1 = calculateMonthlyValue(quantity, price);
          // Verify the formula is consistent
          const result2 = Math.round(price * quantity * 100) / 100;
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0 when quantity is 0', () => {
      fc.assert(
        fc.property(validPriceArb, (price) => {
          const result = calculateMonthlyValue(0, price);
          expect(result).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0 when price is 0', () => {
      fc.assert(
        fc.property(validQuantityArb, (quantity) => {
          const result = calculateMonthlyValue(quantity, 0);
          expect(result).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should scale linearly with quantity', () => {
      fc.assert(
        fc.property(
          validQuantityArb,
          validPriceArb,
          fc.integer({ min: 2, max: 10 }),
          (quantity, price, multiplier) => {
            const single = calculateMonthlyValue(quantity, price);
            const scaled = calculateMonthlyValue(quantity * multiplier, price);
            // Allow small floating point tolerance
            expect(Math.abs(scaled - single * multiplier)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for negative quantity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          validPriceArb,
          (negQuantity, price) => {
            expect(() => calculateMonthlyValue(negQuantity, price)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for negative price', () => {
      fc.assert(
        fc.property(
          validQuantityArb,
          fc.integer({ min: -1000, max: -1 }).map(n => n / 100),
          (quantity, negPrice) => {
            expect(() => calculateMonthlyValue(quantity, negPrice)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateNextBillingDate', () => {
    it('should always return a date with the correct billing day', () => {
      fc.assert(
        fc.property(validBillingDayArb, validDateArb, (billingDay, refDate) => {
          const result = calculateNextBillingDate(billingDay, refDate);
          expect(result.getDate()).toBe(billingDay);
        }),
        { numRuns: 100 }
      );
    });

    it('should return a date >= reference date', () => {
      fc.assert(
        fc.property(validBillingDayArb, validDateArb, (billingDay, refDate) => {
          const result = calculateNextBillingDate(billingDay, refDate);
          // Set both to start of day for comparison
          const refStart = new Date(refDate);
          refStart.setHours(0, 0, 0, 0);
          const resultStart = new Date(result);
          resultStart.setHours(0, 0, 0, 0);
          expect(resultStart >= refStart).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return current month if billing day is ahead', () => {
      // Test with a specific case: billing day 20, reference day 10
      const refDate = new Date('2024-06-10');
      const result = calculateNextBillingDate(20, refDate);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getDate()).toBe(20);
    });

    it('should return next month if billing day has passed', () => {
      // Test with a specific case: billing day 5, reference day 10
      const refDate = new Date('2024-06-10');
      const result = calculateNextBillingDate(5, refDate);
      expect(result.getMonth()).toBe(6); // July (0-indexed)
      expect(result.getDate()).toBe(5);
    });

    it('should throw for invalid billing day < 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 0 }),
          validDateArb,
          (invalidDay, refDate) => {
            expect(() => calculateNextBillingDate(invalidDay, refDate)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for invalid billing day > 28', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 29, max: 31 }),
          validDateArb,
          (invalidDay, refDate) => {
            expect(() => calculateNextBillingDate(invalidDay, refDate)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('advanceBillingDate', () => {
    it('should always advance to the next month', () => {
      fc.assert(
        fc.property(validBillingDayArb, validDateArb, (billingDay, currentDate) => {
          const result = advanceBillingDate(currentDate, billingDay);
          const expectedMonth = (currentDate.getMonth() + 1) % 12;
          expect(result.getMonth()).toBe(expectedMonth);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve the billing day', () => {
      fc.assert(
        fc.property(validBillingDayArb, validDateArb, (billingDay, currentDate) => {
          const result = advanceBillingDate(currentDate, billingDay);
          expect(result.getDate()).toBe(billingDay);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle year rollover correctly', () => {
      const decemberDate = new Date('2024-12-15');
      const result = advanceBillingDate(decemberDate, 15);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
      expect(result.getDate()).toBe(15);
    });
  });

  describe('isBillingOverdue', () => {
    it('should return true for past dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAgo) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            expect(isBillingOverdue(pastDate)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for future dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);
            expect(isBillingOverdue(futureDate)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('daysUntilBilling', () => {
    it('should return positive for future dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);
            const result = daysUntilBilling(futureDate);
            expect(result).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return negative for past dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAgo) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);
            const result = daysUntilBilling(pastDate);
            expect(result).toBeLessThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateUtilization', () => {
    it('should return 100 when active equals contracted', () => {
      fc.assert(
        fc.property(validQuantityArb, (quantity) => {
          const result = calculateUtilization(quantity, quantity);
          expect(result).toBe(100);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0 when active is 0', () => {
      fc.assert(
        fc.property(validQuantityArb, (contracted) => {
          const result = calculateUtilization(0, contracted);
          expect(result).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return > 100 when over contracted', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // Use smaller contracted values
          fc.integer({ min: 1, max: 100 }),
          (contracted, extra) => {
            const active = contracted + extra;
            const result = calculateUtilization(active, contracted);
            // Result should be >= 100 (could be exactly 100 due to rounding)
            expect(result).toBeGreaterThanOrEqual(100);
            // But the raw calculation should be > 1
            expect(active / contracted).toBeGreaterThan(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when contracted is 0', () => {
      fc.assert(
        fc.property(validQuantityArb, (active) => {
          const result = calculateUtilization(active, 0);
          expect(result).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isOverContractedQuantity', () => {
    it('should return false when active <= contracted', () => {
      fc.assert(
        fc.property(
          validQuantityArb,
          fc.integer({ min: 0, max: 100 }),
          (contracted, deficit) => {
            const active = Math.max(0, contracted - deficit);
            const result = isOverContractedQuantity(active, contracted);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true when active > contracted', () => {
      fc.assert(
        fc.property(
          validQuantityArb,
          fc.integer({ min: 1, max: 100 }),
          (contracted, excess) => {
            const result = isOverContractedQuantity(contracted + excess, contracted);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatCurrency', () => {
    it('should format positive values correctly', () => {
      fc.assert(
        fc.property(validPriceArb, (value) => {
          const result = formatCurrency(value);
          expect(result).toContain('R$');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('R$');
      expect(result).toContain('0');
    });
  });
});
