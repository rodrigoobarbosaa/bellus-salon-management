# PRD — Bellus v1.2
## Product Requirements Document

**Produto:** Bellus — Sistema de Gestão de Salão de Cabeleireiro
**Versão:** 1.2
**Data:** 2026-03-01
**Autor:** Morgan (@pm)
**Status:** Draft → Aguarda validação @po
**Salão Piloto:** Tati & Rodri Hair Studio — Valencia, Espanha

---

## 1. Visão do Produto

### 1.1 Problema

Proprietários de salões de cabeleireiro em Espanha — especialmente autónomos — enfrentam:

- **Gestão manual de agendamentos** em papel, WhatsApp ou planilhas
- **Cálculo de impostos** disperso, propenso a erros, sem integração com o dia a dia
- **Perda de clientes** por falta de follow-up (mechas que deveriam ser feitas a cada 3 meses ficam 6)
- **Sem visibilidade** do negócio: quanto faturou? Quantos clientes novos? Qual serviço mais vendido?
- **Barreiras de idioma** — Valencia tem comunidade diversa (espanhol, português, inglês, russo)
- **Marketing manual e disperso** — sem integração entre agenda, dados de clientes e campanhas pagas

### 1.2 Solução

**Bellus** é uma plataforma web + mobile que centraliza toda a operação do salão em um único sistema: agendamentos, clientes, caixa, impostos, fidelização e marketing inteligente — em 4 idiomas.

### 1.3 Proposta de Valor

| Para | Bellus oferece |
|------|---------------|
| O proprietário | Controle total: agenda, caixa, fiscal e marketing em um único lugar |
| Os profissionais | Agenda própria, sem conflito de horários |
| Os clientes | Agendamento online 24/7, lembretes automáticos |
| O asesor fiscal | Dados de IVA/IRPF prontos para exportar trimestralmente |
| O gestor de marketing | Campanhas automáticas baseadas nos dados reais do salão |

---

## 2. Público-Alvo

### 2.1 Usuário Primário — Proprietário/Autónomo

- **Perfil:** Cabeleireiro autónomo ou pequeno salão (1-5 profissionais)
- **Localização:** Valencia, Espanha (mas aplicável a toda Espanha)
- **Idioma:** Espanhol (principal), Português, Inglês, Russo
- **Dor principal:** Tempo perdido com organização manual + medo de errar nos impostos + marketing feito às cegas
- **Objetivo:** Ter mais tempo para atender clientes e menos para papelada e gestão de anúncios
- **Referência:** Tati & Rodri Hair Studio (Valencia) — salão piloto desta plataforma

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

### FR-00 — Configuração do Salão

**Prioridade:** MUST HAVE

- FR-00.1 Nome do salão configurável (ex: "Tati & Rodri Hair Studio")
- FR-00.2 Upload de logótipo (exibido no portal público e nos relatórios)
- FR-00.3 Endereço, telefone e horário de funcionamento
- FR-00.4 Links para redes sociais (Instagram, Google Maps)
- FR-00.5 Número de WhatsApp Business para envio de notificações
- FR-00.6 Configuração de moeda (EUR padrão) e fuso horário (Europe/Madrid padrão)
- FR-00.7 Branding: cor primária do salão usada no portal público

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
- FR-04.4 Notas e preferências
- FR-04.5 Intervalo de retorno personalizado por cliente (sobrescreve padrão do serviço)

### FR-05 — Notificações WhatsApp/SMS

**Prioridade:** MUST HAVE

- FR-05.1 Confirmação imediata após agendamento criado
- FR-05.2 Lembrete automático 24h antes do agendamento
- FR-05.3 Lembrete de retorno (baseado no intervalo configurado)
- FR-05.4 Templates de mensagem editáveis pelo salão
- FR-05.5 Variáveis dinâmicas: nome_cliente, serviço, data, hora, link
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

- FR-09.1 Interface disponível em: Português, Español, English, Русский
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
- FR-10.6 Marketing: resumo de campanhas ativas, gasto total e retorno (integrado com FR-12)

### FR-11 — App Mobile Cliente

**Prioridade:** SHOULD HAVE (v1.0 — iOS + Android)

- FR-11.1 Agendar serviço diretamente pelo app
- FR-11.2 Histórico de visitas e próximos agendamentos
- FR-11.3 Receber notificações push (além de WhatsApp/SMS)
- FR-11.4 Cancelar/reagendar agendamentos
- FR-11.5 App em 4 idiomas (mesmo sistema i18n)

