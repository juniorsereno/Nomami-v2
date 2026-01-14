/**
 * TypeScript types for Corporate Plans feature
 * Requirements: 1.2, 1.5, 9.2, 9.4
 */

// Company status enum
export type CompanyStatus = 'active' | 'suspended' | 'cancelled';

// Plan status enum
export type PlanStatus = 'active' | 'suspended' | 'cancelled';

// Billing status enum
export type BillingStatus = 'pending' | 'paid' | 'overdue';

// Subscriber type enum
export type SubscriberType = 'individual' | 'corporate';

// Subscriber status enum (matches existing system)
export type SubscriberStatus = 'ativo' | 'inativo' | 'vencido';

/**
 * Company entity
 */
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Company plan configuration
 */
export interface CompanyPlan {
  id: string;
  companyId: string;
  contractedQuantity: number;
  pricePerSubscriber: number;
  billingDay: number;
  startDate: Date;
  nextBillingDate: Date;
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Computed company plan with total value
 */
export interface CompanyPlanWithTotal extends CompanyPlan {
  totalMonthlyValue: number;
}

/**
 * Company plan history record
 */
export interface CompanyPlanHistory {
  id: string;
  companyId: string;
  contractedQuantity: number;
  pricePerSubscriber: number;
  billingDay: number;
  changedAt: Date;
  changedBy?: string;
}

/**
 * Company billing history record
 */
export interface CompanyBillingHistory {
  id: string;
  companyId: string;
  billingDate: Date;
  amount: number;
  subscriberCount: number;
  status: BillingStatus;
  paidAt?: Date;
  createdAt: Date;
}

/**
 * Corporate subscriber (extends base subscriber)
 */
export interface CorporateSubscriber {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  companyId: string;
  companyName?: string;
  subscriberType: 'corporate';
  status: SubscriberStatus;
  cardId: string;
  startDate: Date;
  nextDueDate: Date;
  removedAt?: Date;
  value?: number;
  planType?: string;
}

// ============ Request/Response Types ============

/**
 * Request to create a new company with plan
 */
export interface CreateCompanyRequest {
  name: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  plan: {
    contractedQuantity: number;
    pricePerSubscriber: number;
    billingDay: number;
    startDate: string; // ISO date string
  };
}

/**
 * Request to update company information
 */
export interface UpdateCompanyRequest {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  status?: CompanyStatus;
}

/**
 * Request to update company plan
 */
export interface UpdatePlanRequest {
  contractedQuantity?: number;
  pricePerSubscriber?: number;
  billingDay?: number;
}

/**
 * Request to add a corporate subscriber
 */
export interface AddCorporateSubscriberRequest {
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

/**
 * Company list response
 */
export interface CompanyListResponse {
  data: CompanyWithMetrics[];
  total: number;
}

/**
 * Company with subscriber metrics
 */
export interface CompanyWithMetrics extends Company {
  contractedQuantity: number;
  activeSubscribers: number;
  monthlyValue: number;
}

/**
 * Company detail response
 */
export interface CompanyDetailResponse {
  company: Company;
  plan: CompanyPlanWithTotal;
  metrics: {
    activeSubscribers: number;
    inactiveSubscribers: number;
    utilizationPercentage: number;
  };
}

/**
 * Company subscribers response
 */
export interface CompanySubscribersResponse {
  data: CorporateSubscriber[];
  total: number;
}

/**
 * Corporate stats response
 */
export interface CompanyStatsResponse {
  totalCompanies: number;
  totalCorporateSubscribers: number;
  corporateMrr: number;
}

// ============ Validation Result Types ============

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
