/**
 * Corporate Subscriber queries for Corporate Plans feature
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import sql from '../db-pool';
import type {
  CorporateSubscriber,
  AddCorporateSubscriberRequest,
  CompanySubscribersResponse,
  SubscriberStatus,
} from './types';
import { cleanCpf } from './validation';
import { getCompanyPlan } from './queries';

// ============ Corporate Subscriber CRUD ============

/**
 * Gets all subscribers for a company
 * Requirements: 3.1, 5.4, 5.5, 5.6
 */
export async function getCompanySubscribers(
  companyId: string,
  options: {
    status?: SubscriberStatus | 'all';
    search?: string;
    includeRemoved?: boolean;
  } = {}
): Promise<CompanySubscribersResponse> {
  try {
    const { status = 'all', search = '', includeRemoved = false } = options;

    // Build conditions
    const conditions = [sql`s.company_id = ${companyId}`];
    
    if (!includeRemoved) {
      conditions.push(sql`s.removed_at IS NULL`);
    }
    
    if (status !== 'all') {
      conditions.push(sql`s.status = ${status}`);
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(sql`(s.name ILIKE ${searchTerm} OR s.cpf ILIKE ${searchTerm} OR s.phone ILIKE ${searchTerm})`);
    }

    const whereClause = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) FROM subscribers s WHERE ${whereClause}
    `;
    const total = parseInt(String(countResult[0]?.count ?? '0'), 10);

    // Get subscribers with company name
    const result = await sql`
      SELECT 
        s.id,
        s.name,
        s.cpf,
        s.phone,
        s.email,
        s.company_id,
        c.name as company_name,
        s.subscriber_type,
        s.status,
        s.card_id,
        s.start_date,
        s.next_due_date,
        s.removed_at,
        s.value,
        s.plan_type
      FROM subscribers s
      LEFT JOIN companies c ON c.id = s.company_id
      WHERE ${whereClause}
      ORDER BY s.name ASC
    `;

    return {
      data: result.map(mapCorporateSubscriberRow),
      total,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company subscribers.');
  }
}

/**
 * Gets a corporate subscriber by ID
 */
export async function getCorporateSubscriberById(
  subscriberId: string
): Promise<CorporateSubscriber | null> {
  try {
    const result = await sql`
      SELECT 
        s.id,
        s.name,
        s.cpf,
        s.phone,
        s.email,
        s.company_id,
        c.name as company_name,
        s.subscriber_type,
        s.status,
        s.card_id,
        s.start_date,
        s.next_due_date,
        s.removed_at,
        s.value,
        s.plan_type
      FROM subscribers s
      LEFT JOIN companies c ON c.id = s.company_id
      WHERE s.id = ${subscriberId}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapCorporateSubscriberRow(result[0]);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch corporate subscriber.');
  }
}

/**
 * Gets a corporate subscriber by CPF within a company
 */
