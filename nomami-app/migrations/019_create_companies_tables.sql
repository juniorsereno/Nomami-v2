-- Migration: Create companies tables for corporate plans feature
-- Requirements: 1.3, 1.4, 1.6, 2.4, 6.4

-- Companies table: stores company information
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Company plans table: stores plan configuration for each company
CREATE TABLE IF NOT EXISTS company_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contracted_quantity INTEGER NOT NULL CHECK (contracted_quantity > 0),
  price_per_subscriber DECIMAL(10,2) NOT NULL CHECK (price_per_subscriber >= 0),
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 28),
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id)
);

-- Company plan history table: tracks plan changes over time
CREATE TABLE IF NOT EXISTS company_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contracted_quantity INTEGER NOT NULL,
  price_per_subscriber DECIMAL(10,2) NOT NULL,
  billing_day INTEGER NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by UUID REFERENCES users(id)
);

-- Company billing history table: tracks billing events
CREATE TABLE IF NOT EXISTS company_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  billing_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  subscriber_count INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_company_plans_company_id ON company_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_company_plan_history_company_id ON company_plan_history(company_id);
CREATE INDEX IF NOT EXISTS idx_company_billing_history_company_id ON company_billing_history(company_id);
CREATE INDEX IF NOT EXISTS idx_company_billing_history_status ON company_billing_history(status);
