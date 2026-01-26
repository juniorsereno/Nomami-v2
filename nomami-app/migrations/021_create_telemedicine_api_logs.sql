-- Tabela para armazenar logs das chamadas à API de telemedicina
CREATE TABLE IF NOT EXISTS telemedicine_api_logs (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES telemedicine_batches(id) ON DELETE CASCADE,
  request_body JSONB NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para buscar logs por lote
CREATE INDEX IF NOT EXISTS idx_telemedicine_api_logs_batch_id ON telemedicine_api_logs(batch_id);

-- Índice para buscar logs por data
CREATE INDEX IF NOT EXISTS idx_telemedicine_api_logs_created_at ON telemedicine_api_logs(created_at);