export async function getCorporateSubscriberByCpf(
  companyId: string,
  cpf: string
): Promise<CorporateSubscriber | null> {
  try {
    const cleanedCpf = cleanCpf(cpf);
    const result = await sql`
      SELECT 
        s.id,
        s.name,
        s.cpf,
        s.phone,
        s.email,
        s.company_id,
        c.name as company_name,
        s.subscriber_type,
        s.status,
        s.card_id,
        s.start_date,
        s.next_due_date,
        s.removed_at,
        s.value,
        s.plan_type
      FROM subscribers s
      LEFT JOIN companies c ON c.id = s.company_id
      WHERE s.company_id = ${companyId} AND s.cpf = ${cleanedCpf}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapCorporateSubscriberRow(result[0]);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch corporate subscriber by CPF.');
  }
}

/**
 * Adds a corporate subscriber to a company
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
export async function addCorporateSubscriber(
  companyId: string,
  request: AddCorporateSubscriberRequest
): Promise<{ subscriber: CorporateSubscriber; warning?: string }> {
  try {
    const cleanedCpf = cleanCpf(request.cpf);

    // Check if subscriber with same CPF already exists in this company
    const existing = await sql`
      SELECT id FROM subscribers 
      WHERE company_id = ${companyId} AND cpf = ${cleanedCpf} AND removed_at IS NULL
    `;

    if (existing.length > 0) {
      throw new Error('DUPLICATE_CPF');
    }

    // Get company plan to inherit billing date
    const plan = await getCompanyPlan(companyId);
    if (!plan) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    // Check company status
    const companyResult = await sql`
      SELECT status FROM companies WHERE id = ${companyId}
    `;
    
    if (companyResult.length === 0) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    if (companyResult[0].status === 'cancelled') {
      throw new Error('COMPANY_CANCELLED');
    }

    // Generate unique card_id
    const cardId = generateCardId();

    // Inherit next_due_date from company's next_billing_date
    const nextDueDate = plan.nextBillingDate;

    // Create subscriber
    const result = await sql`
      INSERT INTO subscribers (
        name, cpf, phone, email, company_id, subscriber_type, 
        status, card_id, start_date, next_due_date, plan_type, value
      )
      VALUES (
        ${request.name},
        ${cleanedCpf},
        ${request.phone},
        ${request.email},
        ${companyId},
        'corporate',
        'ativo',
        ${cardId},
        CURRENT_DATE,
        ${nextDueDate.toISOString().split('T')[0]},
        'corporativo',
        ${plan.pricePerSubscriber}
      )
      RETURNING *
    `;

    // Get company name for response
    const companyNameResult = await sql`
      SELECT name FROM companies WHERE id = ${companyId}
    `;

    const subscriber = mapCorporateSubscriberRow({
      ...result[0],
      company_name: companyNameResult[0]?.name,
    });

    // Check if exceeding contracted quantity
    const activeCountResult = await sql`
      SELECT COUNT(*) FROM subscribers 
      WHERE company_id = ${companyId} AND status = 'ativo' AND removed_at IS NULL
    `;
    const activeCount = parseInt(String(activeCountResult[0]?.count ?? '0'), 10);

    let warning: string | undefined;
    if (activeCount > plan.contractedQuantity) {
      warning = 'OVER_CONTRACTED_QUANTITY';
    }

    return { subscriber, warning };
  } catch (error) {
    console.error('Database Error:', error);
    if (error instanceof Error) {
      if (['DUPLICATE_CPF', 'COMPANY_NOT_FOUND', 'COMPANY_CANCELLED'].includes(error.message)) {
        throw error;
      }
    }
    throw new Error('Failed to add corporate subscriber.');
  }
}

/**
 * Adds multiple corporate subscribers to a company
 */
export async function addCorporateSubscribersBatch(
  companyId: string,
  subscribers: AddCorporateSubscriberRequest[]
): Promise<{ 
  successCount: number; 
  errors: { cpf: string; error: string }[];
  warning?: string;
}> {
  try {
    // Get company plan
    const plan = await getCompanyPlan(companyId);
    if (!plan) throw new Error('COMPANY_NOT_FOUND');

    // Check company status
    const companyResult = await sql`SELECT status FROM companies WHERE id = ${companyId}`;
    if (companyResult.length === 0) throw new Error('COMPANY_NOT_FOUND');
    if (companyResult[0].status === 'cancelled') throw new Error('COMPANY_CANCELLED');

    const nextDueDateStr = plan.nextBillingDate.toISOString().split('T')[0];
    const results = {
      successCount: 0,
      errors: [] as { cpf: string; error: string }[]
    };

    // Process each subscriber
    // Note: In a high-scale environment, this should be a transaction or bulk insert
    // But to maintain logic consistency (CPF checks, card_id generation) and given small batch sizes, 
    // we process them sequentially or with Promise.all for simplicity.
    
    for (const req of subscribers) {
      try {
        const cleanedCpf = cleanCpf(req.cpf);
        
        // Duplicate check
        const existing = await sql`
          SELECT id FROM subscribers 
          WHERE company_id = ${companyId} AND cpf = ${cleanedCpf} AND removed_at IS NULL
        `;
        if (existing.length > 0) {
          results.errors.push({ cpf: req.cpf, error: 'CPF já cadastrado' });
          continue;
        }

        const cardId = generateCardId();

        await sql`
          INSERT INTO subscribers (
            name, cpf, phone, email, company_id, subscriber_type, 
            status, card_id, start_date, next_due_date, plan_type, value
          )
          VALUES (
            ${req.name},
            ${cleanedCpf},
            ${req.phone},
            ${req.email},
            ${companyId},
            'corporate',
            'ativo',
            ${cardId},
            CURRENT_DATE,
            ${nextDueDateStr},
            'corporativo',
            ${plan.pricePerSubscriber}
          )
        `;
        results.successCount++;
      } catch (err) {
        results.errors.push({ 
          cpf: req.cpf, 
          error: err instanceof Error ? err.message : 'Erro desconhecido' 
        });
      }
    }

    // Check capacity warning
    const activeCountResult = await sql`
      SELECT COUNT(*) FROM subscribers 
      WHERE company_id = ${companyId} AND status = 'ativo' AND removed_at IS NULL
    `;
    const activeCount = parseInt(String(activeCountResult[0]?.count ?? '0'), 10);
    
    let warning: string | undefined;
    if (activeCount > plan.contractedQuantity) {
      warning = 'OVER_CONTRACTED_QUANTITY';
    }

    return { ...results, warning };
  } catch (error) {
    console.error('Batch Database Error:', error);
    throw error;
  }
}

/**
 * Removes a corporate subscriber (soft delete)
 * Requirements: 3.6, 3.7
 */
export async function removeCorporateSubscriber(
  companyId: string,
  subscriberId: string
): Promise<CorporateSubscriber> {
  try {
    // Verify subscriber belongs to company
    const existing = await sql`
      SELECT id, status, removed_at FROM subscribers 
      WHERE id = ${subscriberId} AND company_id = ${companyId}
    `;

    if (existing.length === 0) {
      throw new Error('SUBSCRIBER_NOT_FOUND');
    }

    if (existing[0].removed_at !== null) {
      throw new Error('SUBSCRIBER_ALREADY_INACTIVE');
    }

    // Soft delete: set status to 'inativo' and record removal date
    const result = await sql`
      UPDATE subscribers
      SET status = 'inativo', removed_at = CURRENT_TIMESTAMP
      WHERE id = ${subscriberId}
      RETURNING *
    `;

    // Get company name for response
    const companyNameResult = await sql`
      SELECT name FROM companies WHERE id = ${companyId}
    `;

    return mapCorporateSubscriberRow({
      ...result[0],
      company_name: companyNameResult[0]?.name,
    });
  } catch (error) {
    console.error('Database Error:', error);
    if (error instanceof Error) {
      if (['SUBSCRIBER_NOT_FOUND', 'SUBSCRIBER_ALREADY_INACTIVE'].includes(error.message)) {
        throw error;
      }
    }
    throw new Error('Failed to remove corporate subscriber.');
  }
}

/**
 * Gets active subscriber count for a company
 */
export async function getActiveSubscriberCount(companyId: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) FROM subscribers 
      WHERE company_id = ${companyId} AND status = 'ativo' AND removed_at IS NULL
    `;
    return parseInt(String(result[0]?.count ?? '0'), 10);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch active subscriber count.');
  }
}

