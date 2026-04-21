-- Allow multiple services per appointment
-- Primary service stays in servico_id; extras stored here
ALTER TABLE agendamentos
  ADD COLUMN servicos_adicionais UUID[] DEFAULT '{}';
