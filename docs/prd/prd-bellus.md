# PRD — Bellus v1.0
## Product Requirements Document

**Produto:** Bellus — Sistema de Gestão de Salão de Cabeleireiro
**Versão:** 1.0
**Data:** 2026-02-25
**Autor:** Morgan (@pm)
**Status:** Draft → Aguarda validação @po

---

## 1. Visão do Produto

### 1.1 Problema

Proprietários de salões de cabeleireiro em Espanha — especialmente autónomos — enfrentam:

- **Gestão manual de agendamentos** em papel, WhatsApp ou planilhas
- **Cálculo de impostos** disperso, propenso a erros, sem integração com o dia a dia
- **Perda de clientes** por falta de follow-up (mechas que deveriam ser feitas a cada 3 meses ficam 6)
- **Sem visibilidade** do negócio: quanto faturou? Quantos clientes novos? Qual serviço mais vendido?
- **Barreiras de idioma** — Valencia tem comunidade diversa (espanhol, português, inglês, russo)

### 1.2 Solução

**Bellus** é uma plataforma web + mobile que centraliza toda a operação do salão em um único sistema: agendamentos, clientes, caixa, impostos e fidelização — em 4 idiomas.

### 1.3 Proposta de Valor

| Para | Bellus oferece |
|------|---------------|
| O proprietário | Controle total: agenda, caixa e fiscal em um único lugar |
| Os profissionais | Agenda própria, sem conflito de horários |
| Os clientes | Agendamento online 24/7, lembretes automáticos |
| O asesor fiscal | Dados de IVA/IRPF prontos para exportar trimestralmente |

---

## 2. Público-Alvo

### 2.1 Usuário Primário — Proprietário/Autónomo

- **Perfil:** Cabeleireiro autónomo ou pequeno salão (1-5 profissionais)
- **Localização:** Valencia, Espanha (mas aplicável a toda Espanha)
- **Idioma:** Espanhol (principal), Português, Inglês, Russo
- **Dor principal:** Tempo perdido com organização manual + medo de errar nos impostos
- **Objetivo:** Ter mais tempo para atender clientes e menos para "papelada"

### 2.2 Usuário Secundário — Profissional do Salão

- **Perfil:** Cabeleireiro/esteticista contratado ou em parceria
- **Acesso:** Visualiza apenas sua própria agenda
- **Dor:** Conflito de horários, não saber a agenda do dia

### 2.3 Usuário Terciário — Cliente do Salão

- **Perfil:** Qualquer pessoa que frequenta o salão
- **Acesso:** Portal público de reservas + app mobile (opcional)
- **Dor:** Ter que ligar para agendar, esquecer quando deve voltar

---

## 3. Funcionalidades (MVP v1.0)

### FR-01 — Gestão de Agenda

**Prioridade:** MUST HAVE

- FR-01.1 Calendário visual por profissional (semana/dia)
- FR-01.2 Criar, editar e cancelar agendamentos
- FR-01.3 Bloqueio de horários e folgas
- FR-01.4 Visualização simultânea de múltiplos profissionais
- FR-01.5 Status do agendamento: Pendente / Confirmado / Concluído / Cancelado

### FR-02 — Portal Público de Reservas

**Prioridade:** MUST HAVE

- FR-02.1 Página pública acessível por link/QR code do salão
- FR-02.2 Seleção de serviço, profissional e horário disponível
- FR-02.3 Formulário de dados do cliente (nome, telefone, email)
- FR-02.4 Confirmação automática via WhatsApp/SMS
- FR-02.5 Opção de cancelar/reagendar pelo cliente

### FR-03 — Catálogo de Serviços

**Prioridade:** MUST HAVE

- FR-03.1 CRUD de serviços (nome, descrição, duração, preço)
- FR-03.2 Associação de serviço a profissional(is)
- FR-03.3 Preço diferenciado por profissional (opcional)
- FR-03.4 Categoria de serviço (corte, coloração, tratamento, etc.)
- FR-03.5 Intervalo de retorno padrão por serviço (usado nos lembretes)

### FR-04 — Ficha do Cliente (CRM)

**Prioridade:** MUST HAVE

