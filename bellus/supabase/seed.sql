-- ============================================================================
-- SEED DATA: Tati Rodri Hair Studio
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. Create the salon
INSERT INTO saloes (id, nome, slug, whatsapp, timezone, moeda)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Tati Rodri Hair Studio',
  'tati-rodri',
  NULL,
  'Europe/Madrid',
  'EUR'
) ON CONFLICT (id) DO NOTHING;

-- 2. Link the auth user to the salon (usuarios table)
INSERT INTO usuarios (id, salao_id, role, nome, email)
VALUES (
  'ed561d4d-2154-4bf3-9e36-6112c2c2ca8c',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'proprietario',
  'Tati Rodri',
  'tatirodrihairstudio@gmail.com'
) ON CONFLICT (id) DO NOTHING;

-- 3. Create client record
INSERT INTO clientes (id, nome, email, telefone, idioma_preferido, salao_id)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'Tati Rodri',
  'tatirodrihairstudio@gmail.com',
  '+34600000000',
  'pt',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
) ON CONFLICT (id) DO NOTHING;

-- 4. Create professional (owner)
INSERT INTO profissionais (id, user_id, nome, email, telefone, role, ativo, salao_id)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'ed561d4d-2154-4bf3-9e36-6112c2c2ca8c',
  'Tati Rodri',
  'tatirodrihairstudio@gmail.com',
  '+34600000000',
  'proprietario',
  true,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
) ON CONFLICT (id) DO NOTHING;

-- 5. Create services (typical hair salon)
INSERT INTO servicos (id, nome, descricao, duracao_minutos, preco_base, categoria, ativo, salao_id) VALUES
  ('b1111111-0001-1111-1111-111111111111', 'Corte Feminino',      'Corte feminino com lavagem e finalização',       60,  35.00, 'corte',      true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('b1111111-0002-1111-1111-111111111111', 'Corte Masculino',     'Corte masculino clássico',                       30,  20.00, 'corte',      true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('b1111111-0003-1111-1111-111111111111', 'Coloração',           'Coloração completa com produto profissional',    120,  65.00, 'coloracao',  true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('b1111111-0004-1111-1111-111111111111', 'Mechas / Highlights', 'Mechas ou luzes com balayage',                   150,  90.00, 'mechas',     true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('b1111111-0005-1111-1111-111111111111', 'Escova / Brushing',   'Escova modelada com secador',                     45,  25.00, 'outro',      true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('b1111111-0006-1111-1111-111111111111', 'Tratamento Capilar',  'Hidratação profunda com máscara profissional',    60,  40.00, 'tratamento', true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('b1111111-0007-1111-1111-111111111111', 'Corte + Coloração',   'Pacote corte feminino + coloração completa',     150,  85.00, 'coloracao',  true, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- 6. Link all services to the professional
INSERT INTO servicos_profissionais (servico_id, profissional_id) VALUES
  ('b1111111-0001-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b1111111-0002-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b1111111-0003-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b1111111-0004-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b1111111-0005-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b1111111-0006-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b1111111-0007-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT ON CONSTRAINT uq_servico_profissional DO NOTHING;
