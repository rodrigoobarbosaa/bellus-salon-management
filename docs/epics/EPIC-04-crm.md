# EPIC-04 — CRM & Fidelização
**Wave:** 4
**FRs:** FR-04 (Ficha do Cliente), FR-08 (Lembretes de Retorno)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-03
**Status:** Ready

---

## Objetivo

Gestão completa de clientes com histórico de visitas e sistema automático de fidelização por lembretes de retorno.

## Stories

- [ ] Story 4.1: Schema DB — tabela clientes com campos completos
- [ ] Story 4.2: Ficha do cliente (cadastro, histórico, notas, preferências)
- [ ] Story 4.3: Histórico de visitas com serviços e valores
- [ ] Story 4.4: Intervalo de retorno por cliente (override do padrão do serviço)
- [ ] Story 4.5: Motor de lembretes de retorno (verificação diária)
- [ ] Story 4.6: Envio automático de WhatsApp de retorno
- [ ] Story 4.7: Dashboard de conversão dos lembretes (enviado / agendou / ignorou)
- [ ] Story 4.8: Lista de clientes com filtros e busca

## Acceptance Criteria

- [ ] AC-01: Ficha do cliente com histórico completo de visitas
- [ ] AC-02: Sistema identifica clientes cujo intervalo de retorno venceu
- [ ] AC-03: WhatsApp de retorno disparado automaticamente com link de agendamento
- [ ] AC-04: Proprietário acompanha taxa de conversão dos lembretes
- [ ] AC-05: Cliente pode ter intervalo diferente do padrão do serviço

## Notas Técnicas

- Índice em clientes.proximo_retorno para query diária eficiente
- Motor de lembretes como Edge Function agendada (Supabase Cron)
- Dados do cliente linkados ao agendamento via cliente_id

---
*@pm (Morgan) — 2026-03-01*
