# EPIC-11 — Automação Conversacional (WhatsApp + Instagram)
**Wave:** 11
**FRs:** FR-13 (Automação de Atendimento — WhatsApp + Instagram)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-03 (Portal), EPIC-04 (CRM), EPIC-08 (Marketing IA)
**Status:** Ready

---

## Objetivo

Automatizar o atendimento ao cliente via WhatsApp e Instagram DMs usando IA (Claude). O sistema recebe mensagens, interpreta a intenção do cliente (agendar, cancelar, perguntar horários), consulta a disponibilidade real do salão e cria reservas automaticamente — eliminando horas diárias de trabalho manual de resposta a mensagens.

**Princípio:** Cliente manda mensagem → IA responde e agenda → humano só intervém em casos especiais.

## Stories

### FR-13.1 — Infraestrutura Meta Cloud API
- [ ] Story 11.1: Webhook Meta + schema de conversas (receber mensagens WhatsApp + Instagram)
- [ ] Story 11.2: Motor conversacional com Claude (interpretar intenção, manter contexto)

### FR-13.2 — Agendamento Automático
- [ ] Story 11.3: Fluxo de agendamento automático (consultar slots, criar reserva, confirmar)
- [ ] Story 11.4: Cancelamento e reagendamento via chat

### FR-13.3 — Instagram
- [ ] Story 11.5: Instagram DM automation (mesmo fluxo, canal diferente)

### FR-13.4 — Gestão Humana
- [ ] Story 11.6: Painel de conversas + handoff humano (dashboard, intervenção manual)
- [ ] Story 11.7: Configurações do chatbot (horário ativo, mensagens personalizadas, serviços visíveis)

## Acceptance Criteria

- [ ] AC-01: Mensagem WhatsApp recebida → resposta automática em < 5 segundos
- [ ] AC-02: Cliente consegue agendar serviço completo via chat sem intervenção humana
- [ ] AC-03: Instagram DMs processados pelo mesmo motor de IA
- [ ] AC-04: Quando IA não consegue resolver → encaminha para humano com contexto
- [ ] AC-05: Proprietária vê todas as conversas no painel do Bellus
- [ ] AC-06: Reservas criadas via chat aparecem na agenda normalmente
- [ ] AC-07: Sistema respeita opt-out de notificações existente
- [ ] AC-08: Funciona com o número WhatsApp Business existente do salão

## Stack Técnica

- Meta Cloud API v21+ (WhatsApp Business Platform)
- Instagram Messaging API (via mesmo app Meta)
- Claude API (claude-sonnet-4-6) para interpretação de linguagem natural
- Next.js API Routes (webhook endpoints)
- Supabase (tabelas de conversas, logs)
- Vercel (deployment, webhook endpoint público)

## Notas Técnicas

- **Migração do número:** Usar número WhatsApp Business existente requer migração para Cloud API. O app WhatsApp Business no telemóvel deixará de funcionar nesse número — toda gestão passa pelo painel Bellus.
- **Janela de 24h:** Meta permite mensagens de texto livre apenas dentro de 24h após última mensagem do cliente. Fora da janela, apenas templates aprovados.
- **Templates Meta:** Templates de confirmação/lembrete precisam aprovação (1-2 dias). Já temos sistema de templates em `notification_templates`.
- **Rate limits:** Meta Cloud API tem limites generosos (80 msgs/seg para business verified).
- **Webhook verification:** Meta requer challenge/verify token no setup inicial.
- **Graceful degradation:** Se Claude API estiver indisponível, responde com menu estruturado (botões).

---
*@pm (Morgan) — 2026-04-20*