/**
 * Deactivates all subscribers for a company (used when company is cancelled)
 * Requirements: 9.6
 */
export async function deactivateAllCompanySubscribers(companyId: string): Promise<number> {
  try {
    const result = await sql`
      UPDATE subscribers
      SET status = 'inativo', removed_at = CURRENT_TIMESTAMP
      WHERE company_id = ${companyId} AND status = 'ativo' AND removed_at IS NULL
      RETURNING id
    `;
    return result.length;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to deactivate company subscribers.');
  }
}

// ============ Helper Functions ============

/**
 * Generates a unique card ID
 * Format: 8 character alphanumeric string
 */
function generateCardId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Maps database row to CorporateSubscriber type
 */
function mapCorporateSubscriberRow(row: Record<string, unknown>): CorporateSubscriber {
  return {
    id: String(row.id),
    name: String(row.name),
    cpf: String(row.cpf),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    companyId: String(row.company_id),
    companyName: row.company_name ? String(row.company_name) : undefined,
    subscriberType: 'corporate',
    status: String(row.status) as SubscriberStatus,
    cardId: String(row.card_id),
    startDate: new Date(String(row.start_date)),
    nextDueDate: new Date(String(row.next_due_date)),
    removedAt: row.removed_at ? new Date(String(row.removed_at)) : undefined,
    value: row.value ? parseFloat(String(row.value)) : undefined,
    planType: row.plan_type ? String(row.plan_type) : undefined,
  };
}
