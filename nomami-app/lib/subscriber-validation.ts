/**
 * Subscriber validation utilities for the NoMami verification system
 */

export interface Subscriber {
  id: string;
  name: string;
  card_id: string;
  next_due_date: string;
  status: 'ativo' | 'inativo';
  plan_type: string;
  subscriber_type: 'individual' | 'corporate';
  company_id?: string;
  company_name?: string;
  removed_at?: string | null;
}

export interface SubscriberStatus {
  isActive: boolean;
  reason?: 'expired' | 'inactive' | 'removed';
}

/**
 * Validates the status of a subscriber based on business rules
 * 
 * Rules:
 * 1. Corporate subscriber with removed_at filled → INACTIVE (removed)
 * 2. Subscriber with status='inativo' → INACTIVE
 * 3. Subscriber with next_due_date < today → INACTIVE (expired)
 * 4. Otherwise → ACTIVE
 * 
 * @param subscriber - The subscriber to validate
 * @returns SubscriberStatus object with isActive flag and optional reason
 */
export function validateSubscriberStatus(subscriber: Subscriber): SubscriberStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  const dueDate = new Date(subscriber.next_due_date);
  dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  // Rule 1: Corporate subscriber removed
  if (subscriber.subscriber_type === 'corporate' && subscriber.removed_at !== null && subscriber.removed_at !== undefined) {
    return { isActive: false, reason: 'removed' };
  }
  
  // Rule 2: Status inactive
  if (subscriber.status === 'inativo') {
    return { isActive: false, reason: 'inactive' };
  }
  
  // Rule 3: Due date expired
  if (dueDate < today) {
    return { isActive: false, reason: 'expired' };
  }
  
  // Rule 4: Active subscriber
  return { isActive: true };
}
