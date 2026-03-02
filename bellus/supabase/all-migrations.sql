-- ============================================================================
-- BELLUS - ALL MIGRATIONS (combined for SQL Editor)
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============ Migration 001: profissionais ============
CREATE TYPE role_profissional AS ENUM ('proprietario', 'profissional');

CREATE TABLE profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  role role_profissional NOT NULL DEFAULT 'profissional',
  cor_agenda VARCHAR(7) DEFAULT '#C9A96E',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Migration 002: clientes ============
CREATE TYPE idioma AS ENUM ('pt', 'es', 'en', 'ru');

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  idioma_preferido idioma NOT NULL DEFAULT 'es',
  notas TEXT,
  intervalo_retorno_dias INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Migration 003: servicos ============
CREATE TYPE categoria_servico AS ENUM ('corte', 'coloracao', 'mechas', 'tratamento', 'outro');

CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  duracao_minutos INT NOT NULL CHECK (duracao_minutos > 0),
  preco_base DECIMAL(10,2) NOT NULL CHECK (preco_base >= 0),
  categoria categoria_servico NOT NULL DEFAULT 'outro',
  intervalo_retorno_dias INT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE servicos_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  preco_override DECIMAL(10,2) CHECK (preco_override >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_servico_profissional UNIQUE (servico_id, profissional_id)
);

-- ============ Migration 004: agendamentos ============
CREATE TYPE status_agendamento AS ENUM ('pendente', 'confirmado', 'concluido', 'cancelado');

CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE RESTRICT,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ NOT NULL,
  status status_agendamento NOT NULL DEFAULT 'pendente',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_horario CHECK (data_hora_fim > data_hora_inicio)
);

-- ============ Migration 005: pagamentos ============
CREATE TYPE forma_pagamento AS ENUM ('efectivo', 'tarjeta', 'bizum', 'transferencia');
CREATE TYPE tipo_fiscal AS ENUM ('IVA', 'IRPF');

CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE RESTRICT,
  valor_bruto DECIMAL(10,2) NOT NULL CHECK (valor_bruto >= 0),
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  valor_liquido DECIMAL(10,2) NOT NULL CHECK (valor_liquido >= 0),
  iva_pct DECIMAL(5,2) NOT NULL DEFAULT 21.0,
  iva_valor DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (iva_valor >= 0),
  forma_pagamento forma_pagamento NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transacoes_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  trimestre INT NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  ano INT NOT NULL CHECK (ano >= 2024),
  tipo tipo_fiscal NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Migration 006: lembretes ============
CREATE TYPE tipo_notificacao AS ENUM ('confirmacao', 'lembrete_24h', 'lembrete_retorno');
CREATE TYPE status_notificacao AS ENUM ('pendente', 'enviado', 'falhou');

CREATE TABLE lembretes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  intervalo_dias INT NOT NULL CHECK (intervalo_dias > 0),
  template_mensagem TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notificacoes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  tipo tipo_notificacao NOT NULL,
  mensagem TEXT NOT NULL,
  status status_notificacao NOT NULL DEFAULT 'pendente',
  enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Migration 007: Enable RLS ============
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_log ENABLE ROW LEVEL SECURITY;

-- ============ Migration 008: Indexes ============
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora_inicio);
CREATE INDEX idx_agendamentos_profissional_data ON agendamentos(profissional_id, data_hora_inicio);
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_transacoes_fiscais_periodo ON transacoes_fiscais(ano, trimestre);
CREATE INDEX idx_notificacoes_status ON notificacoes_log(status) WHERE status = 'pendente';
CREATE INDEX idx_profissionais_user_id ON profissionais(user_id);

-- ============ Migration 009: Multi-tenant ============
CREATE TABLE saloes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  whatsapp text,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  moeda text NOT NULL DEFAULT 'EUR',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salao_id uuid NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('proprietario', 'profissional', 'cliente')),
  nome text NOT NULL,
  email text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Add salao_id to all existing tables
