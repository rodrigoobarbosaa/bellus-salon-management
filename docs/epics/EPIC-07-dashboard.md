# EPIC-07 — Dashboard & KPIs
**Wave:** 7
**FRs:** FR-09 (Multi-idioma), FR-10 (Dashboard & KPIs)
**Prioridade:** SHOULD HAVE
**Depende de:** EPIC-06
**Status:** Ready

---

## Objetivo

Dashboard centralizado com KPIs do negócio, integração completa de multi-idioma e visão unificada de agenda, caixa, fiscal e marketing.

## Stories

- [ ] Story 7.1: Dashboard home — agenda do dia (próximos atendimentos)
- [ ] Story 7.2: KPI faturamento (hoje, semana, mês, trimestre)
- [ ] Story 7.3: KPI clientes (novos vs retorno, taxa conversão lembretes)
- [ ] Story 7.4: KPI serviços (ranking dos mais vendidos)
- [ ] Story 7.5: KPI fiscal (resumo impostos trimestre atual)
- [ ] Story 7.6: KPI marketing (campanhas ativas, gasto, retorno) — placeholder para EPIC-08
- [ ] Story 7.7: Completar traduções PT/ES/EN/RU (todos os componentes)
- [ ] Story 7.8: Seletor de idioma persistente por usuário
- [ ] Story 7.9: Notificações no idioma do cliente (ficha do CRM)

## Acceptance Criteria

- [ ] AC-01: Dashboard carrega em menos de 2 segundos (LCP)
- [ ] AC-02: Todos os KPIs calculados em tempo real com dados do Supabase
- [ ] AC-03: Interface 100% traduzida em 4 idiomas
- [ ] AC-04: Idioma do cliente nas notificações WhatsApp correto
- [ ] AC-05: Dashboard responsivo em mobile e desktop

## Notas Técnicas

- KPIs via Supabase views/functions para queries otimizadas
- next-intl com namespace por módulo
- Widget de marketing no dashboard pronto para receber dados do EPIC-08

---
*@pm (Morgan) — 2026-03-01*
