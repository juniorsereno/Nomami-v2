/**
 * Property-based tests for Corporate Plans validation
 * **Property 1: Company and Subscriber Validation**
 * **Property 3: CNPJ Uniqueness**
 * **Validates: Requirements 1.2, 1.5, 9.4**
 * 
 * Feature: corporate-plans
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateCnpj,
  validateCpf,
  validateEmail,
  validatePhone,
  validateBillingDay,
  validateCreateCompanyRequest,
  validateAddCorporateSubscriberRequest,
  cleanCnpj,
  cleanCpf,
  formatCnpj,
  formatCpf,
} from './validation';
import type { CreateCompanyRequest as _, AddCorporateSubscriberRequest as __ } from './types';

// ============ Generators ============

/**
 * Generates a valid CNPJ (14 digits with valid check digits)
 */
const validCnpjArb = fc.tuple(
  fc.integer({ min: 0, max: 99 }),
  fc.integer({ min: 0, max: 999 }),
  fc.integer({ min: 0, max: 999 }),
  fc.integer({ min: 1, max: 9999 }) // Branch number (0001-9999)
).map(([a, b, c, d]) => {
  const base = [
    Math.floor(a / 10), a % 10,
    Math.floor(b / 100), Math.floor(b / 10) % 10, b % 10,
    Math.floor(c / 100), Math.floor(c / 10) % 10, c % 10,
    Math.floor(d / 1000), Math.floor(d / 100) % 10, Math.floor(d / 10) % 10, d % 10
  ];
  
  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += base[i] * weights1[i];
  }
  const remainder1 = sum1 % 11;
  const checkDigit1 = remainder1 < 2 ? 0 : 11 - remainder1;
  base.push(checkDigit1);
  
  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += base[i] * weights2[i];
  }
  const remainder2 = sum2 % 11;
  const checkDigit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  base.push(checkDigit2);
  
  return base.join('');
});

/**
 * Generates a valid CPF (11 digits with valid check digits)
 */
const validCpfArb = fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  .filter(digits => !digits.every(d => d === digits[0])) // Exclude all same digits
  .map(base => {
    // Calculate first check digit
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += base[i] * (10 - i);
    }
    const remainder1 = (sum1 * 10) % 11;
    const checkDigit1 = remainder1 === 10 ? 0 : remainder1;
    base.push(checkDigit1);
    
    // Calculate second check digit
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += base[i] * (11 - i);
    }
    const remainder2 = (sum2 * 10) % 11;
    const checkDigit2 = remainder2 === 10 ? 0 : remainder2;
    base.push(checkDigit2);
    
    return base.join('');
  });

/**
 * Generates a valid email address
 */
