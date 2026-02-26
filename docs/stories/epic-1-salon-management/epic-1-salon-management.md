# EPIC-1: Bellus — Sistema de Gestão de Salão de Cabeleireiro — Valencia, España

**Status:** Ready
**Criado por:** Morgan (@pm)
**Data:** 2026-02-25
**Tipo:** Greenfield
**Prioridade:** Alta

---

## Epic Goal

Construir **Bellus** — um sistema completo de gestão para salão de cabeleireiro em Valencia, Espanha, que permita ao autónomo gerenciar agendamentos, clientes, caixa e obrigações fiscais em uma única plataforma web + mobile, reduzindo trabalho manual e melhorando a retenção de clientes.

---

## Contexto do Negócio

- **Negócio:** Salão de cabeleireiro em Valencia, Espanha
- **Regime fiscal:** Autónomo (cuenta propia)
- **Equipe:** 2-5 profissionais com agendas independentes
- **Problema central:** Gestão manual de agendamentos, cálculo de impostos disperso e sem ferramenta para fidelizar clientes
- **Valor entregue:** Centralização de toda a operação + conformidade fiscal automática + retenção de clientes via lembretes inteligentes

---

## Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Web App | Next.js 14 (App Router) | SSR, SEO, PWA, performance |
| App Mobile | React Native (Expo SDK 51) | Compartilha lógica com web |
| Backend / BaaS | Supabase (PostgreSQL + Auth + Realtime) | Tempo real, auth, gratuito até 500MB |
| Notificações | Twilio (WhatsApp Business API + SMS) | API oficial, confiável |
| Hospedagem Web | Vercel | CI/CD automático, gratuito no início |
| App Distribuição | Expo EAS | Build iOS + Android |
| Linguagem | TypeScript | Type safety em todo o stack |
| Estilo | Tailwind CSS + shadcn/ui | Consistência visual rápida |
| Estado | Zustand + React Query | Simples e performático |
| i18n | next-intl + i18next | Suporte PT 🇧🇷, ES 🇪🇸, EN 🇬🇧, RU 🇷🇺 |

---

## Módulos do Sistema (12 módulos)

| # | Módulo | Descrição | Wave |
|---|--------|-----------|------|
| M1 | Infraestrutura & Auth | Setup, banco de dados, autenticação multi-profissional | 1 |
| M2 | Catálogo de Serviços | Serviços com duração, preço e profissional responsável | 2 |
| M3 | Gestão de Agenda | Calendário visual, disponibilidade, bloqueios por profissional | 2 |
| M4 | Ficha do Cliente (CRM) | Histórico, preferências, produtos usados | 2 |
| M5 | Portal Público de Reservas | Página pública para clientes agendarem sozinhos | 3 |
| M6 | Notificações WhatsApp/SMS | Lembretes automáticos 24h antes, confirmações | 3 |
| M7 | Caixa / PDV | Fechamento de caixa, pagamentos, emissão de recibos | 4 |
| M8 | Módulo Fiscal (Autónomo ES) | IVA 21%, IRPF 15%, cuota autónomos, Modelo 303/130 | 4 |
| M9 | Lembretes de Retorno | Fidelização com intervalos configuráveis por serviço/cliente | 5 |
| M10 | Dashboard & KPIs | Faturamento, agenda do dia, impostos a pagar, métricas | 6 |
| M11 | App Mobile Cliente | App React Native para clientes agendarem e verem histórico | 7 |
| M12 | Multi-idioma (i18n) | Interface em Português, Español, English e Русский | 1 |

---

## Ondas de Desenvolvimento (Waves)

### Wave 1 — Fundação (Stories 1.1 – 1.5)
**Objetivo:** Base sólida do projeto, banco de dados, autenticação e internacionalização
**Duração estimada:** 1 sprint

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 1.1 | Setup do projeto Next.js + Supabase + TypeScript | @dev | @architect |
| 1.2 | Schema do banco de dados (profissionais, clientes, serviços, agendamentos) | @data-engineer | @dev |
| 1.3 | Autenticação multi-profissional (login, roles, permissões) | @dev | @architect |
| 1.4 | Layout base do painel de gestão (sidebar, navegação) | @dev | @ux-design-expert |
| 1.5 | Sistema i18n: PT, ES, EN, RU com seletor de idioma e persistência | @dev | @ux-design-expert |

