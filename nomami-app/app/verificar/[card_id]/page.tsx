'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SubscriberStatusDisplay } from '@/components/subscriber-status-display';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Subscriber data returned from the API
 */
interface SubscriberData {
  name: string;
  card_id: string;
  status: string;
  next_due_date: string;
  subscriber_type: 'individual' | 'corporate';
  company_name?: string;
  isActive: boolean;
}

/**
 * VerificarPage Component
 * 
 * Public page for automatic subscriber verification via QR code.
 * Automatically fetches and displays subscriber status when accessed
 * through a QR code scan or direct URL with card ID.
 * 
 * Features:
 * - Automatic verification on page load
 * - Card ID validation
 * - Loading states
 * - Error handling for invalid/missing card IDs and network errors
 * - Responsive design for mobile devices
 * 
 * @returns Public verification page
 */
export default function VerificarPage() {
  const params = useParams();
  const cardId = params.card_id as string;
  
  const [loading, setLoading] = useState(true);
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Fetches subscriber data from the API
     * Validates card_id and handles all error cases
     */
    const fetchSubscriber = async () => {
      // Validate card_id format
      if (!cardId || cardId.trim() === '') {
        setError('Carteirinha inválida');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSubscriber(null);

      try {
        const response = await fetch(`/api/consulta?card_id=${encodeURIComponent(cardId)}`);
        
        if (response.status === 404) {
          setError('Carteirinha não encontrada');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          setError('Erro ao verificar. Tente novamente.');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSubscriber(data);
      } catch (err) {
        setError('Erro ao verificar. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriber();
  }, [cardId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verificação de Carteirinha
          </h1>
          <p className="text-gray-600">
            Verificando status da assinatura
          </p>
        </div>

        {/* Error Message */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div 
              className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"
              aria-hidden="true"
            ></div>
            <p className="mt-4 text-gray-600">Verificando...</p>
          </div>
        )}

        {/* Result Display */}
        {subscriber && !loading && (
          <SubscriberStatusDisplay
            subscriber={subscriber}
            isActive={subscriber.isActive}
          />
        )}
      </div>
    </div>
  );
}
