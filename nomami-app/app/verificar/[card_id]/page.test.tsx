/**
 * Tests for Verificar Page
 * Feature: verificacao-assinantes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VerificarPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn()
}));

// Mock fetch globally
global.fetch = vi.fn();

const mockUseParams = vi.mocked(await import('next/navigation')).useParams;

describe('Verificar Page Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  /**
   * Test: Rendering with valid card_id
   * Validates: Requirements 6.1
   */
  it('should render and fetch subscriber data with valid card_id', async () => {
    const mockResponse = {
      name: 'João da Silva',
      card_id: 'ABC123',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      isActive: true
    };

    mockUseParams.mockReturnValue({ card_id: 'ABC123' });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    render(<VerificarPage />);

    // Should show loading initially
    expect(screen.getByText(/verificando\.\.\./i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/assinatura ativa/i)).toBeInTheDocument();
      expect(screen.getByText(/joão da silva/i)).toBeInTheDocument();
      expect(screen.getByText(/abc123/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/consulta?card_id=ABC123');
  });

  /**
   * Test: Rendering with invalid card_id in URL
   * Validates: Requirements 6.9
   */
  it('should display "Carteirinha inválida" for empty card_id', async () => {
    mockUseParams.mockReturnValue({ card_id: '' });

    render(<VerificarPage />);

    await waitFor(() => {
      expect(screen.getByText(/carteirinha inválida/i)).toBeInTheDocument();
    });

    // Should not call API
    expect(fetch).not.toHaveBeenCalled();
  });

  /**
   * Test: Automatic loading state
   * Validates: Requirements 6.1
   */
  it('should display loading state automatically on mount', async () => {
    mockUseParams.mockReturnValue({ card_id: 'ABC123' });
    
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Test User',
          card_id: 'ABC123',
          status: 'ativo',
          next_due_date: '2024-12-31T00:00:00.000Z',
          subscriber_type: 'individual' as const,
          isActive: true
        })
      } as Response), 100))
    );

    render(<VerificarPage />);

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText(/verificando\.\.\./i)).toBeInTheDocument();
  });

  /**
   * Test: "Carteirinha não encontrada" message
   * Validates: Requirements 6.9
   */
  it('should display "Carteirinha não encontrada" for 404 response', async () => {
    mockUseParams.mockReturnValue({ card_id: 'NOTFOUND' });
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Carteirinha não encontrada' })
    } as Response);

    render(<VerificarPage />);

    await waitFor(() => {
      expect(screen.getByText(/carteirinha não encontrada/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Network error handling
   * Validates: Requirements 6.9
   */
  it('should display error message for network errors', async () => {
    mockUseParams.mockReturnValue({ card_id: 'ABC123' });
    
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<VerificarPage />);

    await waitFor(() => {
      expect(screen.getByText(/erro ao verificar\. tente novamente\./i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Integration with SubscriberStatusDisplay
   * Validates: Requirements 6.1
   */
  it('should display SubscriberStatusDisplay with correct data on success', async () => {
    const mockResponse = {
      name: 'Maria Santos',
      card_id: 'XYZ789',
      status: 'inativo',
      next_due_date: '2023-12-31T00:00:00.000Z',
      subscriber_type: 'corporate' as const,
      company_name: 'Empresa ABC',
      isActive: false
    };

    mockUseParams.mockReturnValue({ card_id: 'XYZ789' });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    render(<VerificarPage />);

    await waitFor(() => {
      expect(screen.getByText(/assinatura vencida/i)).toBeInTheDocument();
      expect(screen.getByText(/maria santos/i)).toBeInTheDocument();
      expect(screen.getByText(/xyz789/i)).toBeInTheDocument();
      expect(screen.getByText(/empresa abc/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Server error (500) handling
   * Validates: Requirements 6.9
   */
  it('should display error message for server errors', async () => {
    mockUseParams.mockReturnValue({ card_id: 'ABC123' });
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    } as Response);

    render(<VerificarPage />);

    await waitFor(() => {
      expect(screen.getByText(/erro ao verificar\. tente novamente\./i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Whitespace-only card_id is treated as invalid
   * Validates: Requirements 6.9
   */
  it('should display "Carteirinha inválida" for whitespace-only card_id', async () => {
    mockUseParams.mockReturnValue({ card_id: '   ' });

    render(<VerificarPage />);

    await waitFor(() => {
      expect(screen.getByText(/carteirinha inválida/i)).toBeInTheDocument();
    });

    // Should not call API
    expect(fetch).not.toHaveBeenCalled();
  });

  /**
   * Test: Automatic fetch on component mount
   * Validates: Requirements 6.1
   */
  it('should automatically fetch subscriber data on mount', async () => {
    const mockResponse = {
      name: 'Pedro Oliveira',
      card_id: 'DEF456',
      status: 'ativo',
      next_due_date: '2024-12-31T00:00:00.000Z',
      subscriber_type: 'individual' as const,
      isActive: true
    };

    mockUseParams.mockReturnValue({ card_id: 'DEF456' });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    render(<VerificarPage />);

    // Verify fetch was called automatically without user interaction
    expect(fetch).toHaveBeenCalledWith('/api/consulta?card_id=DEF456');

    await waitFor(() => {
      expect(screen.getByText(/pedro oliveira/i)).toBeInTheDocument();
    });
  });
});
