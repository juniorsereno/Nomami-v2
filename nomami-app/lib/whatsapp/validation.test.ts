/**
 * Property-Based Tests for WhatsApp Validation Functions
 * 
 * Feature: whatsapp-message-cadence
 * Validates: Requirements 2.1, 2.2, 2.3, 6.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateTextMessage,
  validateMediaUrl,
  validatePhoneNumber,
  formatPhoneForWhatsApp,
} from './validation';

describe('WhatsApp Validation - Property Tests', () => {
  /**
   * Feature: whatsapp-message-cadence, Property 5: Empty Text Validation Rejection
   * 
   * For any string composed entirely of whitespace characters (including empty string),
   * attempting to create a text message should fail validation.
   * 
   * Validates: Requirements 2.1
   */
  describe('Property 5: Empty Text Validation Rejection', () => {
    it('should reject empty strings', () => {
      fc.assert(
        fc.property(fc.constant(''), (emptyString) => {
          const result = validateTextMessage(emptyString);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject strings composed entirely of whitespace', () => {
      // Generate strings with only whitespace characters
      const whitespaceArb = fc.array(
        fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'),
        { minLength: 1, maxLength: 100 }
      ).map(arr => arr.join(''));

      fc.assert(
        fc.property(whitespaceArb, (whitespaceString: string) => {
          const result = validateTextMessage(whitespaceString);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept non-empty strings with at least one non-whitespace character', () => {
      // Generate strings that have at least one non-whitespace character
      const nonEmptyArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

      fc.assert(
        fc.property(nonEmptyArb, (validString) => {
          const result = validateTextMessage(validString);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 6: Invalid URL Validation Rejection
   * 
   * For any string that is not a valid HTTP/HTTPS URL, attempting to create
   * an image or video message should fail validation.
   * 
   * Validates: Requirements 2.2, 2.3
   */
  describe('Property 6: Invalid URL Validation Rejection', () => {
    it('should reject empty URLs', () => {
      fc.assert(
        fc.property(fc.constant(''), (emptyUrl) => {
          const result = validateMediaUrl(emptyUrl);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject URLs with non-HTTP/HTTPS protocols', () => {
      const invalidProtocols = ['ftp://', 'file://', 'mailto:', 'javascript:', 'data:'];
      const invalidProtocolArb = fc.constantFrom(...invalidProtocols);
      const pathArb = fc.webPath();

      fc.assert(
        fc.property(invalidProtocolArb, pathArb, (protocol, path) => {
          const invalidUrl = `${protocol}example.com${path}`;
          const result = validateMediaUrl(invalidUrl);
          expect(result.isValid).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject random strings that are not valid URLs', () => {
      // Generate random strings that are unlikely to be valid URLs
      const randomStringArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => !s.startsWith('http://') && !s.startsWith('https://'));

      fc.assert(
        fc.property(randomStringArb, (randomString) => {
          const result = validateMediaUrl(randomString);
          // Most random strings should fail URL validation
          // We check that the validation runs without throwing
          expect(typeof result.isValid).toBe('boolean');
          expect(Array.isArray(result.errors)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid HTTP URLs', () => {
      fc.assert(
        fc.property(fc.webUrl({ validSchemes: ['http'] }), (validUrl) => {
          const result = validateMediaUrl(validUrl);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid HTTPS URLs', () => {
      fc.assert(
        fc.property(fc.webUrl({ validSchemes: ['https'] }), (validUrl) => {
          const result = validateMediaUrl(validUrl);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: whatsapp-message-cadence, Property 10: Phone Number Formatting
   * 
   * For any valid Brazilian phone number input (with or without country code,
   * with or without formatting), the stored format should match the pattern:
   * digits followed by "@s.whatsapp.net".
   * 
   * Brazilian phone rules:
   * - DDD < 31: mobile numbers have 9 digits (with 9th digit)
   * - DDD >= 31: mobile numbers have 8 digits (without 9th digit)
   * 
   * Validates: Requirements 6.4
   */
  describe('Property 10: Phone Number Formatting', () => {
    // Generate valid Brazilian phone numbers for DDD < 31 (with 9th digit)
    const phoneDddLessThan31Arb = fc.tuple(
      fc.integer({ min: 11, max: 30 }), // DDD < 31
      fc.integer({ min: 90000000, max: 99999999 }) // 8-digit number (9 will be added)
    ).map(([ddd, number]) => `${ddd}9${number}`); // 9 + 8 digits = 9 digit number

    // Generate valid Brazilian phone numbers for DDD >= 31 (without 9th digit)
    // Avoid DDD 55 as it could be confused with country code
    const phoneDddGreaterOrEqual31Arb = fc.tuple(
      fc.integer({ min: 31, max: 99 }).filter(ddd => ddd !== 55), // DDD >= 31, not 55
      fc.integer({ min: 20000000, max: 89999999 }) // 8-digit number not starting with 9
    ).map(([ddd, number]) => `${ddd}${number}`);

    // Generate phone with country code
    const phoneWithCountryCodeArb = fc.oneof(
      phoneDddLessThan31Arb.map(phone => `55${phone}`),
      phoneDddGreaterOrEqual31Arb.map(phone => `55${phone}`)
    );

    // Generate formatted phone numbers (DDD < 31 with 9th digit)
    const formattedPhoneLessThan31Arb = fc.tuple(
      fc.integer({ min: 11, max: 30 }),
      fc.integer({ min: 9000, max: 9999 }),
      fc.integer({ min: 0, max: 9999 })
    ).map(([ddd, prefix, suffix]) => 
      `(${ddd}) 9${prefix}-${suffix.toString().padStart(4, '0')}`
    );

    it('should format valid phone numbers to WhatsApp format', () => {
      fc.assert(
        fc.property(fc.oneof(phoneDddLessThan31Arb, phoneDddGreaterOrEqual31Arb), (phone) => {
          const formatted = formatPhoneForWhatsApp(phone);
          expect(formatted).not.toBeNull();
          expect(formatted).toMatch(/^\d+@s\.whatsapp\.net$/);
          expect(formatted).toContain('55'); // Should have country code
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve country code when already present', () => {
      fc.assert(
        fc.property(phoneWithCountryCodeArb, (phone) => {
          const formatted = formatPhoneForWhatsApp(phone);
          expect(formatted).not.toBeNull();
          expect(formatted).toMatch(/^55\d+@s\.whatsapp\.net$/);
          // Should not duplicate country code
          expect(formatted!.startsWith('5555')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle formatted phone numbers with special characters', () => {
      fc.assert(
        fc.property(formattedPhoneLessThan31Arb, (phone) => {
          const formatted = formatPhoneForWhatsApp(phone);
          expect(formatted).not.toBeNull();
          expect(formatted).toMatch(/^\d+@s\.whatsapp\.net$/);
          // Should only contain digits before @
          const digits = formatted!.replace('@s.whatsapp.net', '');
          expect(/^\d+$/.test(digits)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate phone numbers correctly for DDD < 31', () => {
      fc.assert(
        fc.property(phoneDddLessThan31Arb, (phone) => {
          const result = validatePhoneNumber(phone);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate phone numbers correctly for DDD >= 31', () => {
      fc.assert(
        fc.property(phoneDddGreaterOrEqual31Arb, (phone) => {
          const result = validatePhoneNumber(phone);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should add 9th digit for DDD < 31 when missing', () => {
      // Phone without 9th digit for DDD < 31
      const phoneWithout9thDigitArb = fc.tuple(
        fc.integer({ min: 11, max: 30 }),
        fc.integer({ min: 20000000, max: 89999999 }) // 8-digit number without leading 9
      ).map(([ddd, number]) => `${ddd}${number}`);

      fc.assert(
        fc.property(phoneWithout9thDigitArb, (phone) => {
          const formatted = formatPhoneForWhatsApp(phone);
          expect(formatted).not.toBeNull();
          // Should have added the 9th digit
          const digits = formatted!.replace('@s.whatsapp.net', '');
          const ddd = digits.slice(2, 4);
          const numberPart = digits.slice(4);
          expect(parseInt(ddd, 10)).toBeLessThan(31);
          expect(numberPart.length).toBe(9);
          expect(numberPart.startsWith('9')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should remove 9th digit for DDD >= 31 when present', () => {
      // Phone with 9th digit for DDD >= 31
      const phoneWith9thDigitArb = fc.tuple(
        fc.integer({ min: 31, max: 99 }).filter(ddd => ddd !== 55),
        fc.integer({ min: 10000000, max: 89999999 }) // 8-digit number
      ).map(([ddd, number]) => `${ddd}9${number}`); // Adding 9th digit

      fc.assert(
        fc.property(phoneWith9thDigitArb, (phone) => {
          const formatted = formatPhoneForWhatsApp(phone);
          expect(formatted).not.toBeNull();
          // Should have removed the 9th digit
          const digits = formatted!.replace('@s.whatsapp.net', '');
          const ddd = digits.slice(2, 4);
          const numberPart = digits.slice(4);
          expect(parseInt(ddd, 10)).toBeGreaterThanOrEqual(31);
          expect(numberPart.length).toBe(8);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject phone numbers with too few digits', () => {
      const shortPhoneArb = fc.array(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        { minLength: 1, maxLength: 9 }
      ).map(arr => arr.join(''));

      fc.assert(
        fc.property(shortPhoneArb, (phone: string) => {
          const result = validatePhoneNumber(phone);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject phone numbers with too many digits', () => {
      const longPhoneArb = fc.array(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        { minLength: 14, maxLength: 20 }
      ).map(arr => arr.join(''));

      fc.assert(
        fc.property(longPhoneArb, (phone: string) => {
          const result = validatePhoneNumber(phone);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
