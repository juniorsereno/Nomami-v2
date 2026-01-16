'use client';

import { useState } from 'react';
import { SubscriberStatusDisplay } from '@/components/subscriber-status-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
 * ConsultaPage Component
 * 
 * Public page for manual subscriber verification by card ID.
 * Partners can enter a card number to check if a subscription is active.
 * 
 * Features:
 * - Automatic uppercase conversion for card ID input
 * - Real-time validation
 * - Loading states
 * - Error handling for 404 and network errors
 * - Responsive design for mobile devices
 * 
 * @returns Public consultation page
 */
export default function ConsultaPage() {
  const [cardId, setCardId] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles input changes and converts to uppercase automatically
   * @param e - Input change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardId(e.target.value.toUpperCase());
  };

  /**
   * Handles the consultation request
   * Validates input, calls API, and updates state accordingly
   */
  const handleConsulta = async () => {
    if (!cardId.trim()) {
      setError('Por favor, digite o número da carteirinha');
      return;
    }

    setLoading(true);
    setError(null);
    setSubscriber(null);

    try {
      const response = await fetch(`/api/consulta?card_id=${encodeURIComponent(cardId.trim())}`);
      
      if (response.status === 404) {
        setError('Carteirinha não encontrada');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError('Erro ao consultar. Tente novamente.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSubscriber(data);
    } catch (err) {
      setError('Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Enter key press to trigger consultation
   * @param e - Keyboard event
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConsulta();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Consulta de Carteirinha
          </h1>
          <p className="text-gray-600">
            Digite o número da sua carteirinha para verificar o status
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-id" className="text-base font-medium">
                Digite o número da carteirinha
              </Label>
              <Input
                id="card-id"
                type="text"
                placeholder="Ex: ABC123"
                value={cardId}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="mt-2 text-lg"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleConsulta}
              disabled={loading || !cardId.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
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
            <p className="mt-4 text-gray-600">Consultando...</p>
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
