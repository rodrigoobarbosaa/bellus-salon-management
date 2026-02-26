-- Migration: Create performance indexes
-- Story 1.2 - Task 8 (AC: 12)

-- Agendamentos: busca por data (calendário, agenda diária)
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora_inicio);

-- Agendamentos: agenda do profissional (filtro por profissional + data)
CREATE INDEX idx_agendamentos_profissional_data ON agendamentos(profissional_id, data_hora_inicio);

-- Agendamentos: busca por cliente
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);

-- Clientes: busca por telefone (identificação rápida)
CREATE INDEX idx_clientes_telefone ON clientes(telefone);

-- Transações fiscais: relatório trimestral
CREATE INDEX idx_transacoes_fiscais_periodo ON transacoes_fiscais(ano, trimestre);

-- Notificações: busca por status (processamento de fila)
CREATE INDEX idx_notificacoes_status ON notificacoes_log(status) WHERE status = 'pendente';

-- Profissionais: busca por user_id (auth lookup)
CREATE INDEX idx_profissionais_user_id ON profissionais(user_id);
