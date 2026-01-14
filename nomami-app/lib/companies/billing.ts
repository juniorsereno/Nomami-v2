/**
 * Billing calculation utilities for Corporate Plans feature
 * Requirements: 2.3, 2.5, 6.1, 6.3
 */

/**
 * Calculates the total monthly value for a company plan
 * Formula: quantity × price per subscriber
 * 
 * @param contractedQuantity - Number of contracted subscribers
 * @param pricePerSubscriber - Price per subscriber in BRL
 * @returns Total monthly value in BRL
 */
export function calculateMonthlyValue(
  contractedQuantity: number,
  pricePerSubscriber: number
): number {
  if (contractedQuantity < 0 || pricePerSubscriber < 0) {
    throw new Error('Quantity and price must be non-negative');
  }
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(contractedQuantity * pricePerSubscriber * 100) / 100;
}

/**
 * Calculates the next billing date based on billing day and reference date
 * 
 * @param billingDay - Day of month for billing (1-28)
 * @param referenceDate - Reference date (defaults to today)
 * @returns Next billing date
 */
export function calculateNextBillingDate(
  billingDay: number,
  referenceDate: Date = new Date()
): Date {
  if (billingDay < 1 || billingDay > 28) {
    throw new Error('Billing day must be between 1 and 28');
  }

  const ref = new Date(referenceDate);
  const currentDay = ref.getDate();
  const currentMonth = ref.getMonth();
  const currentYear = ref.getFullYear();

  let nextBillingDate: Date;

  if (currentDay < billingDay) {
    // Billing day is still ahead in current month
    nextBillingDate = new Date(currentYear, currentMonth, billingDay);
  } else {
    // Billing day has passed, move to next month
    nextBillingDate = new Date(currentYear, currentMonth + 1, billingDay);
  }

  return nextBillingDate;
}

/**
 * Calculates the billing date for a specific month
 * 
 * @param billingDay - Day of month for billing (1-28)
 * @param year - Year
 * @param month - Month (0-11)
 * @returns Billing date for the specified month
 */
export function getBillingDateForMonth(
  billingDay: number,
  year: number,
  month: number
): Date {
  if (billingDay < 1 || billingDay > 28) {
    throw new Error('Billing day must be between 1 and 28');
  }
  return new Date(year, month, billingDay);
}

/**
 * Advances the billing date to the next month
 * 
 * @param currentBillingDate - Current billing date
 * @param billingDay - Day of month for billing (1-28)
 * @returns Next month's billing date
 */
export function advanceBillingDate(
  currentBillingDate: Date,
  billingDay: number
): Date {
  if (billingDay < 1 || billingDay > 28) {
    throw new Error('Billing day must be between 1 and 28');
  }

  const current = new Date(currentBillingDate);
  const nextMonth = current.getMonth() + 1;
  const year = current.getFullYear();

  return new Date(year, nextMonth, billingDay);
}

/**
 * Checks if a billing date is overdue
 * 
 * @param billingDate - The billing date to check
 * @param referenceDate - Reference date (defaults to today)
 * @returns True if the billing date is in the past
 */
export function isBillingOverdue(
  billingDate: Date,
  referenceDate: Date = new Date()
): boolean {
  const billing = new Date(billingDate);
  const ref = new Date(referenceDate);
  
  // Set both to start of day for comparison
  billing.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  
  return billing < ref;
}

/**
 * Calculates the number of days until the next billing date
 * 
 * @param billingDate - The billing date
 * @param referenceDate - Reference date (defaults to today)
 * @returns Number of days until billing (negative if overdue)
 */
export function daysUntilBilling(
  billingDate: Date,
  referenceDate: Date = new Date()
): number {
  const billing = new Date(billingDate);
  const ref = new Date(referenceDate);
  
  // Set both to start of day for comparison
  billing.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  
  const diffTime = billing.getTime() - ref.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Formats a monetary value to Brazilian Real format
 * 
 * @param value - Value in BRL
 * @returns Formatted string (e.g., "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Calculates the billing amount based on contracted quantity and price
 * This is used when generating billing records
 * 
 * @param contractedQuantity - Number of contracted subscribers
 * @param pricePerSubscriber - Price per subscriber in BRL
 * @returns Billing amount in BRL
 */
export function calculateBillingAmount(
  contractedQuantity: number,
  pricePerSubscriber: number
): number {
  return calculateMonthlyValue(contractedQuantity, pricePerSubscriber);
}

/**
 * Calculates utilization percentage
 * 
 * @param activeSubscribers - Number of active subscribers
 * @param contractedQuantity - Number of contracted subscribers
 * @returns Utilization percentage (0-100+)
 */
export function calculateUtilization(
  activeSubscribers: number,
  contractedQuantity: number
): number {
  if (contractedQuantity <= 0) return 0;
  return Math.round((activeSubscribers / contractedQuantity) * 100);
}

/**
 * Checks if the company is over the contracted quantity
 * 
 * @param activeSubscribers - Number of active subscribers
 * @param contractedQuantity - Number of contracted subscribers
 * @returns True if over contracted quantity
 */
export function isOverContractedQuantity(
  activeSubscribers: number,
  contractedQuantity: number
): boolean {
  return activeSubscribers > contractedQuantity;
}
