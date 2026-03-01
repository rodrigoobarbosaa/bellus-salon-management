# EPIC-01 — Fundação
**Wave:** 1
**FRs:** FR-00 (Configuração do Salão)
**Prioridade:** MUST HAVE
**Depende de:** —
**Status:** Ready

---

## Objetivo

Estabelecer a infraestrutura base do projeto: autenticação, banco de dados, configuração do salão e estrutura da aplicação Next.js.

## Stories

- [ ] Story 1.1: Setup do projeto Next.js + Supabase + TypeScript
- [ ] Story 1.2: Autenticação (login/logout/signup via Supabase Auth)
- [ ] Story 1.3: Schema do banco de dados (tabelas base: saloes, usuarios, profissionais)
- [ ] Story 1.4: Configuração do Salão (FR-00: nome, logo, endereço, WhatsApp, branding)
- [ ] Story 1.5: RBAC — 3 roles: proprietário, profissional, cliente
- [ ] Story 1.6: i18n setup (next-intl, 4 idiomas: PT, ES, EN, RU)
- [ ] Story 1.7: Layout base do dashboard (sidebar, navegação, responsivo)

## Acceptance Criteria

- [ ] AC-01: Proprietário consegue criar conta e fazer login
- [ ] AC-02: Configuração do salão salva e exibida corretamente (nome, logo, cor)
- [ ] AC-03: Sistema de roles funcional (proprietário vs profissional vs cliente)
- [ ] AC-04: Interface em 4 idiomas com seletor visível
- [ ] AC-05: Dashboard acessível apenas para usuários autenticados

## Stack Técnica

- Next.js (App Router)
- Supabase (Auth + PostgreSQL + Realtime)
- TypeScript
- Tailwind CSS + shadcn/ui
- next-intl

## Notas Técnicas

- Usar Supabase RLS (Row Level Security) desde o início
- Schema deve suportar multi-tenant (preparar para v2.0 multi-salão)
- Fuso horário: Europe/Madrid por padrão

---
*@pm (Morgan) — 2026-03-01*