- FR-04.1 Cadastro completo do cliente (nome, telefone, email, idioma preferido)
- FR-04.2 Histórico completo de visitas com serviços e valores
- FR-04.3 Registro de produtos usados por visita
- FR-04.4 Notas e preferências (ex: "não usar amônia", "prefere Tuesdays")
- FR-04.5 Intervalo de retorno personalizado por cliente (sobrescreve padrão do serviço)

### FR-05 — Notificações WhatsApp/SMS

**Prioridade:** MUST HAVE

- FR-05.1 Confirmação imediata após agendamento criado
- FR-05.2 Lembrete automático 24h antes do agendamento
- FR-05.3 Lembrete de retorno (baseado no intervalo configurado)
- FR-05.4 Templates de mensagem editáveis pelo salão
- FR-05.5 Variáveis dinâmicas: {nome_cliente}, {serviço}, {data}, {hora}, {link}
- FR-05.6 Opt-out: cliente pode parar de receber notificações

### FR-06 — Caixa / PDV

**Prioridade:** MUST HAVE

- FR-06.1 Registrar pagamento ao concluir agendamento
- FR-06.2 Formas de pagamento: efectivo, tarjeta, Bizum, transferência
- FR-06.3 Aplicar desconto (% ou valor fixo)
- FR-06.4 Emissão de recibo simples (digital, exportável PDF)
- FR-06.5 Fechamento de caixa diário (total por forma de pagamento)
- FR-06.6 Histórico de transações filtrável por período/profissional

### FR-07 — Módulo Fiscal (Autónomo España)

**Prioridade:** MUST HAVE

- FR-07.1 IVA 21% calculado automaticamente em cada serviço registrado
- FR-07.2 IRPF 15% calculado por trimestre sobre rendimento líquido
- FR-07.3 Campo de despesas (gastos deducibles): produtos, aluguel, etc.
- FR-07.4 Resumo trimestral: ingresos, gastos, IVA soportado/repercutido, IRPF
- FR-07.5 Exportação Modelo 303 (IVA trimestral) em PDF/Excel
- FR-07.6 Exportação Modelo 130 (IRPF fracionado) em PDF/Excel
- FR-07.7 Tracking cuota autónomos mensal com saldo anual
- FR-07.8 Alertas de vencimento das declarações trimestrais (jan/abr/jul/out)
- FR-07.9 Percentuais editáveis (para futuras mudanças legais)

### FR-08 — Lembretes de Retorno (Fidelização)

**Prioridade:** MUST HAVE

- FR-08.1 Cada serviço tem intervalo de retorno configurável (em dias/semanas/meses)
- FR-08.2 Override por cliente: intervalo individual diferente do padrão
- FR-08.3 Sistema verifica diariamente clientes cujo intervalo está próximo de vencer
- FR-08.4 Envio automático de WhatsApp/SMS com link de agendamento
- FR-08.5 Template editável com variáveis dinâmicas
- FR-08.6 Status de conversão: lembrete enviado → agendou / ignorou / cancelou

### FR-09 — Multi-idioma (i18n)

**Prioridade:** MUST HAVE

- FR-09.1 Interface disponível em: Português 🇧🇷, Español 🇪🇸, English 🇬🇧, Русский 🇷🇺
- FR-09.2 Seletor de idioma visível e persistente (salvo por usuário)
- FR-09.3 Notificações enviadas no idioma do cliente (configurado na ficha)
- FR-09.4 Portal de reservas detecta idioma do browser automaticamente
- FR-09.5 Datas e formatos numéricos respeitam locale do idioma

### FR-10 — Dashboard & KPIs

**Prioridade:** SHOULD HAVE

- FR-10.1 Agenda do dia: próximos atendimentos, profissionais escalados
- FR-10.2 Faturamento: hoje, semana, mês, trimestre
- FR-10.3 Clientes: novos vs. retorno, taxa de conversão dos lembretes
- FR-10.4 Serviços: ranking dos mais vendidos
- FR-10.5 Fiscal: resumo de impostos a pagar no trimestre atual

### FR-11 — App Mobile Cliente

**Prioridade:** SHOULD HAVE (v1.0 — iOS + Android)