### FR-12 — Marketing IA

**Prioridade:** MUST HAVE

O módulo de Marketing IA transforma os dados operacionais do salão (agenda, CRM, receita) em inteligência de marketing acionável. O proprietário conversa com o sistema em linguagem natural e recebe relatórios, sugestões e execução de campanhas — sem precisar entender de marketing digital.

**Princípio fundamental:** os dados da agenda alimentam as decisões de marketing. Horário vazio = oportunidade de campanha. Serviço mais vendido = foco dos anúncios.

**Integrações base reutilizadas:** Twilio (FR-05), CRM (FR-04), Agenda (FR-01), Dashboard (FR-10).

#### FR-12.1 — Interface Conversacional

- FR-12.1.1 Chat integrado no dashboard (português e espanhol)
- FR-12.1.2 Comandos em linguagem natural: "quero mais clientes para mechas este mês"
- FR-12.1.3 Sistema interpreta a intenção e propõe ação concreta com orçamento estimado
- FR-12.1.4 Aprovação por texto: proprietário responde "aprova" e o sistema executa
- FR-12.1.5 Histórico de conversas e ações tomadas

#### FR-12.2 — Gestão de Anúncios Instagram (Meta Ads)

- FR-12.2.1 Conexão com conta Meta Business via OAuth
- FR-12.2.2 Criação de campanhas de alcance local (raio configurável, padrão 5km de Valencia)
- FR-12.2.3 Segmentação automática: público 18-60, interesse em beleza, cuidados com cabelo e bem-estar (configurável por campanha)
- FR-12.2.4 Geração de briefing de anúncio com copy sugerido e especificações de arte
- FR-12.2.5 Monitoramento de métricas: impressões, cliques, custo por clique, alcance
- FR-12.2.6 Pausar/retomar campanhas diretamente do dashboard
- FR-12.2.7 Sugestão automática de otimização baseada em performance

#### FR-12.3 — Gestão de Anúncios Google (Google Ads)

- FR-12.3.1 Conexão com conta Google Ads via OAuth
- FR-12.3.2 Campanhas de pesquisa local: "cabeleireiro Valencia", "mechas Valencia", etc.
- FR-12.3.3 Campanhas de display na rede local (Google Maps + sites parceiros)
- FR-12.3.4 Geração automática de palavras-chave baseada nos serviços cadastrados em FR-03
- FR-12.3.5 Geração de textos de anúncio (headlines e descriptions) com IA
- FR-12.3.6 Monitoramento: impressões, cliques, CTR, custo por conversão
- FR-12.3.7 Integração com Google Analytics (opcional) para rastreamento de agendamentos

#### FR-12.4 — Google Meu Negócio (Google Business Profile)

- FR-12.4.1 Conexão com perfil do Google Meu Negócio via API
- FR-12.4.2 Monitoramento de avaliações novas (notificação no dashboard)
- FR-12.4.3 Alerta para responder avaliações negativas (menos de 4 estrelas)
- FR-12.4.4 Visualização de métricas: buscas, cliques em "ligar" e "como chegar"
- FR-12.4.5 Sugestão de publicação de posts (promoções, fotos de resultado)

#### FR-12.5 — Campanhas Automáticas por Contexto da Agenda

- FR-12.5.1 Monitor diário de ocupação da agenda por profissional
- FR-12.5.2 Trigger automático: se ocupação menor que 60% em 48h → propor campanha promocional
- FR-12.5.3 Trigger sazonal: campanhas sugeridas em datas estratégicas (Natal, Verão, Volta às aulas)
- FR-12.5.4 Trigger de serviço: serviço com poucos agendamentos na semana → sugerir anúncio específico
- FR-12.5.5 Configuração de orçamento máximo mensal de marketing (teto de gastos)
- FR-12.5.6 Proposta ao proprietário antes de executar qualquer campanha automática

#### FR-12.6 — Relatórios via WhatsApp

- FR-12.6.1 Relatório semanal automático no WhatsApp do proprietário (toda segunda-feira)
- FR-12.6.2 Conteúdo: resumo da semana anterior (agendamentos, receita, campanhas, custo)
- FR-12.6.3 Alerta em tempo real para eventos críticos: campanha esgotou orçamento, avaliação negativa
- FR-12.6.4 Comandos por WhatsApp: proprietário responde "pause campanha" ou "ver relatório"
- FR-12.6.5 Usa infraestrutura Twilio já existente (FR-05) — sem custo adicional de plataforma

