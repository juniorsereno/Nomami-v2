-- Tabela de Assinantes
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255),
    cpf VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    plan_type VARCHAR(255),
    start_date TIMESTAMP,
    next_due_date TIMESTAMP,
    status VARCHAR(255),
    value NUMERIC,
    asaas_customer_id VARCHAR(255)
);

-- Tabela de Lotes de Telemedicina
CREATE TABLE IF NOT EXISTS telemedicine_batches (
    id SERIAL PRIMARY KEY,
    batch_identifier TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes de Telemedicina
CREATE TABLE IF NOT EXISTS telemedicine_clients (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES telemedicine_batches(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    birth_date VARCHAR(10) NOT NULL,
    gender VARCHAR(1) NOT NULL,
    cellphone VARCHAR(11) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Outras tabelas que podem ser necessárias (baseado nos arquivos do projeto)
CREATE TABLE IF NOT EXISTS asaas_webhook_logs (
    id SERIAL PRIMARY KEY,
    request_body JSONB,
    status VARCHAR(50),
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parceiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(255) UNIQUE NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    beneficio TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS parceiro_contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'telefone', 'email', etc.
    valor VARCHAR(255) NOT NULL,
    is_principal BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS parceiro_enderecos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    is_principal BOOLEAN DEFAULT false
);