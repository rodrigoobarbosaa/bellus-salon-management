# EPIC-06 — Módulo Fiscal
**Wave:** 6
**FRs:** FR-07 (Módulo Fiscal Autónomo España)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-05
**Status:** Ready

---

## Objetivo

Automatizar o cálculo de IVA e IRPF para autónomos em Espanha, com exportação dos modelos fiscais trimestrais (303 e 130).

## Stories

- [ ] Story 6.1: Schema DB — tabela despesas (gastos deducibles)
- [ ] Story 6.2: Cálculo automático de IVA 21% por transação
- [ ] Story 6.3: Cálculo trimestral de IRPF 15% sobre rendimento líquido
- [ ] Story 6.4: Registro de despesas deducibles (produtos, aluguel, etc.)
- [ ] Story 6.5: Resumo trimestral (ingresos, gastos, IVA, IRPF)
- [ ] Story 6.6: Exportação Modelo 303 (IVA trimestral) em PDF/Excel
- [ ] Story 6.7: Exportação Modelo 130 (IRPF fracionado) em PDF/Excel
- [ ] Story 6.8: Tracking cuota autónomos mensal
- [ ] Story 6.9: Alertas de vencimento trimestral (jan/abr/jul/out)
- [ ] Story 6.10: Percentuais de IVA e IRPF editáveis

## Acceptance Criteria

- [ ] AC-01: IVA calculado automaticamente em cada serviço sem intervenção do proprietário
- [ ] AC-02: Resumo trimestral disponível em menos de 1 minuto
- [ ] AC-03: Exportação Modelo 303 e 130 em formato esperado pela AEAT
- [ ] AC-04: Alerta no dashboard 30 dias antes do vencimento trimestral
- [ ] AC-05: Declaração fiscal trimestral processada em menos de 30 min

## Notas Técnicas

- Percentuais armazenados em tabela configuracoes_fiscais (editáveis)
- Formato dos modelos validado contra templates AEAT atuais
- Considerar advogado/asesor fiscal para validar formato exportações

---
*@pm (Morgan) — 2026-03-01*