#### FR-12.7 — Analytics de Marketing e ROI

- FR-12.7.1 Painel de ROI: gasto em anúncios vs. agendamentos gerados vs. receita gerada
- FR-12.7.2 Atribuição simplificada: cliente veio de qual canal? (Instagram / Google / Orgânico / Indicação)
- FR-12.7.3 Comparativo mensal: este mês vs. mês anterior por canal
- FR-12.7.4 Custo por novo cliente adquirido por canal
- FR-12.7.5 Projeção de retorno baseada em histórico de campanhas anteriores
- FR-12.7.6 Exportação de relatório de marketing em PDF (mensal)

#### FR-12.8 — Geração de Conteúdo com IA

- FR-12.8.1 Geração de copy para anúncios (headlines, descrições) baseada no serviço selecionado
- FR-12.8.2 Sugestão de hashtags relevantes para posts no Instagram
- FR-12.8.3 Template de post para Instagram Stories e Feed com texto pronto
- FR-12.8.4 Tom de voz configurável: profissional / descontraído / luxo
- FR-12.8.5 Variações A/B: gera 2-3 versões para o proprietário escolher

#### FR-12.9 — Reativação de Clientes Inativos

- FR-12.9.1 Identificação automática de clientes sem visita há mais de X dias (configurável, padrão 90 dias)
- FR-12.9.2 Campanha de reativação via WhatsApp com oferta personalizada
- FR-12.9.3 Segmentação por serviço: ex: clientes de mechas que sumiram → promoção de mechas
- FR-12.9.4 Tracking de conversão: cliente reativado = visita realizada dentro de 30 dias
- FR-12.9.5 Usa o CRM (FR-04) e o Twilio (FR-05) como infraestrutura base

---

## 4. Requisitos Não Funcionais

### NFR-01 — Performance
- Carregamento inicial da web app: menos de 2 segundos (LCP)
- Busca de disponibilidade de horários: menos de 500ms
- Exportação de relatórios fiscais: menos de 10 segundos
- Resposta da interface conversacional de marketing: menos de 3 segundos

### NFR-02 — Segurança
- Autenticação via Supabase Auth (email/senha + 2FA opcional)
- RBAC: proprietário, profissional, cliente (3 roles)
- Dados pessoais protegidos conforme RGPD (Reglamento General de Protección de Datos)
- Comunicação HTTPS obrigatória
- Números de telefone e emails dos clientes nunca expostos publicamente
- Tokens OAuth para Meta Ads e Google Ads armazenados com criptografia (nunca em plaintext)

### NFR-03 — Disponibilidade
- Uptime target: 99.5% (exceto manutenção programada)
- Backups automáticos diários (Supabase)

### NFR-04 — Usabilidade
- Mobile-first: interface responsiva em todos os dispositivos
- Fluência em 4 idiomas: PT, ES, EN, RU
- Onboarding guiado para novo usuário (menos de 10 min para primeira operação)
- Interface conversacional: proprietário sem conhecimento técnico de marketing consegue criar campanha em menos de 5 minutos

### NFR-05 — Conformidade Fiscal
- Percentuais de IVA e IRPF editáveis para adaptação legal futura
- Histórico de transações imutável (audit trail)
- Exportações seguem formato esperado pela AEAT (Agencia Tributaria)

### NFR-06 — Integrações de Marketing
- Tokens OAuth de terceiros (Meta, Google) devem poder ser revogados a qualquer momento pelo proprietário
- Sistema deve operar em modo degradado se APIs de marketing estiverem indisponíveis (sem impacto na agenda)
- Rate limits de cada API respeitados com backoff automático

---

## 5. Fora do Escopo (v1.0)

- Processamento de pagamentos online (Stripe, PayPal) — v2.0
- Gestão de estoque de produtos — v2.0
- Sistema de fidelidade / pontos — v2.0
- Integração com sistemas contábeis (Sage, ContaPlus) — v2.0
- Multi-salão / franquia — v2.0
- Declaração fiscal automática na AEAT — v2.0
- Gestão automática de orçamento de anúncios sem aprovação do proprietário — fora do escopo por design
- Publicação automática de posts orgânicos no Instagram — v2.0
- TikTok Ads / Pinterest Ads — v2.0

---

## 6. Métricas de Sucesso (KPIs)

