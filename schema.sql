-- Tabela principal de comprovantes e faturas
CREATE TABLE IF NOT EXISTS bills (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL, -- CPFL, SABESP, VIVO, OUTROS
  category VARCHAR(32) NOT NULL, -- Luz, Agua, Internet, Outros
  account_number VARCHAR(64),
  reference_month VARCHAR(16) NOT NULL, -- Ex: "10/2026"
  due_date VARCHAR(32) NOT NULL, -- Ex: "20/10/2026"
  amount NUMERIC(10, 2) DEFAULT 0.00,
  barcode TEXT,
  status VARCHAR(20) DEFAULT 'A_VENCER', -- PAGO, A_VENCER, VENCIDO
  original_file_name TEXT NOT NULL,
  stored_file_path TEXT NOT NULL,
  file_url TEXT, -- URL pública ou assinada do PDF no Storage (Supabase Storage / S3)
  file_size BIGINT DEFAULT 0,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(20) DEFAULT 'EMAIL', -- EMAIL, SCRAPING, UPLOAD
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices estratégicos para performance e busca rápida
CREATE INDEX IF NOT EXISTS idx_bills_provider ON bills(provider);
CREATE INDEX IF NOT EXISTS idx_bills_reference_month ON bills(reference_month);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
