/**
 * Tests for Consulta Page
 * Feature: verificacao-assinantes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import ConsultaPage from './page';

// Mock fetch globally
global.fetch = vi.fn();

describe('Consulta Page Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 3: Input Uppercase Conversion
   * *For any* string digitada no campo de input da página de consulta,
   * o valor deve ser automaticamente convertido para maiúsculas.
   * **Validates: Requirements 2.4**
   */
  it('Property 3: Input Uppercase Conversion - should convert any input to uppercase', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (inputString) => {
          const { container } = render(<ConsultaPage />);
          const input = container.querySelector('input') as HTMLInputElement;

          // Simulate user typing
          fireEvent.change(input, { target: { value: inputString } });

          // Verify the input value is uppercase
          expect(input.value).toBe(inputString.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Consulta Page Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  /**
   * Test: Initial rendering
   * Validates: Requirements 2.1, 2.2, 2.3
   */
  it('should render input field, label, and button', () => {
    render(<ConsultaPage />);

    expect(screen.getByLabelText(/digite o número da carteirinha/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ex: abc123/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /consultar/i })).toBeInTheDocument();
  });

  /**
   * Test: Button click behavior
   * Validates: Requirements 2.5, 2.6
   */
  it('should call API when button is clicked with valid card_id', async () => {
    const mockResponse = {
      name: 'João da Silva',
      card_id: 'ABC123',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      isActive: true
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);
    const button = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(input, { target: { value: 'ABC123' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/consulta?card_id=ABC123');
    });
  });

  /**
   * Test: Loading state display
   * Validates: Requirements 2.6
   */
  it('should display loading state during API call', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: async () => ({})
      } as Response), 100))
    );

    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);
    const button = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(input, { target: { value: 'ABC123' } });
    fireEvent.click(button);

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    
    // Check button is disabled during loading
    expect(button).toBeDisabled();
  });

  /**
   * Test: "Carteirinha não encontrada" message
   * Validates: Requirements 2.14
   */
  it('should display "Carteirinha não encontrada" for 404 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Carteirinha não encontrada' })
    } as Response);

    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);
    const button = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(input, { target: { value: 'NOTFOUND' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/carteirinha não encontrada/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Network error handling
   * Validates: Requirements 2.15
   */
  it('should display error message for network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);
    const button = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(input, { target: { value: 'ABC123' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/erro ao consultar\. tente novamente\./i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Integration with SubscriberStatusDisplay
   * Validates: Requirements 2.6
   */
  it('should display SubscriberStatusDisplay with correct data on success', async () => {
    const mockResponse = {
      name: 'Maria Santos',
      card_id: 'XYZ789',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      isActive: true
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);
    const button = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(input, { target: { value: 'XYZ789' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/assinatura ativa/i)).toBeInTheDocument();
      expect(screen.getByText(/maria santos/i)).toBeInTheDocument();
      expect(screen.getByText(/xyz789/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Enter key triggers consultation
   * Validates: Requirements 2.5
   */
  it('should trigger consultation when Enter key is pressed', async () => {
    const mockResponse = {
      name: 'Pedro Oliveira',
      card_id: 'DEF456',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      isActive: true
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);

    fireEvent.change(input, { target: { value: 'DEF456' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/consulta?card_id=DEF456');
    });
  });

  /**
   * Test: Button disabled when input is empty
   * Validates: Requirements 2.5
   */
  it('should disable button when input is empty', () => {
    render(<ConsultaPage />);

    const button = screen.getByRole('button', { name: /consultar/i });

    expect(button).toBeDisabled();
  });

  /**
   * Test: Button enabled when input has value
   * Validates: Requirements 2.5
   */
  it('should enable button when input has value', () => {
    render(<ConsultaPage />);

    const input = screen.getByPlaceholderText(/ex: abc123/i);
    const button = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(input, { target: { value: 'ABC' } });

    expect(button).not.toBeDisabled();
  });
});