- FR-11.1 Agendar serviço diretamente pelo app
- FR-11.2 Histórico de visitas e próximos agendamentos
- FR-11.3 Receber notificações push (além de WhatsApp/SMS)
- FR-11.4 Cancelar/reagendar agendamentos
- FR-11.5 App em 4 idiomas (mesmo sistema i18n)

---

## 4. Requisitos Não Funcionais

### NFR-01 — Performance
- Carregamento inicial da web app: < 2 segundos (LCP)
- Busca de disponibilidade de horários: < 500ms
- Exportação de relatórios fiscais: < 10 segundos

### NFR-02 — Segurança
- Autenticação via Supabase Auth (email/senha + 2FA opcional)
- RBAC: proprietário, profissional, cliente (3 roles)
- Dados pessoais protegidos conforme RGPD (Reglamento General de Protección de Datos)
- Comunicação HTTPS obrigatória
- Números de telefone e emails dos clientes nunca expostos publicamente

### NFR-03 — Disponibilidade
- Uptime target: 99.5% (exceto manutenção programada)
- Backups automáticos diários (Supabase)

### NFR-04 — Usabilidade
- Mobile-first: interface responsiva em todos os dispositivos
- Fluência em 4 idiomas: PT, ES, EN, RU
- Onboarding guiado para novo usuário (< 10 min para primeira operação)

### NFR-05 — Conformidade Fiscal
- Percentuais de IVA e IRPF editáveis para adaptação legal futura
- Histórico de transações imutável (audit trail)
- Exportações seguem formato esperado pela AEAT (Agencia Tributaria)

---

## 5. Fora do Escopo (v1.0)

- Processamento de pagamentos online (Stripe, PayPal) — v2.0
- Gestão de estoque de produtos — v2.0
- Sistema de fidelidade / pontos — v2.0
- Integração com sistemas contábeis (Sage, ContaPlus) — v2.0
- Multi-salão / franquia — v2.0
- Inteligência artificial para sugestão de horários — v2.0
- Declaração fiscal automática na AEAT — v2.0

---

## 6. Métricas de Sucesso (KPIs)

| Métrica | Meta v1.0 |
|---------|-----------|
| Agendamentos criados/mês | > 100 |
| Taxa de não-comparecimento (no-show) | < 15% (vs. média setor ~25%) |
| Taxa de conversão lembretes de retorno | > 30% |
| Tempo para declaração fiscal trimestral | < 30 min (vs. 3-4h manual) |
| NPS do proprietário | > 70 |
| Onboarding (primeiro agendamento) | < 10 min |

---

## 7. Dependências Técnicas

| Dependência | Uso | Custo estimado |
|-------------|-----|----------------|
| Supabase | BD, Auth, Realtime | Gratuito até 500MB |
| Twilio (WhatsApp/SMS) | Notificações | ~€0.05/mensagem |
| Vercel | Hospedagem web | Gratuito no início |
| Expo EAS | Build app mobile | Gratuito até 30 builds/mês |
| next-intl | i18n web | Open source |

---

## 8. Riscos do Produto

| Risco | Probabilidade | Impacto | Plano |
|-------|-------------|---------|-------|
| Custo Twilio escalar com volume | Médio | Médio | Limitar lembretes, batch sending |
| Mudança na legislação fiscal espanhola | Baixo | Alto | % editáveis, alertas de atualização |
| App rejeitado nas stores | Baixo | Alto | Seguir guidelines desde início |
| RGPD: vazamento de dados de clientes | Baixo | Alto | Criptografia, audit logs, política privacidade |
| Concorrentes com features similares | Alto | Médio | Foco no nicho espanhol + i18n diferenciado |

---

## 9. Roadmap

### v1.0 (MVP) — Este documento
Waves 1-6: fundação, agenda, portal, notificações, caixa, fiscal, lembretes, dashboard

### v1.1 — App Mobile
Wave 7: App React Native (iOS + Android)

### v2.0 — Expansão
- Pagamentos online (Stripe)
- Gestão de estoque
- Multi-salão
- Integração contábil

---

## Change Log

| Data | Autor | Alteração |
|------|-------|-----------|
| 2026-02-25 | @pm (Morgan) | PRD v1.0 criado — 11 FRs, 5 NFRs, 4 idiomas |

---

*— Morgan, planejando o futuro 📊*