| Métrica | Meta v1.0 |
|---------|-----------|
| Agendamentos criados/mês | mais de 100 |
| Taxa de não-comparecimento (no-show) | menos de 15% (vs. média setor ~25%) |
| Taxa de conversão lembretes de retorno | mais de 30% |
| Tempo para declaração fiscal trimestral | menos de 30 min (vs. 3-4h manual) |
| NPS do proprietário | mais de 70 |
| Onboarding (primeiro agendamento) | menos de 10 min |
| Tempo para criar primeira campanha de marketing | menos de 5 min |
| Custo por novo cliente via anúncios | menos de 15 EUR |
| Taxa de reativação de clientes inativos | mais de 20% |

---

## 7. Dependências Técnicas

| Dependência | Uso | Custo estimado |
|-------------|-----|----------------|
| Supabase | BD, Auth, Realtime | Gratuito até 500MB |
| Twilio (WhatsApp/SMS) | Notificações operacionais + relatórios de marketing | ~0.05 EUR/mensagem |
| Vercel | Hospedagem web | Gratuito no início |
| Expo EAS | Build app mobile | Gratuito até 30 builds/mês |
| next-intl | i18n web | Open source |
| Meta Ads API | Gestão de campanhas Instagram/Facebook | Gratuito (paga pelos anúncios) |
| Google Ads API | Gestão de campanhas Google | Gratuito (paga pelos anúncios) |
| Google Business Profile API | Monitoramento de avaliações e métricas | Gratuito |
| Claude API (Anthropic) | Geração de copy, interface conversacional, análise | ~0.01-0.05 EUR/conversa |

---

## 8. Riscos do Produto

| Risco | Probabilidade | Impacto | Plano |
|-------|-------------|---------|-------|
| Custo Twilio escalar com volume | Médio | Médio | Limitar lembretes, batch sending |
| Mudança na legislação fiscal espanhola | Baixo | Alto | % editáveis, alertas de atualização |
| App rejeitado nas stores | Baixo | Alto | Seguir guidelines desde início |
| RGPD: vazamento de dados de clientes | Baixo | Alto | Criptografia, audit logs, política privacidade |
| Concorrentes com features similares | Alto | Médio | Foco no nicho espanhol + i18n diferenciado |
| Meta Ads API: mudança de política | Médio | Médio | Arquitetura com abstração de providers |
| Google Ads API: aprovação de conta | Baixo | Alto | Processo de verificação antecipado |
| Custo Claude API escalar com uso | Baixo | Baixo | Rate limiting por salão, caching de respostas comuns |
| Proprietário não adotar interface conversacional | Médio | Médio | UX simplificada + onboarding guiado |

---

## 9. Roadmap

### v1.0 (MVP) — Este documento
- Wave 1: Fundação (auth, configuração do salão, DB schema)
- Wave 2: Agenda + catálogo de serviços
- Wave 3: Portal público de reservas + notificações WhatsApp
- Wave 4: CRM + lembretes de retorno
- Wave 5: Caixa / PDV
- Wave 6: Módulo fiscal (IVA, IRPF, Modelos 303/130)
- Wave 7: Dashboard & KPIs
- Wave 8: Marketing IA — FR-12 completo (interface conversacional, Meta Ads, Google Ads, relatórios WhatsApp, campanhas automáticas)

### v1.1 — App Mobile
Wave 9: App React Native (iOS + Android)

### v2.0 — Expansão

### v2.0 — Expansão
- Pagamentos online (Stripe)
- Gestão de estoque
- Multi-salão / franquia
- Integração contábil (Sage, ContaPlus)
- Posts orgânicos automáticos (Instagram, TikTok)
- TikTok Ads / Pinterest Ads

---

## Change Log

| Data | Autor | Alteração |
|------|-------|-----------|
| 2026-02-25 | @pm (Morgan) | PRD v1.0 criado — 11 FRs, 5 NFRs, 4 idiomas |
| 2026-03-01 | @pm (Morgan) | PRD v1.1 — FR-12 Marketing IA adicionado (9 sub-módulos), NFR-06, dependências técnicas de marketing, riscos atualizados, roadmap revisado |
| 2026-03-01 | @pm (Morgan) | PRD v1.2 — FR-00 Configuração do Salão adicionado, FR-12 promovido para MUST HAVE, segmentação de anúncios corrigida, Roadmap com Waves detalhadas, salão piloto identificado |

---

*— Morgan, planejando o futuro 📊*
