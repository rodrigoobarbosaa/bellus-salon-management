-- Migration: Create profissionais table
-- Story 1.2 - Task 1 (AC: 1)
-- Depends on: auth.users (Supabase Auth)

-- ENUM for professional role
CREATE TYPE role_profissional AS ENUM ('proprietario', 'profissional');

-- Profissionais table (1:1 with auth.users)
CREATE TABLE profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  role role_profissional NOT NULL DEFAULT 'profissional',
  cor_agenda VARCHAR(7) DEFAULT '#C9A96E', -- Bellus gold default
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profissionais IS 'Profissionais do salão (cabeleireiros, proprietários)';
COMMENT ON COLUMN profissionais.user_id IS 'FK para auth.users — login via Supabase Auth';
COMMENT ON COLUMN profissionais.cor_agenda IS 'Cor hex para identificação na agenda visual';
COMMENT ON COLUMN profissionais.role IS 'proprietario: acesso total | profissional: acesso limitado';
