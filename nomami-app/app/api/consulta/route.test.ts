/**
 * Property-Based Tests for API Route: /api/consulta
 * Feature: verificacao-assinantes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import * as fc from 'fast-check';

// Mock the dependencies
vi.mock('@/lib/queries', () => ({
  getSubscriberByCardId: vi.fn()
}));

vi.mock('@/lib/subscriber-validation', () => ({
  validateSubscriberStatus: vi.fn()
}));

import { getSubscriberByCardId } from '@/lib/queries';
import { validateSubscriberStatus } from '@/lib/subscriber-validation';

describe('API Route Property-Based Tests', () => {
  /**
   * Property 7: API Response Completeness
   * *For any* assinante encontrado pela API, o JSON de resposta deve conter todos os campos:
   * name, card_id, status, next_due_date, subscriber_type, company_name (se corporativo), e isActive.
   * **Validates: Requirements 4.3**
   */
  it('Property 7: API Response Completeness - response should contain all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.stringMatching(/^[A-Za-z\s]{3,100}$/).filter(s => s.trim().length >= 3),
          card_id: fc.stringMatching(/^[A-Z0-9]{3,20}$/),
          next_due_date: fc.date({ min: new Date(Date.now() + 86400000), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }).map(d => d.toISOString()),
          status: fc.constant('ativo'),
          plan_type: fc.stringMatching(/^[a-z]{1,20}$/),
          subscriber_type: fc.constantFrom('individual', 'corporate'),
          company_id: fc.option(fc.uuid()),
          company_name: fc.option(fc.stringMatching(/^[A-Za-z\s]{3,100}$/).filter(s => s.trim().length >= 3)),
          removed_at: fc.constant(null)
        }),
        async (subscriber) => {
          // Clear mocks before each property test iteration
          vi.clearAllMocks();
          
          // Mock the database query
          vi.mocked(getSubscriberByCardId).mockResolvedValue(subscriber);
          
          // Mock the validation function - will return true for active subscribers with future dates
          vi.mocked(validateSubscriberStatus).mockReturnValue({ isActive: true });

          // Create request with card_id
          const url = new URL(`http://localhost:3000/api/consulta?card_id=${subscriber.card_id}`);
          const request = new NextRequest(url);

          // Call the API
          const response = await GET(request);
          const data = await response.json();

          // Verify all required fields are present
          expect(data).toHaveProperty('name');
          expect(data).toHaveProperty('card_id');
          expect(data).toHaveProperty('status');
          expect(data).toHaveProperty('next_due_date');
          expect(data).toHaveProperty('subscriber_type');
          expect(data).toHaveProperty('isActive');

          // Verify field values match
          expect(data.name).toBe(subscriber.name);
          expect(data.card_id).toBe(subscriber.card_id);
          expect(data.status).toBe(subscriber.status);
          expect(data.next_due_date).toBe(subscriber.next_due_date);
          expect(data.subscriber_type).toBe(subscriber.subscriber_type);
          expect(data.isActive).toBe(true);

          // If corporate, company_name should be present
          if (subscriber.subscriber_type === 'corporate' && subscriber.company_name) {
            expect(data).toHaveProperty('company_name');
            expect(data.company_name).toBe(subscriber.company_name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: API Success Status Code
   * *For any* card_id válido que corresponde a um assinante existente,
   * a API deve retornar HTTP status 200.
   * **Validates: Requirements 4.4**
   */
  it('Property 8: API Success Status Code - should return 200 for valid existing card_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.stringMatching(/^[A-Za-z\s]{3,100}$/).filter(s => s.trim().length >= 3),
          card_id: fc.stringMatching(/^[A-Z0-9]{3,20}$/),
          next_due_date: fc.date({ min: new Date(Date.now() + 86400000), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }).map(d => d.toISOString()),
          status: fc.constant('ativo'),
          plan_type: fc.stringMatching(/^[a-z]{1,20}$/),
          subscriber_type: fc.constantFrom('individual', 'corporate'),
          company_id: fc.option(fc.uuid()),
          company_name: fc.option(fc.stringMatching(/^[A-Za-z\s]{3,100}$/).filter(s => s.trim().length >= 3)),
          removed_at: fc.constant(null)
        }),
        async (subscriber) => {
          // Clear mocks before each property test iteration
          vi.clearAllMocks();
          
          // Mock the database query to return a subscriber
          vi.mocked(getSubscriberByCardId).mockResolvedValue(subscriber);
          
          // Mock the validation function
          vi.mocked(validateSubscriberStatus).mockReturnValue({ isActive: true });

          // Create request with card_id
          const url = new URL(`http://localhost:3000/api/consulta?card_id=${subscriber.card_id}`);
          const request = new NextRequest(url);

          // Call the API
          const response = await GET(request);

          // Verify status code is 200
          expect(response.status).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit Tests for API Route: /api/consulta
 * Testing specific edge cases and error conditions
 */
describe('API Route Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: 404 response for non-existent card_id
   * Validates: Requirements 4.5
   */
  it('should return 404 for non-existent card_id', async () => {
    // Mock database to return undefined (not found)
    vi.mocked(getSubscriberByCardId).mockResolvedValue(undefined);

    const url = new URL('http://localhost:3000/api/consulta?card_id=NOTFOUND123');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Carteirinha não encontrada');
  });

  /**
   * Test: 400 response for empty card_id
   * Validates: Requirements 4.6
   */
  it('should return 400 for empty card_id', async () => {
    const url = new URL('http://localhost:3000/api/consulta?card_id=');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Card ID inválido');
  });

  /**
   * Test: 400 response for missing card_id parameter
   * Validates: Requirements 4.6
   */
  it('should return 400 for missing card_id parameter', async () => {
    const url = new URL('http://localhost:3000/api/consulta');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Card ID inválido');
  });

  /**
   * Test: 400 response for whitespace-only card_id
   * Validates: Requirements 4.6
   */
  it('should return 400 for whitespace-only card_id', async () => {
    const url = new URL('http://localhost:3000/api/consulta?card_id=   ');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Card ID inválido');
  });

  /**
   * Test: 500 response for database error
   * Validates: Requirements 4.6
   */
  it('should return 500 for database error', async () => {
    // Mock database to throw an error
    vi.mocked(getSubscriberByCardId).mockRejectedValue(new Error('Database connection failed'));

    const url = new URL('http://localhost:3000/api/consulta?card_id=ABC123');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Erro ao buscar assinante');
  });

  /**
   * Test: Response structure for successful query
   * Validates: Requirements 4.3, 4.4
   */
  it('should return correct JSON structure for successful query', async () => {
    const mockSubscriber = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'João da Silva',
      card_id: 'ABC123',
      next_due_date: '2024-12-31T00:00:00.000Z',
      status: 'ativo' as const,
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      company_id: undefined,
      company_name: undefined,
      removed_at: null
    };

    vi.mocked(getSubscriberByCardId).mockResolvedValue(mockSubscriber);
    vi.mocked(validateSubscriberStatus).mockReturnValue({ isActive: true });

    const url = new URL('http://localhost:3000/api/consulta?card_id=ABC123');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      name: 'João da Silva',
      card_id: 'ABC123',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual',
      company_name: undefined,
      isActive: true
    });
  });

  /**
   * Test: Response includes company_name for corporate subscribers
   * Validates: Requirements 4.3
   */
  it('should include company_name for corporate subscribers', async () => {
    const mockSubscriber = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Maria Santos',
      card_id: 'CORP456',
      next_due_date: '2024-12-31T00:00:00.000Z',
      status: 'ativo' as const,
      plan_type: 'mensal',
      subscriber_type: 'corporate' as const,
      company_id: 'company-123',
      company_name: 'Empresa XYZ Ltda',
      removed_at: null
    };

    vi.mocked(getSubscriberByCardId).mockResolvedValue(mockSubscriber);
    vi.mocked(validateSubscriberStatus).mockReturnValue({ isActive: true });

    const url = new URL('http://localhost:3000/api/consulta?card_id=CORP456');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.company_name).toBe('Empresa XYZ Ltda');
    expect(data.subscriber_type).toBe('corporate');
  });

  /**
   * Test: Inactive subscriber returns correct isActive flag
   * Validates: Requirements 4.3
   */
  it('should return isActive=false for inactive subscriber', async () => {
    const mockSubscriber = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Pedro Oliveira',
      card_id: 'INACTIVE789',
      next_due_date: '2023-12-31T00:00:00.000Z',
      status: 'inativo' as const,
      plan_type: 'mensal',
      subscriber_type: 'individual' as const,
      company_id: undefined,
      company_name: undefined,
      removed_at: null
    };

    vi.mocked(getSubscriberByCardId).mockResolvedValue(mockSubscriber);
    vi.mocked(validateSubscriberStatus).mockReturnValue({ isActive: false, reason: 'inactive' });

    const url = new URL('http://localhost:3000/api/consulta?card_id=INACTIVE789');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isActive).toBe(false);
    expect(data.status).toBe('inativo');
  });
});