---

### Wave 2 — Core da Agenda (Stories 2.1 – 2.6)
**Objetivo:** Funcionalidades centrais de operação do salão
**Duração estimada:** 2 sprints

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 2.1 | CRUD Catálogo de Serviços (nome, duração, preço, profissional) | @dev | @architect |
| 2.2 | Calendário visual de agendamentos por profissional | @dev | @ux-design-expert |
| 2.3 | Criação e edição de agendamentos pelo salão | @dev | @architect |
| 2.4 | CRUD Ficha do Cliente (dados, histórico de visitas) | @dev | @data-engineer |
| 2.5 | Registro de serviços realizados na ficha do cliente | @dev | @architect |
| 2.6 | Bloqueio de horários e folgas por profissional | @dev | @architect |

---

### Wave 3 — Portal & Notificações (Stories 3.1 – 3.4)
**Objetivo:** Auto-agendamento de clientes + comunicação automática
**Duração estimada:** 1-2 sprints

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 3.1 | Portal público de reservas (seleção de serviço, profissional, horário) | @dev | @ux-design-expert |
| 3.2 | Integração Twilio — notificação de confirmação de agendamento | @dev | @architect |
| 3.3 | Lembrete automático 24h antes via WhatsApp/SMS | @dev | @architect |
| 3.4 | Templates de mensagens editáveis pelo salão | @dev | @ux-design-expert |

---

### Wave 4 — Caixa & Fiscal (Stories 4.1 – 4.6)
**Objetivo:** Controle financeiro + conformidade fiscal autónomo espanhol
**Duração estimada:** 2 sprints

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 4.1 | PDV / Caixa: registro de pagamentos por agendamento | @dev | @architect |
| 4.2 | Emissão de recibo simples por atendimento | @dev | @ux-design-expert |
| 4.3 | Cálculo automático IVA 21% por serviço | @dev | @architect |
| 4.4 | Cálculo IRPF 15% e rastreio trimestral | @dev | @architect |
| 4.5 | Tracking cuota autónomos mensal (Seguridad Social) | @dev | @architect |
| 4.6 | Exportação Modelo 303 / Modelo 130 (PDF/Excel) | @dev | @data-engineer |

---

### Wave 5 — Lembretes de Retorno (Stories 5.1 – 5.3)
**Objetivo:** Fidelização de clientes com lembretes inteligentes configuráveis
**Duração estimada:** 1 sprint

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 5.1 | Motor de lembretes: intervalos configuráveis por serviço (ex: mechas 90 dias) | @dev | @architect |
| 5.2 | Override de intervalo por cliente individual | @dev | @architect |
| 5.3 | Envio automático de lembrete de retorno com link de agendamento | @dev | @architect |

---

### Wave 6 — Dashboard (Stories 6.1 – 6.2)
**Objetivo:** Visão executiva do negócio
**Duração estimada:** 1 sprint

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 6.1 | Dashboard: agenda do dia, faturamento, clientes do mês | @dev | @ux-design-expert |
| 6.2 | Relatórios: receita por período, serviços mais vendidos, impostos a pagar | @dev | @architect |

---

### Wave 7 — App Mobile (Stories 7.1 – 7.3)
**Objetivo:** App para clientes agendem pelo celular
**Duração estimada:** 2 sprints

| Story ID | Título | Executor | Quality Gate |
|----------|--------|----------|--------------|
| 7.1 | App React Native (Expo): navegação e telas base | @dev | @ux-design-expert |
| 7.2 | Tela de agendamento (escolher serviço, profissional, horário) | @dev | @ux-design-expert |
| 7.3 | Histórico de visitas e próximos agendamentos no app | @dev | @ux-design-expert |

---

## Detalhe do Módulo Fiscal (M8) — Autónomo España

### Impostos e Obrigações

