/**
 * Property-Based Tests for WhatsApp API Service
 * 
 * Feature: whatsapp-message-cadence
 * Validates: Requirements 3.2, 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  buildTextPayload,
  buildImagePayload,
  buildVideoPayload,
} from './api-service';

describe('WhatsApp API Service - Property Tests', () => {
  /**
   * Feature: whatsapp-message-cadence, Property 7: API Payload Format Correctness
   * 
   * For any CadenceMessage, the generated WhatsApp API payload should match the expected format:
   * - text messages use sendText endpoint with "number" and "text" fields
   * - image messages use sendMedia with mediatype "image"
   * - video messages use sendMedia with mediatype "video"
   * 
   * Validates: Requirements 3.2, 3.3, 3.4
   */
  describe('Property 7: API Payload Format Correctness', () => {
    // Generate valid Brazilian phone numbers for DDD < 31 (with 9th digit)
    const phoneDddLessThan31Arb = fc.tuple(
      fc.integer({ min: 11, max: 30 }),
      fc.integer({ min: 90000000, max: 99999999 })
    ).map(([ddd, number]) => `${ddd}9${number}`);

    // Generate valid Brazilian phone numbers for DDD >= 31 (without 9th digit)
    const phoneDddGreaterOrEqual31Arb = fc.tuple(
      fc.integer({ min: 31, max: 99 }).filter(ddd => ddd !== 55),
      fc.integer({ min: 20000000, max: 89999999 })
    ).map(([ddd, number]) => `${ddd}${number}`);

    const validPhoneArb = fc.oneof(phoneDddLessThan31Arb, phoneDddGreaterOrEqual31Arb);

    // Generate non-empty text content
    const textContentArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

    // Generate valid HTTP/HTTPS URLs
    const validUrlArb = fc.webUrl({ validSchemes: ['https'] });

    describe('Text Message Payload', () => {
      it('should have correct structure with number and text fields', () => {
        fc.assert(
          fc.property(validPhoneArb, textContentArb, (phone, text) => {
            const payload = buildTextPayload(phone, text);
            
            // Must have number field
            expect(payload).toHaveProperty('number');
            expect(typeof payload.number).toBe('string');
            
            // Must have text field
            expect(payload).toHaveProperty('text');
            expect(typeof payload.text).toBe('string');
            
            // Must have delay field
            expect(payload).toHaveProperty('delay');
            expect(typeof payload.delay).toBe('number');
            
            // Must have linkPreview field
            expect(payload).toHaveProperty('linkPreview');
            expect(typeof payload.linkPreview).toBe('boolean');
          }),
          { numRuns: 100 }
        );
      });

      it('should format phone number to WhatsApp format', () => {
        fc.assert(
          fc.property(validPhoneArb, textContentArb, (phone, text) => {
            const payload = buildTextPayload(phone, text);
            
            // Number should end with @s.whatsapp.net
            expect(payload.number).toMatch(/@s\.whatsapp\.net$/);
            
            // Number should start with country code 55
            expect(payload.number).toMatch(/^55\d+@s\.whatsapp\.net$/);
          }),
          { numRuns: 100 }
        );
      });

      it('should escape newlines in text', () => {
        const textWithNewlinesArb = fc.string({ minLength: 1 })
          .filter(s => s.trim().length > 0)
          .map(s => s + '\n' + s); // Ensure at least one newline

        fc.assert(
          fc.property(validPhoneArb, textWithNewlinesArb, (phone, text) => {
            const payload = buildTextPayload(phone, text);
            
            // Text should have escaped newlines (\\n instead of \n)
            expect(payload.text).not.toContain('\n');
            expect(payload.text).toContain('\\n');
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Image Message Payload', () => {
      it('should have correct structure with mediatype "image"', () => {
        fc.assert(
          fc.property(validPhoneArb, validUrlArb, (phone, imageUrl) => {
            const payload = buildImagePayload(phone, imageUrl);
            
            // Must have number field
            expect(payload).toHaveProperty('number');
            expect(typeof payload.number).toBe('string');
            
            // Must have mediatype field set to "image"
            expect(payload).toHaveProperty('mediatype');
            expect(payload.mediatype).toBe('image');
            
            // Must have mimetype field
            expect(payload).toHaveProperty('mimetype');
            expect(payload.mimetype).toBe('image/jpeg');
            
            // Must have media field with the URL
            expect(payload).toHaveProperty('media');
            expect(payload.media).toBe(imageUrl);
            
            // Must have fileName field
            expect(payload).toHaveProperty('fileName');
            expect(typeof payload.fileName).toBe('string');
          }),
          { numRuns: 100 }
        );
      });

      it('should format phone number to WhatsApp format', () => {
        fc.assert(
          fc.property(validPhoneArb, validUrlArb, (phone, imageUrl) => {
            const payload = buildImagePayload(phone, imageUrl);
            
            // Number should end with @s.whatsapp.net
            expect(payload.number).toMatch(/@s\.whatsapp\.net$/);
            
            // Number should start with country code 55
            expect(payload.number).toMatch(/^55\d+@s\.whatsapp\.net$/);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Video Message Payload', () => {
      it('should have correct structure with mediatype "video"', () => {
        fc.assert(
          fc.property(validPhoneArb, validUrlArb, (phone, videoUrl) => {
            const payload = buildVideoPayload(phone, videoUrl);
            
            // Must have number field
            expect(payload).toHaveProperty('number');
            expect(typeof payload.number).toBe('string');
            
            // Must have mediatype field set to "video"
            expect(payload).toHaveProperty('mediatype');
            expect(payload.mediatype).toBe('video');
            
            // Must have mimetype field
            expect(payload).toHaveProperty('mimetype');
            expect(payload.mimetype).toBe('video/mp4');
            
            // Must have media field with the URL
            expect(payload).toHaveProperty('media');
            expect(payload.media).toBe(videoUrl);
            
            // Must have fileName field
            expect(payload).toHaveProperty('fileName');
            expect(typeof payload.fileName).toBe('string');
          }),
          { numRuns: 100 }
        );
      });

      it('should format phone number to WhatsApp format', () => {
        fc.assert(
          fc.property(validPhoneArb, validUrlArb, (phone, videoUrl) => {
            const payload = buildVideoPayload(phone, videoUrl);
            
            // Number should end with @s.whatsapp.net
            expect(payload.number).toMatch(/@s\.whatsapp\.net$/);
            
            // Number should start with country code 55
            expect(payload.number).toMatch(/^55\d+@s\.whatsapp\.net$/);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Payload Differentiation', () => {
      it('should produce different payloads for different message types', () => {
        fc.assert(
          fc.property(validPhoneArb, validUrlArb, (phone, url) => {
            const textPayload = buildTextPayload(phone, url);
            const imagePayload = buildImagePayload(phone, url);
            const videoPayload = buildVideoPayload(phone, url);
            
            // Text payload should have 'text' field, not 'mediatype'
            expect(textPayload).toHaveProperty('text');
            expect(textPayload).not.toHaveProperty('mediatype');
            
            // Image payload should have mediatype 'image'
            expect(imagePayload).toHaveProperty('mediatype');
            expect(imagePayload.mediatype).toBe('image');
            
            // Video payload should have mediatype 'video'
            expect(videoPayload).toHaveProperty('mediatype');
            expect(videoPayload.mediatype).toBe('video');
            
            // Image and video payloads should be different
            expect(imagePayload.mediatype).not.toBe(videoPayload.mediatype);
          }),
          { numRuns: 100 }
        );
      });
    });
  });
});
