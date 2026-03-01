# EPIC-03 — Portal Público & Notificações
**Wave:** 3
**FRs:** FR-02 (Portal de Reservas), FR-05 (Notificações WhatsApp/SMS)
**Prioridade:** MUST HAVE
**Depende de:** EPIC-02
**Status:** Ready

---

## Objetivo

Portal público para clientes agendarem online e sistema de notificações automáticas via WhatsApp/SMS.

## Stories

- [ ] Story 3.1: Página pública de reservas (rota /booking/[salaoid])
- [ ] Story 3.2: Fluxo de reserva: selecionar serviço → profissional → horário → dados do cliente
- [ ] Story 3.3: Integração Twilio — envio de WhatsApp/SMS
- [ ] Story 3.4: Template de confirmação de agendamento (variáveis dinâmicas)
- [ ] Story 3.5: Lembrete automático 24h antes (cron job)
- [ ] Story 3.6: Templates editáveis pelo proprietário
- [ ] Story 3.7: Opt-out de notificações
- [ ] Story 3.8: Link/QR code do portal para o salão

## Acceptance Criteria

- [ ] AC-01: Cliente agenda sem precisar criar conta
- [ ] AC-02: Confirmação WhatsApp enviada em menos de 30 segundos
- [ ] AC-03: Lembrete disparado automaticamente 24h antes
- [ ] AC-04: Portal em 4 idiomas (auto-detecta idioma do browser)
- [ ] AC-05: Proprietário edita templates de mensagem com variáveis

## Notas Técnicas

- Twilio WhatsApp Business API (sandbox para dev, produção requer aprovação Meta)
- Cron job via Supabase Edge Functions ou Vercel Cron
- Portal público sem autenticação, mas com rate limiting

---
*@pm (Morgan) — 2026-03-01*