ALTER TABLE profissionais ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE clientes ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE servicos ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE pagamentos ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE transacoes_fiscais ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE lembretes_config ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE notificacoes_log ADD COLUMN salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;

-- Helper function in public schema (auth schema is restricted in Supabase Dashboard)
CREATE OR REPLACE FUNCTION public.get_salao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT salao_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- Enable RLS on new tables
ALTER TABLE saloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Multi-tenant RLS policies
CREATE POLICY "Users can select own salon" ON saloes
  FOR SELECT USING (id = public.get_salao_id());

CREATE POLICY "Users can select salon members" ON usuarios
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Users can insert into own salon" ON usuarios
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select profissionais" ON profissionais
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert profissionais" ON profissionais
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update own profissional" ON profissionais
  FOR UPDATE USING (salao_id = public.get_salao_id() AND user_id = auth.uid());

CREATE POLICY "Tenant select clientes" ON clientes
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert clientes" ON clientes
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update clientes" ON clientes
  FOR UPDATE USING (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select servicos" ON servicos
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert servicos" ON servicos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update servicos" ON servicos
  FOR UPDATE USING (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select servicos_profissionais" ON servicos_profissionais
  FOR SELECT USING (EXISTS (SELECT 1 FROM profissionais p WHERE p.id = profissional_id AND p.salao_id = public.get_salao_id()));
CREATE POLICY "Tenant insert servicos_profissionais" ON servicos_profissionais
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profissionais p WHERE p.id = profissional_id AND p.salao_id = public.get_salao_id()));

CREATE POLICY "Tenant select agendamentos" ON agendamentos
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update agendamentos" ON agendamentos
  FOR UPDATE USING (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select pagamentos" ON pagamentos
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert pagamentos" ON pagamentos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select transacoes_fiscais" ON transacoes_fiscais
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert transacoes_fiscais" ON transacoes_fiscais
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select lembretes_config" ON lembretes_config
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert lembretes_config" ON lembretes_config
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update lembretes_config" ON lembretes_config
  FOR UPDATE USING (salao_id = public.get_salao_id());

CREATE POLICY "Tenant select notificacoes_log" ON notificacoes_log
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert notificacoes_log" ON notificacoes_log
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update notificacoes_log" ON notificacoes_log
  FOR UPDATE USING (salao_id = public.get_salao_id());

-- Multi-tenant indexes
CREATE INDEX idx_usuarios_salao ON usuarios(salao_id);
CREATE INDEX idx_saloes_slug ON saloes(slug);
CREATE INDEX idx_profissionais_salao ON profissionais(salao_id);
CREATE INDEX idx_clientes_salao ON clientes(salao_id);
CREATE INDEX idx_servicos_salao ON servicos(salao_id);
CREATE INDEX idx_agendamentos_salao ON agendamentos(salao_id);
CREATE INDEX idx_pagamentos_salao ON pagamentos(salao_id);

-- ============ Migration 010: Config salao ============
ALTER TABLE saloes ADD COLUMN logo_url text;
ALTER TABLE saloes ADD COLUMN cor_primaria text NOT NULL DEFAULT '#c9a96e';
ALTER TABLE saloes ADD COLUMN endereco text;
ALTER TABLE saloes ADD COLUMN telefone text;
ALTER TABLE saloes ADD COLUMN horario_funcionamento jsonb DEFAULT '{"seg":{"abre":"09:00","fecha":"19:00"},"ter":{"abre":"09:00","fecha":"19:00"},"qua":{"abre":"09:00","fecha":"19:00"},"qui":{"abre":"09:00","fecha":"19:00"},"sex":{"abre":"09:00","fecha":"19:00"},"sab":{"abre":"09:00","fecha":"14:00"},"dom":null}'::jsonb;
ALTER TABLE saloes ADD COLUMN instagram_url text;
ALTER TABLE saloes ADD COLUMN google_maps_url text;

CREATE POLICY "Owner can update own salon" ON saloes
  FOR UPDATE USING (id = public.get_salao_id());

-- ============ DONE ============
