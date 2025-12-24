/**
 * WhatsApp Message Cadence Validation Functions
 * 
 * Validation utilities for cadence messages and phone numbers.
 * Requirements: 2.1, 2.2, 2.3, 6.3
 */

import { ValidationResult } from './types';

/**
 * Validates a text message content.
 * Rejects empty strings and strings composed entirely of whitespace.
 * 
 * Requirements: 2.1
 * 
 * @param content - The text message content to validate
 * @returns ValidationResult indicating if the content is valid
 */
export function validateTextMessage(content: string): ValidationResult {
  const errors: string[] = [];
  
  if (content === null || content === undefined) {
    errors.push('O conteúdo da mensagem é obrigatório');
    return { isValid: false, errors };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    errors.push('O conteúdo da mensagem não pode ser vazio ou conter apenas espaços');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
}

/**
 * Validates a media URL (image or video).
 * Accepts only valid HTTP/HTTPS URLs.
 * 
 * Requirements: 2.2, 2.3
 * 
 * @param url - The URL to validate
 * @returns ValidationResult indicating if the URL is valid
 */
export function validateMediaUrl(url: string): ValidationResult {
  const errors: string[] = [];
  
  if (url === null || url === undefined) {
    errors.push('A URL é obrigatória');
    return { isValid: false, errors };
  }
  
  const trimmed = url.trim();
  
  if (trimmed.length === 0) {
    errors.push('A URL não pode ser vazia');
    return { isValid: false, errors };
  }
  
  // Check if it's a valid URL with HTTP or HTTPS protocol
  try {
    const parsedUrl = new URL(trimmed);
    
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      errors.push('A URL deve usar protocolo HTTP ou HTTPS');
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  } catch {
    errors.push('URL inválida');
    return { isValid: false, errors };
  }
}

/**
 * Validates a Brazilian phone number.
 * Accepts various formats and normalizes them.
 * 
 * Brazilian phone rules:
 * - DDD (area code) < 31: mobile numbers have 9 digits (with 9th digit)
 * - DDD (area code) >= 31: mobile numbers have 8 digits (without 9th digit)
 * 
 * Requirements: 6.3
 * 
 * @param phone - The phone number to validate
 * @returns ValidationResult indicating if the phone is valid
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (phone === null || phone === undefined) {
    errors.push('O número de telefone é obrigatório');
    return { isValid: false, errors };
  }
  
  // Remove all non-digit characters
  let digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) {
    errors.push('O número de telefone não pode ser vazio');
    return { isValid: false, errors };
  }
  
  // Remove country code if present
  if (digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.slice(2);
  }
  
  // Now we should have DDD + number (10 or 11 digits)
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    errors.push('O número de telefone deve ter 10 ou 11 dígitos (DDD + número)');
    return { isValid: false, errors };
  }
  
  // Extract DDD (first 2 digits)
  const ddd = parseInt(digitsOnly.slice(0, 2), 10);
  const numberPart = digitsOnly.slice(2);
  
  // Validate DDD range (11-99)
  if (ddd < 11 || ddd > 99) {
    errors.push('DDD inválido');
    return { isValid: false, errors };
  }
  
  // Validate number length based on DDD
  // DDD < 31: should have 9 digits (with 9th digit)
  // DDD >= 31: should have 8 digits (without 9th digit)
  if (ddd < 31) {
    // Should have 9 digits
    if (numberPart.length !== 9) {
      // Accept 8 digits too, we'll add the 9th digit during formatting
      if (numberPart.length !== 8) {
        errors.push('Número de telefone inválido para este DDD');
        return { isValid: false, errors };
      }
    }
  } else {
    // DDD >= 31: should have 8 digits
    if (numberPart.length !== 8) {
      // Accept 9 digits too, we'll remove the 9th digit during formatting
      if (numberPart.length !== 9) {
        errors.push('Número de telefone inválido para este DDD');
        return { isValid: false, errors };
      }
    }
  }
  
  return { isValid: true, errors: [] };
}

/**
 * Formats a phone number to WhatsApp format.
 * Converts to: digits@s.whatsapp.net
 * 
 * Applies 9th digit rules:
 * - DDD < 31: adds 9th digit if missing
 * - DDD >= 31: removes 9th digit if present
 * 
 * Requirements: 6.4
 * 
 * @param phone - The phone number to format
 * @returns The formatted phone number or null if invalid
 */
export function formatPhoneForWhatsApp(phone: string): string | null {
  const validation = validatePhoneNumber(phone);
  
  if (!validation.isValid) {
    return null;
  }
  
  // Remove all non-digit characters
  let digitsOnly = phone.replace(/\D/g, '');
  
  // Remove country code if present
  if (digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.slice(2);
  }
  
  // Extract DDD and number
  const ddd = parseInt(digitsOnly.slice(0, 2), 10);
  let numberPart = digitsOnly.slice(2);
  
  // Apply 9th digit rules
  if (ddd < 31) {
    // DDD < 31: should have 9th digit
    if (numberPart.length === 8) {
      // Add 9th digit
      numberPart = '9' + numberPart;
    }
  } else {
    // DDD >= 31: should NOT have 9th digit
    if (numberPart.length === 9 && numberPart.startsWith('9')) {
      // Remove 9th digit
      numberPart = numberPart.slice(1);
    }
  }
  
  return `55${ddd}${numberPart}@s.whatsapp.net`;
}

/**
 * Extracts digits from a formatted WhatsApp phone number.
 * 
 * @param formattedPhone - Phone in format digits@s.whatsapp.net
 * @returns The digits only, or null if invalid format
 */
export function extractPhoneDigits(formattedPhone: string): string | null {
  if (!formattedPhone || !formattedPhone.includes('@s.whatsapp.net')) {
    return null;
  }
  
  const digits = formattedPhone.replace('@s.whatsapp.net', '');
  
  if (!/^\d+$/.test(digits)) {
    return null;
  }
  
  return digits;
}