| Imposto/Obrigação | Taxa | Periodicidade | Modelo AEAT |
|-------------------|------|---------------|-------------|
| IVA (Impuesto sobre el Valor Añadido) | 21% sobre serviços | Trimestral | **Modelo 303** |
| IRPF (pagamento fracionado) | 20% s/ rendimento líquido | Trimestral | **Modelo 130** |
| Cuota autónomos (Seguridad Social) | Variável por base cotización | Mensal | — |

### Funcionalidades do Módulo Fiscal

- Cada serviço registrado inclui automaticamente o IVA 21%
- Painel de IVA: ingresos com IVA / gastos com IVA / IVA a pagar (303)
- IRPF: cálculo do 20% sobre rendimento líquido trimestral (130)
- Cuota autónomos: campo de input mensal + tracking anual
- **Exportação** dos dados para PDF e Excel prontos para o gestor/asesor fiscal
- Alertas de vencimento trimestral (20 de outubro, janeiro, abril, julho)

---

## Detalhe do Módulo Lembretes (M9) — Fidelização

### Como funciona

```
1. Cliente faz mechas → Sistema registra data do serviço
2. Intervalo configurado para "Mechas": 90 dias
3. Aos 80 dias (10 dias antes): sistema envia WhatsApp automático:
   "Olá María! Já faz quase 3 meses desde suas mechas.
    Que tal renovar? Reserve aqui: [link]"
4. Cliente clica → vai ao portal de reservas com serviço pré-selecionado
5. Salão vê no dashboard quantos lembretes foram enviados/convertidos
```

### Configuração dos Intervalos

| Serviço | Intervalo Padrão | Configurável? |
|---------|-----------------|---------------|
| Corte de cabelo | 4 semanas | Sim |
| Mechas / Highlights | 12 semanas | Sim |
| Coloração | 6 semanas | Sim |
| Tratamento / Hidratação | 4 semanas | Sim |
| Qualquer serviço | Personalizado | Sim (por cliente) |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Twilio custos altos com muitas mensagens | Médio | Médio | Limitar lembretes, implementar opt-out |
| Mudanças fiscais na AEAT (Espanha) | Baixo | Alto | Módulo fiscal configurável com % editáveis |
| App rejected na App Store | Baixo | Alto | Seguir guidelines Apple desde o início |
| Escalabilidade com múltiplos salões | Baixo | Médio | Arquitetura multi-tenant desde o início (opcional) |

---

## Definition of Done (Epic)

- [ ] Todos os módulos M1–M10 implementados e testados
- [ ] App mobile publicado na App Store e Play Store
- [ ] Módulo fiscal validado com autónomo real ou asesor
- [ ] Sistema de lembretes enviando mensagens reais via Twilio
- [ ] Performance: carregamento < 2s no web
- [ ] Documentação técnica atualizada
- [ ] Zero regressões nos testes de integração

---

## Fora do Escopo (v1.0)

> Referência completa: [PRD Bellus](../../prd/prd-bellus.md) — Seção 5

- Pagamentos online (Stripe, PayPal) → v2.0
- Gestão de estoque de produtos → v2.0
- Sistema de fidelidade/pontos → v2.0
- Integração com sistemas contábeis (Sage, ContaPlus) → v2.0
- Multi-salão / franquia → v2.0
- Declaração fiscal automática na AEAT → v2.0

---

## Próximos Passos

1. **@po (Pax)** — Validar este epic (10-point checklist)
2. **@sm (River)** — Criar stories da Wave 1 (Stories 1.1 a 1.4)
3. **@architect (Aria)** — Definir arquitetura técnica detalhada
4. **@data-engineer (Dara)** — Projetar schema do banco de dados
5. **@dev (Dex)** — Iniciar implementação Wave 1

---

## Change Log

| Data | Agente | Alteração |
|------|--------|-----------|
| 2026-02-25 | @pm (Morgan) | Epic criado — sistema completo com 12 módulos, 7 waves, ~23 stories |
| 2026-02-25 | @po (Pax) | Validação GO (9/10) — corrigida contagem de módulos, adicionado Fora do Escopo, Status → Ready |

---

*— Morgan, planejando o futuro 📊*
