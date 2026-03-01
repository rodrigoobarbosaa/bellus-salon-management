# EPIC-02 — Agenda & Serviços
**Wave:** 2
**FRs:** FR-01 (Gestão de Agenda), FR-03 (Catálogo de Serviços)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-01
**Status:** Ready

---

## Objetivo

Implementar o calendário de agendamentos e o catálogo de serviços do salão.

## Stories

- [ ] Story 2.1: Schema DB — tabelas: servicos, agendamentos, bloqueios
- [ ] Story 2.2: CRUD de Serviços (nome, duração, preço, categoria, intervalo de retorno)
- [ ] Story 2.3: Calendário visual semanal/diário por profissional
- [ ] Story 2.4: Criar agendamento (modal com seleção de serviço, profissional, horário)
- [ ] Story 2.5: Editar e cancelar agendamentos
- [ ] Story 2.6: Bloqueio de horários e folgas
- [ ] Story 2.7: Status do agendamento (Pendente / Confirmado / Concluído / Cancelado)
- [ ] Story 2.8: Visualização multi-profissional simultânea

## Acceptance Criteria

- [ ] AC-01: Proprietário visualiza calendário semanal com todos os profissionais
- [ ] AC-02: Agendamento criado aparece no calendário em tempo real (Supabase Realtime)
- [ ] AC-03: Conflito de horários bloqueado automaticamente
- [ ] AC-04: Catálogo de serviços CRUD completo com preços e durações
- [ ] AC-05: Intervalo de retorno configurável por serviço

## Notas Técnicas

- Usar FullCalendar ou react-big-calendar para o componente de calendário
- Supabase Realtime para atualizações em tempo real
- Duração do serviço define slots disponíveis no calendário

---
*@pm (Morgan) — 2026-03-01*
