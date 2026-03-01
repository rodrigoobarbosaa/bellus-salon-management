# EPIC-05 — Caixa / PDV
**Wave:** 5
**FRs:** FR-06 (Caixa / PDV)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-04
**Status:** Ready

---

## Objetivo

Registro de pagamentos ao concluir atendimentos, com fechamento de caixa diário e histórico de transações.

## Stories

- [ ] Story 5.1: Schema DB — tabela transacoes (pagamentos)
- [ ] Story 5.2: Modal de pagamento ao concluir agendamento
- [ ] Story 5.3: Formas de pagamento (efectivo, tarjeta, Bizum, transferência)
- [ ] Story 5.4: Aplicar desconto (% ou valor fixo)
- [ ] Story 5.5: Geração de recibo digital (PDF exportável)
- [ ] Story 5.6: Fechamento de caixa diário (resumo por forma de pagamento)
- [ ] Story 5.7: Histórico de transações com filtros (período, profissional, serviço)

## Acceptance Criteria

- [ ] AC-01: Pagamento registrado ao marcar agendamento como Concluído
- [ ] AC-02: Recibo PDF gerado com dados do salão, serviço e valor
- [ ] AC-03: Fechamento de caixa mostra total por forma de pagamento
- [ ] AC-04: Histórico filtrável por data, profissional e serviço
- [ ] AC-05: Desconto aplicado reflete no IVA calculado (integração com EPIC-06)

## Notas Técnicas

- PDF gerado client-side com react-pdf ou server-side com puppeteer
- Transações imutáveis (audit trail para RGPD e fiscal)
- Integração direta com FR-07 — cada transação gera registro fiscal

---
*@pm (Morgan) — 2026-03-01*
