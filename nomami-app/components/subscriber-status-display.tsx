/**
 * Props for the SubscriberStatusDisplay component
 */
interface SubscriberStatusDisplayProps {
  /** Subscriber information to display */
  subscriber: {
    /** Full name of the subscriber */
    name: string;
    /** Unique card identifier */
    card_id: string;
    /** Current subscription status */
    status: string;
    /** Next due date for subscription renewal */
    next_due_date: string;
    /** Type of subscription (individual or corporate) */
    subscriber_type: 'individual' | 'corporate';
    /** Company name (for corporate subscribers only) */
    company_name?: string;
    /** Date when corporate subscriber was removed (if applicable) */
    removed_at?: string | null;
  };
  /** Whether the subscription is currently active */
  isActive: boolean;
}

/**
 * SubscriberStatusDisplay Component
 * 
 * Displays subscriber status and information in a formatted card.
 * Shows active/inactive status with visual indicators and all relevant
 * subscriber details including name, card number, validity date, and
 * company name for corporate subscribers.
 * 
 * @param props - Component props
 * @returns Formatted subscriber status display
 * 
 * @example
 * ```tsx
 * <SubscriberStatusDisplay
 *   subscriber={{
 *     name: "João Silva",
 *     card_id: "ABC123",
 *     status: "ativo",
 *     next_due_date: "2024-12-31",
 *     subscriber_type: "individual"
 *   }}
 *   isActive={true}
 * />
 * ```
 */
export function SubscriberStatusDisplay({ subscriber, isActive }: SubscriberStatusDisplayProps) {
  /**
   * Formats a date string to Brazilian Portuguese format (DD/MM/YYYY)
   * @param dateString - ISO date string to format
   * @returns Formatted date string in pt-BR format
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg space-y-4"
      role="region"
      aria-label="Status da assinatura"
    >
      {/* Status Badge */}
      <div className="text-center" role="status" aria-live="polite">
        {isActive ? (
          <div className="text-3xl font-bold text-green-600" aria-label="Assinatura ativa">
            ✅ ASSINATURA ATIVA
          </div>
        ) : (
          <div className="text-3xl font-bold text-red-600" aria-label="Assinatura vencida">
            ❌ ASSINATURA VENCIDA
          </div>
        )}
      </div>

      {/* Subscriber Information */}
      <div className="space-y-2 text-gray-700" role="list" aria-label="Informações do assinante">
        <div role="listitem">
          <span className="font-semibold">Nome: </span>
          <span>{subscriber.name}</span>
        </div>

        <div role="listitem">
          <span className="font-semibold">Cartão Nº: </span>
          <span>{subscriber.card_id}</span>
        </div>

        <div role="listitem">
          <span className="font-semibold">Validade: </span>
          <span>{formatDate(subscriber.next_due_date)}</span>
        </div>

        {subscriber.subscriber_type === 'corporate' && subscriber.company_name && (
          <div role="listitem">
            <span className="font-semibold">Empresa: </span>
            <span>{subscriber.company_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
