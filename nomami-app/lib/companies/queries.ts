/**
 * Company queries for Corporate Plans feature
 * Requirements: 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 9.3
 */

import sql from '../db-pool';
import type {
  Company,
  CompanyPlan,
  CompanyPlanWithTotal,
  CompanyPlanHistory,
  CompanyWithMetrics,
  CompanyStatsResponse,
  CompanyDetailResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  UpdatePlanRequest,
  CompanyStatus,
} from './types';
import { cleanCnpj } from './validation';
import { calculateMonthlyValue, calculateNextBillingDate, calculateUtilization } from './billing';

// ============ Company CRUD ============

/**
 * Creates a new company with its plan
 * Requirements: 1.3, 1.4, 1.6
 */
export async function createCompany(
  request: CreateCompanyRequest,
  createdBy?: string
): Promise<{ company: Company; plan: CompanyPlan }> {
  try {
    const cleanedCnpj = cleanCnpj(request.cnpj);
    
    // Check for duplicate CNPJ
    const existing = await sql`
      SELECT id FROM companies WHERE cnpj = ${cleanedCnpj}
    `;
    
    if (existing.length > 0) {
      throw new Error('DUPLICATE_CNPJ');
    }

    // Create company
    const companyResult = await sql`
      INSERT INTO companies (name, cnpj, contact_email, contact_phone, contact_person, status, created_by)
      VALUES (
        ${request.name},
        ${cleanedCnpj},
        ${request.contactEmail},
        ${request.contactPhone},
        ${request.contactPerson},
        'active',
        ${createdBy || null}
      )
      RETURNING *
    `;

    const company = mapCompanyRow(companyResult[0]);

    // Calculate next billing date
    const startDate = new Date(request.plan.startDate);
    const nextBillingDate = calculateNextBillingDate(request.plan.billingDay, startDate);

    // Create plan
    const planResult = await sql`
      INSERT INTO company_plans (
        company_id, contracted_quantity, price_per_subscriber, 
        billing_day, start_date, next_billing_date, status
      )
      VALUES (
        ${company.id},
        ${request.plan.contractedQuantity},
        ${request.plan.pricePerSubscriber},
        ${request.plan.billingDay},
        ${request.plan.startDate},
        ${nextBillingDate.toISOString().split('T')[0]},
        'active'
      )
      RETURNING *
    `;

    const plan = mapPlanRow(planResult[0]);

    return { company, plan };
  } catch (error) {
    console.error('Database Error:', error);
    if (error instanceof Error && error.message === 'DUPLICATE_CNPJ') {
      throw error;
    }
    throw new Error('Failed to create company.');
  }
}

/**
 * Gets all companies with metrics
 * Requirements: 4.4, 4.5
 */
