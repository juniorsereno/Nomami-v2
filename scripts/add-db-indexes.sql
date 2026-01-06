-- Script para adicionar índices de otimização no banco de dados
-- Execute este script no seu banco Neon Postgres

-- Índices para tabela subscribers (mais usada)
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_start_date ON subscribers(start_date);
CREATE INDEX IF NOT EXISTS idx_subscribers_next_due_date ON subscribers(next_due_date);
CREATE INDEX IF NOT EXISTS idx_subscribers_status_plan ON subscribers(status, plan_type);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);

-- Índices para buscas por nome, telefone e email (usando LOWER para case-insensitive)
CREATE INDEX IF NOT EXISTS idx_subscribers_name_lower ON subscribers(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Índices para tabela parceiros
CREATE INDEX IF NOT EXISTS idx_parceiros_ativo ON parceiros(ativo);
CREATE INDEX IF NOT EXISTS idx_parceiros_categoria ON parceiros(categoria);

-- Índices para tabela users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo);

-- Índices para tabela telemedicine_batches
CREATE INDEX IF NOT EXISTS idx_telemedicine_batches_status ON telemedicine_batches(status);
CREATE INDEX IF NOT EXISTS idx_telemedicine_batches_created_at ON telemedicine_batches(created_at);

-- Índices para tabela telemedicine_clients
CREATE INDEX IF NOT EXISTS idx_telemedicine_clients_batch_id ON telemedicine_clients(batch_id);

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