const validEmailArb = fc.tuple(
  fc.stringMatching(/^[a-z][a-z0-9._]{2,20}$/),
  fc.stringMatching(/^[a-z]{2,10}$/),
  fc.constantFrom('com', 'com.br', 'org', 'net', 'io')
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generates a valid Brazilian phone number (10 or 11 digits)
 */
const validPhoneArb = fc.tuple(
  fc.integer({ min: 11, max: 99 }), // Area code
  fc.integer({ min: 90000000, max: 99999999 }) // 8 digits starting with 9
).map(([area, number]) => `${area}${number}`);

/**
 * Generates a valid billing day (1-28)
 */
const validBillingDayArb = fc.integer({ min: 1, max: 28 });

/**
 * Generates a valid company name
 */
const validCompanyNameArb = fc.stringMatching(/^[A-Z][a-zA-Z\s]{3,50}$/);

/**
 * Generates a valid person name
 */
const validPersonNameArb = fc.stringMatching(/^[A-Z][a-z]{2,15}(\s[A-Z][a-z]{2,15}){1,3}$/);

/**
 * Generates a valid CreateCompanyRequest
 */
const validCreateCompanyRequestArb = fc.record({
  name: validCompanyNameArb,
  cnpj: validCnpjArb,
  contactEmail: validEmailArb,
  contactPhone: validPhoneArb,
  contactPerson: validPersonNameArb,
  plan: fc.record({
    contractedQuantity: fc.integer({ min: 1, max: 1000 }),
    pricePerSubscriber: fc.integer({ min: 1, max: 1000 }),
    billingDay: validBillingDayArb,
    startDate: fc.constant('2024-01-15'),
  }),
});

/**
 * Generates a valid AddCorporateSubscriberRequest
 */
const validAddSubscriberRequestArb = fc.record({
  name: validPersonNameArb,
  cpf: validCpfArb,
  phone: validPhoneArb,
  email: validEmailArb,
});

// ============ Property Tests ============

describe('Property 1: Company and Subscriber Validation', () => {
  describe('CNPJ Validation', () => {
    it('should accept all valid CNPJs', () => {
      fc.assert(
        fc.property(validCnpjArb, (cnpj) => {
          expect(validateCnpj(cnpj)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept formatted valid CNPJs', () => {
      fc.assert(
        fc.property(validCnpjArb, (cnpj) => {
          const formatted = formatCnpj(cnpj);
          expect(validateCnpj(formatted)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject CNPJs with wrong length', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{1,13}$|^\d{15,}$/),
          (invalidCnpj) => {
            expect(validateCnpj(invalidCnpj)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject CNPJs with all same digits', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 9 }), (digit) => {
          const invalidCnpj = digit.toString().repeat(14);
          expect(validateCnpj(invalidCnpj)).toBe(false);
        }),
        { numRuns: 10 }
      );
    });

    it('should reject CNPJs with invalid check digits', () => {
      fc.assert(
        fc.property(validCnpjArb, fc.integer({ min: 1, max: 9 }), (cnpj, offset) => {
          // Modify the last digit to make it invalid
          const digits = cnpj.split('');
          const lastDigit = parseInt(digits[13]);
          digits[13] = ((lastDigit + offset) % 10).toString();
          const invalidCnpj = digits.join('');
          expect(validateCnpj(invalidCnpj)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('cleanCnpj should remove all non-digit characters', () => {
      fc.assert(
        fc.property(validCnpjArb, (cnpj) => {
          const formatted = formatCnpj(cnpj);
          expect(cleanCnpj(formatted)).toBe(cnpj);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('CPF Validation', () => {
    it('should accept all valid CPFs', () => {
      fc.assert(
        fc.property(validCpfArb, (cpf) => {
          expect(validateCpf(cpf)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept formatted valid CPFs', () => {
      fc.assert(
        fc.property(validCpfArb, (cpf) => {
          const formatted = formatCpf(cpf);
          expect(validateCpf(formatted)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject CPFs with wrong length', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{1,10}$|^\d{12,}$/),
          (invalidCpf) => {
            expect(validateCpf(invalidCpf)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject CPFs with all same digits', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 9 }), (digit) => {
          const invalidCpf = digit.toString().repeat(11);
          expect(validateCpf(invalidCpf)).toBe(false);
        }),
        { numRuns: 10 }
      );
    });

    it('cleanCpf should remove all non-digit characters', () => {
      fc.assert(
        fc.property(validCpfArb, (cpf) => {
          const formatted = formatCpf(cpf);
          expect(cleanCpf(formatted)).toBe(cpf);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Email Validation', () => {
    it('should accept all valid emails', () => {
      fc.assert(
        fc.property(validEmailArb, (email) => {
          expect(validateEmail(email)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject emails without @', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9.]+[a-z0-9]+\.[a-z]{2,}$/),
          (invalidEmail) => {
            expect(validateEmail(invalidEmail)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty strings', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    it('should accept all valid phones', () => {
      fc.assert(
        fc.property(validPhoneArb, (phone) => {
          expect(validatePhone(phone)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject phones with wrong length', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{1,9}$|^\d{12,}$/),
          (invalidPhone) => {
            expect(validatePhone(invalidPhone)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Billing Day Validation', () => {
    it('should accept all valid billing days (1-28)', () => {
      fc.assert(
        fc.property(validBillingDayArb, (day) => {
          expect(validateBillingDay(day)).toBe(true);
        }),
        { numRuns: 28 }
      );
    });

    it('should reject billing days outside 1-28 range', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 0 }),
            fc.integer({ min: 29, max: 100 })
          ),
          (invalidDay) => {
            expect(validateBillingDay(invalidDay)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-integer billing days', () => {
      // Test with specific non-integer values
      expect(validateBillingDay(1.5)).toBe(false);
      expect(validateBillingDay(15.7)).toBe(false);
      expect(validateBillingDay(27.9)).toBe(false);
    });
  });

  describe('CreateCompanyRequest Validation', () => {
    it('should accept all valid company requests', () => {
      fc.assert(
        fc.property(validCreateCompanyRequestArb, (request) => {
          const result = validateCreateCompanyRequest(request);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject requests with missing required fields', () => {
      fc.assert(
        fc.property(
          validCreateCompanyRequestArb,
          fc.constantFrom('name', 'cnpj', 'contactEmail', 'contactPhone', 'contactPerson'),
          (request, fieldToRemove) => {
            const invalidRequest = { ...request, [fieldToRemove]: '' };
            const result = validateCreateCompanyRequest(invalidRequest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === fieldToRemove)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject requests with invalid CNPJ', () => {
      fc.assert(
        fc.property(validCreateCompanyRequestArb, (request) => {
          const invalidRequest = { ...request, cnpj: '12345678901234' };
          const result = validateCreateCompanyRequest(invalidRequest);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.code === 'INVALID_CNPJ')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject requests with invalid email', () => {
      fc.assert(
        fc.property(validCreateCompanyRequestArb, (request) => {
          const invalidRequest = { ...request, contactEmail: 'invalid-email' };
          const result = validateCreateCompanyRequest(invalidRequest);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.code === 'INVALID_EMAIL')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject requests with invalid billing day', () => {
      fc.assert(
        fc.property(
          validCreateCompanyRequestArb,
          fc.integer({ min: 29, max: 31 }),
          (request, invalidDay) => {
            const invalidRequest = {
              ...request,
              plan: { ...request.plan, billingDay: invalidDay },
            };
            const result = validateCreateCompanyRequest(invalidRequest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_BILLING_DAY')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('AddCorporateSubscriberRequest Validation', () => {
    it('should accept all valid subscriber requests', () => {
      fc.assert(
        fc.property(validAddSubscriberRequestArb, (request) => {
          const result = validateAddCorporateSubscriberRequest(request);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject requests with missing required fields', () => {
      fc.assert(
        fc.property(
          validAddSubscriberRequestArb,
          fc.constantFrom('name', 'cpf', 'phone', 'email'),
          (request, fieldToRemove) => {
            const invalidRequest = { ...request, [fieldToRemove]: '' };
            const result = validateAddCorporateSubscriberRequest(invalidRequest);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === fieldToRemove)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject requests with invalid CPF', () => {
      fc.assert(
        fc.property(validAddSubscriberRequestArb, (request) => {
          const invalidRequest = { ...request, cpf: '12345678901' };
          const result = validateAddCorporateSubscriberRequest(invalidRequest);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.code === 'INVALID_CPF')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
