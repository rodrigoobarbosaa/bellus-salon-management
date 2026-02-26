-- Migration: Create clientes table
-- Story 1.2 - Task 2 (AC: 2)

-- ENUM for preferred language
CREATE TYPE idioma AS ENUM ('pt', 'es', 'en', 'ru');

-- Clientes table
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  idioma_preferido idioma NOT NULL DEFAULT 'es',
  notas TEXT,
  intervalo_retorno_dias INT, -- NULL = usa o padrão do serviço
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Clientes do salão de beleza';
COMMENT ON COLUMN clientes.idioma_preferido IS 'Idioma para comunicações (WhatsApp, SMS, e-mail)';
COMMENT ON COLUMN clientes.intervalo_retorno_dias IS 'Override do intervalo de retorno — NULL usa padrão do serviço';
