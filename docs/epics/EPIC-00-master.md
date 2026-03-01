# EPIC-00 — Bellus Platform Master Plan
**Projeto:** Bellus — Sistema de Gestão de Salão de Cabeleireiro
**Salão Piloto:** Tati & Rodri Hair Studio, Valencia, Espanha
**PRD:** docs/prd/prd-bellus.md (v1.2)
**Status:** Ready
**Criado por:** @pm (Morgan) — 2026-03-01

---

## Visão Geral

Plataforma completa para gestão de salões de cabeleireiro com Marketing IA integrado. O proprietário gerencia agenda, clientes, caixa, impostos e campanhas de marketing em um único lugar — conversando em linguagem natural com o sistema.

## Estrutura de Waves (v1.0)

| Epic | Wave | Título | FRs | Status |
|------|------|--------|-----|--------|
| EPIC-01 | Wave 1 | Fundação | FR-00 | Ready |
| EPIC-02 | Wave 2 | Agenda & Serviços | FR-01, FR-03 | Ready |
| EPIC-03 | Wave 3 | Portal & Notificações | FR-02, FR-05 | Ready |
| EPIC-04 | Wave 4 | CRM & Fidelização | FR-04, FR-08 | Ready |
| EPIC-05 | Wave 5 | Caixa / PDV | FR-06 | Ready |
| EPIC-06 | Wave 6 | Módulo Fiscal | FR-07 | Ready |
| EPIC-07 | Wave 7 | Dashboard & KPIs | FR-09, FR-10 | Ready |
| EPIC-08 | Wave 8 | Marketing IA | FR-12 | Ready |

## v1.1
| Epic | Título | FRs | Status |
|------|--------|-----|--------|
| EPIC-09 | App Mobile | FR-11 | Backlog |

## Dependências entre Waves

Wave 1 (Fundação)
  └─> Wave 2 (Agenda)
        └─> Wave 3 (Portal + Notificações)
              └─> Wave 4 (CRM + Lembretes)
                    ├─> Wave 5 (Caixa)
                    │     └─> Wave 6 (Fiscal)
                    │           └─> Wave 7 (Dashboard)
                    └─────────────────> Wave 8 (Marketing IA)

## Métricas de Sucesso Globais

- Agendamentos/mês: > 100
- No-show rate: < 15%
- Taxa reativação clientes: > 20%
- Custo por cliente via anúncios: < €15
- NPS proprietário: > 70
- Tempo criar campanha marketing: < 5 min

---
*Gerado por @pm (Morgan) — Bellus Platform v1.2*
