-- Seed: Dados de desenvolvimento para o Bellus
-- Story 1.2 - Task 9 (AC: 14)
-- GDPR-safe: todos os dados são fictícios

-- ============================================================
-- Profissionais (2): proprietário + cabeleireiro
-- ============================================================
-- Nota: user_id será NULL no seed pois depende de auth.users (Supabase Auth)
-- Em dev, criar os usuários manualmente via Supabase Studio ou Auth API

INSERT INTO profissionais (id, nome, email, telefone, role, cor_agenda, ativo)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'María García López', 'maria@bellus.dev', '+34 612 345 678', 'proprietario', '#C9A96E', true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Carlos Fernández Ruiz', 'carlos@bellus.dev', '+34 623 456 789', 'profissional', '#4A90D9', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Serviços (5): catálogo base do salão
-- ============================================================

INSERT INTO servicos (id, nome, descricao, duracao_minutos, preco_base, categoria, intervalo_retorno_dias, ativo)
VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Corte Hombre', 'Corte masculino clásico o moderno', 30, 15.00, 'corte', 30, true),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Corte Mujer', 'Corte femenino con lavado y secado', 60, 25.00, 'corte', 45, true),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Mechas', 'Mechas balayage o highlights', 120, 65.00, 'mechas', 60, true),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Coloración', 'Tinte completo con tratamiento', 90, 45.00, 'coloracao', 45, true),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'Hidratación', 'Tratamiento hidratante profundo', 45, 30.00, 'tratamento', 30, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Serviços por profissional (ambos fazem todos os serviços)
-- ============================================================

INSERT INTO servicos_profissionais (servico_id, profissional_id, preco_override)
VALUES
  -- María (proprietária) — preços padrão
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL),
  -- Carlos — com override no corte masculino (preço mais baixo)
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 12.00),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NULL),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NULL),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NULL),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Clientes (3): dados fictícios GDPR-safe
-- ============================================================

INSERT INTO clientes (id, nome, email, telefone, idioma_preferido, notas, intervalo_retorno_dias)
VALUES
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'Ana Martínez Soto', 'ana.martinez@example.com', '+34 634 567 890', 'es', 'Prefiere horario de mañana', NULL),
  ('c9d0e1f2-a3b4-5678-cdef-789012345678', 'João Pedro Silva', 'joao.silva@example.com', '+34 645 678 901', 'pt', 'Cliente regular, viene cada 3 semanas', 21),
  ('d0e1f2a3-b4c5-6789-defa-890123456789', 'Elena Petrova', 'elena.p@example.com', '+34 656 789 012', 'ru', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Agendamentos (10): próximos 7 dias
-- ============================================================

INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, data_hora_inicio, data_hora_fim, status, notas)
VALUES
  -- Hoje
  (gen_random_uuid(), 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123',
   CURRENT_DATE + INTERVAL '9 hours', CURRENT_DATE + INTERVAL '10 hours', 'confirmado', NULL),
  (gen_random_uuid(), 'c9d0e1f2-a3b4-5678-cdef-789012345678', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   CURRENT_DATE + INTERVAL '10 hours', CURRENT_DATE + INTERVAL '10 hours 30 minutes', 'confirmado', NULL),
  -- Mañana
  (gen_random_uuid(), 'd0e1f2a3-b4c5-6789-defa-890123456789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-345678901234',
   CURRENT_DATE + INTERVAL '1 day 11 hours', CURRENT_DATE + INTERVAL '1 day 13 hours', 'pendente', 'Primera vez mechas'),
  (gen_random_uuid(), 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'a7b8c9d0-e1f2-3456-abcd-567890123456',
   CURRENT_DATE + INTERVAL '1 day 15 hours', CURRENT_DATE + INTERVAL '1 day 15 hours 45 minutes', 'pendente', NULL),
  -- Día 3
  (gen_random_uuid(), 'c9d0e1f2-a3b4-5678-cdef-789012345678', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f6a7b8c9-d0e1-2345-fabc-456789012345',
   CURRENT_DATE + INTERVAL '2 days 10 hours', CURRENT_DATE + INTERVAL '2 days 11 hours 30 minutes', 'pendente', 'Coloración castaño oscuro'),
  -- Día 4
  (gen_random_uuid(), 'd0e1f2a3-b4c5-6789-defa-890123456789', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'd4e5f6a7-b8c9-0123-defa-234567890123',
   CURRENT_DATE + INTERVAL '3 days 9 hours', CURRENT_DATE + INTERVAL '3 days 10 hours', 'pendente', NULL),
  -- Día 5
  (gen_random_uuid(), 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   CURRENT_DATE + INTERVAL '4 days 16 hours', CURRENT_DATE + INTERVAL '4 days 16 hours 30 minutes', 'pendente', NULL),
  (gen_random_uuid(), 'c9d0e1f2-a3b4-5678-cdef-789012345678', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'a7b8c9d0-e1f2-3456-abcd-567890123456',
   CURRENT_DATE + INTERVAL '4 days 11 hours', CURRENT_DATE + INTERVAL '4 days 11 hours 45 minutes', 'pendente', NULL),
  -- Día 6
  (gen_random_uuid(), 'd0e1f2a3-b4c5-6789-defa-890123456789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-345678901234',
   CURRENT_DATE + INTERVAL '5 days 10 hours', CURRENT_DATE + INTERVAL '5 days 12 hours', 'pendente', 'Mechas rubias'),
  -- Día 7
  (gen_random_uuid(), 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f6a7b8c9-d0e1-2345-fabc-456789012345',
   CURRENT_DATE + INTERVAL '6 days 14 hours', CURRENT_DATE + INTERVAL '6 days 15 hours 30 minutes', 'pendente', NULL)
ON CONFLICT DO NOTHING;
