# EPIC-08 — Marketing IA
**Wave:** 8
**FRs:** FR-12 (Marketing IA — todos os sub-módulos)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-07 (Dashboard), EPIC-04 (CRM), EPIC-01 (Fundação)
**Status:** Ready

---

## Objetivo

Módulo de Marketing IA que transforma dados operacionais do salão em campanhas inteligentes. O proprietário conversa em linguagem natural e o sistema gerencia Instagram Ads, Google Ads, Google Meu Negócio e envia relatórios via WhatsApp — sem que o proprietário precise entender de marketing digital.

**Princípio:** Agenda vazia = campanha automática. Serviço mais vendido = mais investimento.

## Stories

### FR-12.1 — Interface Conversacional
- [ ] Story 8.1: Chat integrado no dashboard (Claude API)
- [ ] Story 8.2: Interpretação de intenção e proposta de campanha com orçamento
- [ ] Story 8.3: Fluxo de aprovação (proprietário responde "aprova" → sistema executa)
- [ ] Story 8.4: Histórico de conversas e ações

### FR-12.2 — Meta Ads (Instagram)
- [ ] Story 8.5: OAuth com Meta Business Account
- [ ] Story 8.6: Criar campanha de alcance local (raio configurável, padrão 5km Valencia)
- [ ] Story 8.7: Segmentação automática (público 18-60, interesse beleza/cabelo)
- [ ] Story 8.8: Geração de briefing de anúncio com copy IA
- [ ] Story 8.9: Monitoramento de métricas Meta Ads no dashboard
- [ ] Story 8.10: Pausar/retomar campanhas

### FR-12.3 — Google Ads
- [ ] Story 8.11: OAuth com Google Ads Account
- [ ] Story 8.12: Campanhas de pesquisa local ("cabeleireiro Valencia", etc.)
- [ ] Story 8.13: Geração automática de keywords a partir dos serviços (FR-03)
- [ ] Story 8.14: Geração de textos de anúncio com IA
- [ ] Story 8.15: Monitoramento de métricas Google Ads

### FR-12.4 — Google Meu Negócio
- [ ] Story 8.16: Conexão Google Business Profile API
- [ ] Story 8.17: Monitor de avaliações novas
- [ ] Story 8.18: Alertas de avaliações negativas (< 4 estrelas)

### FR-12.5 — Campanhas Automáticas
- [ ] Story 8.19: Monitor diário de ocupação da agenda
- [ ] Story 8.20: Trigger de agenda vazia (< 60% em 48h) → proposta ao proprietário
- [ ] Story 8.21: Triggers sazonais (Natal, Verão, Volta às aulas)
- [ ] Story 8.22: Orçamento máximo mensal configurável

### FR-12.6 — Relatórios WhatsApp
- [ ] Story 8.23: Relatório semanal automático (toda segunda-feira)
- [ ] Story 8.24: Alertas em tempo real (orçamento esgotado, avaliação negativa)
- [ ] Story 8.25: Comandos por WhatsApp ("pause campanha", "ver relatório")

### FR-12.7 — Analytics & ROI
- [ ] Story 8.26: Painel ROI (gasto vs agendamentos vs receita)
- [ ] Story 8.27: Atribuição de canal (Instagram / Google / Orgânico)
- [ ] Story 8.28: Comparativo mensal por canal
- [ ] Story 8.29: Exportação relatório PDF mensal

### FR-12.8 — Geração de Conteúdo IA
- [ ] Story 8.30: Geração de copy para anúncios (Claude API)
- [ ] Story 8.31: Sugestão de hashtags Instagram
- [ ] Story 8.32: Templates de post Stories/Feed
- [ ] Story 8.33: Tom de voz configurável (profissional/descontraído/luxo)
- [ ] Story 8.34: Variações A/B (2-3 versões)

### FR-12.9 — Reativação de Clientes
- [ ] Story 8.35: Identificação de clientes inativos (> 90 dias sem visita)
- [ ] Story 8.36: Campanha de reativação WhatsApp personalizada por serviço
- [ ] Story 8.37: Tracking de conversão da reativação

## Acceptance Criteria

- [ ] AC-01: Proprietário cria campanha em menos de 5 minutos via chat
- [ ] AC-02: Anúncio Instagram publicado sem o proprietário acessar o Meta Ads Manager
- [ ] AC-03: Relatório semanal no WhatsApp toda segunda-feira
- [ ] AC-04: Sistema propõe campanha automaticamente quando agenda < 60% em 48h
- [ ] AC-05: ROI calculado: gasto em anúncios vs agendamentos vs receita gerada
- [ ] AC-06: Clientes inativos há > 90 dias recebem WhatsApp de reativação
- [ ] AC-07: Custo por novo cliente via anúncios < €15

## Notas Técnicas

- Claude API (claude-sonnet-4-6) para interface conversacional e geração de conteúdo
- Meta Ads API v21+ (requer aprovação Meta Business)
- Google Ads API v17+ (requer aprovação Google)
- Google Business Profile API v4
- Tokens OAuth armazenados criptografados no Supabase (nunca em plaintext)
- Sistema opera em modo degradado se APIs externas estiverem indisponíveis
- Rate limiting: máximo 10 conversações IA por dia por salão (tier gratuito)

---
*@pm (Morgan) — 2026-03-01*