export async function getCompanies(): Promise<CompanyWithMetrics[]> {
  try {
    const result = await sql`
      SELECT 
        c.*,
        cp.contracted_quantity,
        cp.price_per_subscriber,
        COALESCE(
          (SELECT COUNT(*) FROM subscribers s 
           WHERE s.company_id = c.id AND s.status = 'ativo' AND s.removed_at IS NULL),
          0
        ) as active_subscribers
      FROM companies c
      LEFT JOIN company_plans cp ON cp.company_id = c.id
      ORDER BY c.name ASC
    `;

    return result.map((row: Record<string, unknown>) => ({
      ...mapCompanyRow(row),
      contractedQuantity: parseInt(String(row.contracted_quantity ?? '0'), 10),
      activeSubscribers: parseInt(String(row.active_subscribers ?? '0'), 10),
      monthlyValue: calculateMonthlyValue(
        parseInt(String(row.contracted_quantity ?? '0'), 10),
        parseFloat(String(row.price_per_subscriber ?? '0'))
      ),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch companies.');
  }
}

/**
 * Gets a company by ID with full details
 * Requirements: 5.1, 5.2, 5.3
 */
export async function getCompanyById(id: string): Promise<CompanyDetailResponse | null> {
  try {
    // Get company
    const companyResult = await sql`
      SELECT * FROM companies WHERE id = ${id}
    `;

    if (companyResult.length === 0) {
      return null;
    }

    const company = mapCompanyRow(companyResult[0]);

    // Get plan
    const planResult = await sql`
      SELECT * FROM company_plans WHERE company_id = ${id}
    `;

    const plan = planResult.length > 0 ? mapPlanRowWithTotal(planResult[0]) : null;

    // Get subscriber metrics
    const metricsResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'ativo' AND removed_at IS NULL) as active_count,
        COUNT(*) FILTER (WHERE status = 'inativo' OR removed_at IS NOT NULL) as inactive_count
      FROM subscribers
      WHERE company_id = ${id}
    `;

    const activeSubscribers = parseInt(String(metricsResult[0]?.active_count ?? '0'), 10);
    const inactiveSubscribers = parseInt(String(metricsResult[0]?.inactive_count ?? '0'), 10);
    const contractedQuantity = plan?.contractedQuantity ?? 0;

    return {
      company,
      plan: plan!,
      metrics: {
        activeSubscribers,
        inactiveSubscribers,
        utilizationPercentage: calculateUtilization(activeSubscribers, contractedQuantity),
      },
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company.');
  }
}

/**
 * Gets a company by CNPJ
 */
export async function getCompanyByCnpj(cnpj: string): Promise<Company | null> {
  try {
    const cleanedCnpj = cleanCnpj(cnpj);
    const result = await sql`
      SELECT * FROM companies WHERE cnpj = ${cleanedCnpj}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapCompanyRow(result[0]);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company by CNPJ.');
  }
}

/**
 * Updates a company
 * Requirements: 9.3
 */
export async function updateCompany(
  id: string,
  request: UpdateCompanyRequest
): Promise<Company> {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (request.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(request.name);
    }
    if (request.contactEmail !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(request.contactEmail);
    }
    if (request.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(request.contactPhone);
    }
    if (request.contactPerson !== undefined) {
      updates.push(`contact_person = $${paramIndex++}`);
      values.push(request.contactPerson);
    }
    if (request.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(request.status);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    // Use tagged template for simple update
    const result = await sql`
      UPDATE companies 
      SET 
        name = COALESCE(${request.name}, name),
        contact_email = COALESCE(${request.contactEmail}, contact_email),
        contact_phone = COALESCE(${request.contactPhone}, contact_phone),
        contact_person = COALESCE(${request.contactPerson}, contact_person),
        status = COALESCE(${request.status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    // Handle cascade for cancelled status
    if (request.status === 'cancelled') {
      await sql`
        UPDATE subscribers 
        SET status = 'inativo', removed_at = CURRENT_TIMESTAMP
        WHERE company_id = ${id} AND status = 'ativo'
      `;
    }

    return mapCompanyRow(result[0]);
  } catch (error) {
    console.error('Database Error:', error);
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      throw error;
    }
    throw new Error('Failed to update company.');
  }
}

/**
 * Soft deletes a company (sets status to cancelled)
 */
export async function deleteCompany(id: string): Promise<void> {
  try {
    await updateCompany(id, { status: 'cancelled' });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete company.');
  }
}

// ============ Company Stats ============

/**
 * Gets corporate statistics
 * Requirements: 4.1, 4.2, 4.3
 */
export async function getCompanyStats(): Promise<CompanyStatsResponse> {
  try {
    const companiesResult = await sql`
      SELECT COUNT(*) FROM companies WHERE status = 'active'
    `;

    const subscribersResult = await sql`
      SELECT COUNT(*) FROM subscribers 
      WHERE subscriber_type = 'corporate' AND status = 'ativo' AND removed_at IS NULL
    `;

    const mrrResult = await sql`
      SELECT SUM(cp.contracted_quantity * cp.price_per_subscriber) as mrr
      FROM company_plans cp
      JOIN companies c ON c.id = cp.company_id
      WHERE c.status = 'active' AND cp.status = 'active'
    `;

    return {
      totalCompanies: parseInt(String(companiesResult[0]?.count ?? '0'), 10),
      totalCorporateSubscribers: parseInt(String(subscribersResult[0]?.count ?? '0'), 10),
      corporateMrr: parseFloat(String(mrrResult[0]?.mrr ?? '0')),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company stats.');
  }
}


// ============ Company Plan Queries ============

/**
 * Gets a company's plan
 */
export async function getCompanyPlan(companyId: string): Promise<CompanyPlanWithTotal | null> {
  try {
    const result = await sql`
      SELECT * FROM company_plans WHERE company_id = ${companyId}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapPlanRowWithTotal(result[0]);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company plan.');
  }
}

/**
 * Updates a company's plan and creates history record
 * Requirements: 2.4, 2.5
 */
export async function updateCompanyPlan(
  companyId: string,
  request: UpdatePlanRequest,
  changedBy?: string
): Promise<CompanyPlanWithTotal> {
  try {
    // Get current plan for history
    const currentPlan = await getCompanyPlan(companyId);
    
    if (!currentPlan) {
      throw new Error('PLAN_NOT_FOUND');
    }

    // Create history record before update
    await sql`
      INSERT INTO company_plan_history (
        company_id, contracted_quantity, price_per_subscriber, billing_day, changed_by
      )
      VALUES (
        ${companyId},
        ${currentPlan.contractedQuantity},
        ${currentPlan.pricePerSubscriber},
        ${currentPlan.billingDay},
        ${changedBy || null}
      )
    `;

    // Calculate new next billing date if billing day changed
    let nextBillingDate = currentPlan.nextBillingDate;
    if (request.billingDay !== undefined && request.billingDay !== currentPlan.billingDay) {
      nextBillingDate = calculateNextBillingDate(request.billingDay);
    }

    // Update plan
    const result = await sql`
      UPDATE company_plans
      SET 
        contracted_quantity = COALESCE(${request.contractedQuantity}, contracted_quantity),
        price_per_subscriber = COALESCE(${request.pricePerSubscriber}, price_per_subscriber),
        billing_day = COALESCE(${request.billingDay}, billing_day),
        next_billing_date = ${nextBillingDate.toISOString().split('T')[0]},
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ${companyId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('PLAN_NOT_FOUND');
    }

    return mapPlanRowWithTotal(result[0]);
  } catch (error) {
    console.error('Database Error:', error);
    if (error instanceof Error && error.message === 'PLAN_NOT_FOUND') {
      throw error;
    }
    throw new Error('Failed to update company plan.');
  }
}

/**
 * Gets plan history for a company
 * Requirements: 2.4
 */
export async function getPlanHistory(companyId: string): Promise<CompanyPlanHistory[]> {
  try {
    const result = await sql`
      SELECT * FROM company_plan_history 
      WHERE company_id = ${companyId}
      ORDER BY changed_at DESC
    `;

    return result.map(mapPlanHistoryRow);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch plan history.');
  }
}

/**
 * Gets the count of plan history records for a company
 */
export async function getPlanHistoryCount(companyId: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) FROM company_plan_history WHERE company_id = ${companyId}
    `;
    return parseInt(String(result[0]?.count ?? '0'), 10);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch plan history count.');
  }
}

// ============ Row Mappers ============

function mapCompanyRow(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    cnpj: String(row.cnpj),
    contactEmail: String(row.contact_email),
    contactPhone: String(row.contact_phone),
    contactPerson: String(row.contact_person),
    status: String(row.status) as CompanyStatus,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    createdBy: row.created_by ? String(row.created_by) : undefined,
  };
}

function mapPlanRow(row: Record<string, unknown>): CompanyPlan {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    contractedQuantity: parseInt(String(row.contracted_quantity), 10),
    pricePerSubscriber: parseFloat(String(row.price_per_subscriber)),
    billingDay: parseInt(String(row.billing_day), 10),
    startDate: new Date(String(row.start_date)),
    nextBillingDate: new Date(String(row.next_billing_date)),
    status: String(row.status) as CompanyStatus,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

function mapPlanRowWithTotal(row: Record<string, unknown>): CompanyPlanWithTotal {
  const plan = mapPlanRow(row);
  return {
    ...plan,
    totalMonthlyValue: calculateMonthlyValue(plan.contractedQuantity, plan.pricePerSubscriber),
  };
}

function mapPlanHistoryRow(row: Record<string, unknown>): CompanyPlanHistory {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    contractedQuantity: parseInt(String(row.contracted_quantity), 10),
    pricePerSubscriber: parseFloat(String(row.price_per_subscriber)),
    billingDay: parseInt(String(row.billing_day), 10),
    changedAt: new Date(String(row.changed_at)),
    changedBy: row.changed_by ? String(row.changed_by) : undefined,
  };
}
