# EPIC-10 — Certificacao AEAT (Homologacao Verifactu)

**Wave:** 10
**FRs:** FR-09 (Ley Antifraude 11/2021), FR-10 (RD 1007/2023 — SIF)
**Prioridade:** MUST HAVE (obrigacao legal — prazo 29 Jul 2025)
**Depende de:** EPIC-09 (Verifactu — infraestrutura tecnica)
**Status:** Draft

---

## Contexto

O EPIC-09 implementou toda a infraestrutura tecnica do Verifactu (hash, XML, QR, assinatura, cliente AEAT). Porem, para **comercializar** o Bellus como software certificado SIF, faltam:

1. Validacao XML contra schema oficial XSD da AEAT
2. Gestao de certificado digital (.p12) com UI de upload
3. Testes reais no ambiente de pruebas da AEAT
4. Pagina de diagnostico/health-check para o salao
5. Tratamento robusto de erros AEAT com codigos especificos
6. Documentacao e env vars para onboarding de clientes

### Prazo Legal
- **29 Jul 2025:** Desenvolvedores so podem comercializar software adaptado
- Sem certificacao: multa de **EUR 150.000/ano** ao desenvolvedor

---

## Objetivo

Tornar o Bellus certificavel pela AEAT, colmatando as lacunas entre a implementacao tecnica (EPIC-09) e os requisitos de homologacao do RD 1007/2023.

---

## Stories

### Fase 1 — Validacao e Robustez

- [ ] Story 10.1: Validacao XML contra XSD oficial da AEAT
- [ ] Story 10.2: Mapeamento de codigos de erro AEAT e mensagens ao utilizador
- [ ] Story 10.3: UI de upload e gestao de certificado digital (.p12/.pfx)

### Fase 2 — Integracao Real AEAT

- [ ] Story 10.4: Testes no ambiente de pruebas AEAT com certificado real
- [ ] Story 10.5: Pagina de diagnostico Verifactu (health-check do sistema)

### Fase 3 — Finalizacao

- [ ] Story 10.6: Documentacao tecnica, env vars e guia de onboarding

---

## Acceptance Criteria (Epic-level)

- [ ] AC-01: XML gerado passa validacao contra XSD oficial da AEAT sem erros
- [ ] AC-02: Certificado .p12 pode ser uploaded via UI e fica armazenado de forma segura
- [ ] AC-03: Submissao de fatura ao ambiente de pruebas AEAT retorna `aceptado`
- [ ] AC-04: Erros AEAT sao mapeados para mensagens claras ao utilizador (es/pt)
- [ ] AC-05: Pagina de diagnostico mostra estado de todos os componentes Verifactu
- [ ] AC-06: Documentacao completa permite onboarding de novo salao sem assistencia tecnica
- [ ] AC-07: `npm run build` sem erros, testes passam

---

## Detalhe das Stories

### Story 10.1: Validacao XML contra XSD oficial da AEAT
**Complexidade:** M (5 SP)

**Descricao:** Descarregar o XSD oficial da AEAT e validar todo o XML gerado antes de envio. Qualquer erro de schema deve bloquear o envio e ser reportado.

**Tarefas:**
- Descarregar XSD de `sede.agenciatributaria.gob.es` e armazenar em `src/lib/verifactu/schemas/`
- Instalar lib de validacao XML (ex: `libxmljs2` ou `fast-xml-parser` com schema)
- Validar XML em `submitFacturaToAeat()` antes do envio
- Snapshot tests com XML valido/invalido

---

### Story 10.2: Mapeamento de codigos de erro AEAT
**Complexidade:** S (3 SP)

**Descricao:** Parsear os codigos de erro especificos da AEAT (3000, 3001, etc.) e converter em mensagens claras para o utilizador, em vez de mostrar XML/SOAP cru.

**Tarefas:**
- Criar mapa de codigos de erro AEAT → mensagens i18n
- Melhorar parsing de resposta AEAT (regex → parser XML)
- Mostrar mensagem de erro legivel na UI de detalhe de fatura
- Distinguir erros retryable vs definitivos

---

### Story 10.3: UI de upload e gestao de certificado digital
**Complexidade:** L (8 SP)

**Descricao:** Permitir que o dono do salao faca upload do certificado .p12/.pfx via dashboard, com validacao de validade, extracao de info, e armazenamento seguro.

**Tarefas:**
- Form de upload de .p12 com campo de password na pagina fiscal
- Validacao server-side: formato, password correta, extracao de chave privada e certificado
- Usar `node-forge` para extrair cert completo do P12 (Node.js nativo nao suporta)
- Armazenar chave privada encriptada no Supabase (nao em env var)
- Mostrar info do certificado: titular, emissor, validade, dias restantes
- Alerta visual quando certificado expira em < 30 dias
- Gestao por salao (cada salao tem o seu certificado)

---

### Story 10.4: Testes no ambiente de pruebas AEAT
**Complexidade:** L (8 SP)

**Descricao:** Testar o fluxo completo contra o ambiente de pruebas real da AEAT, usando certificado de teste. Validar que a AEAT aceita os XMLs gerados pelo Bellus.

**Tarefas:**
- Obter certificado de teste da AEAT (sede electronica)
- Configurar ambiente para pruebas (`AEAT_VERIFACTU_ENV=pruebas`)
- Submeter RegistroAlta e verificar resposta `aceptado`
- Submeter RegistroAnulacion e verificar resposta
- Testar cenarios de erro: NIF invalido, XML malformado, cert expirado
- Documentar resultados dos testes

---

### Story 10.5: Pagina de diagnostico Verifactu
**Complexidade:** M (5 SP)

**Descricao:** Dashboard de health-check que mostra ao dono do salao se todos os componentes Verifactu estao funcionais: certificado, cadeia de hash, faturas pendentes, ultimo envio AEAT.

**Tarefas:**
- Nova pagina `/dashboard/fiscal/diagnostico` ou seccao na pagina fiscal
- Checks: certificado valido, cadeia de hash integra, faturas pendentes, ultimo envio OK
- Semaforo verde/amarelo/vermelho por componente
- Botao "Testar conexao AEAT" (envia ping ao ambiente configurado)
- Estatisticas: total faturas, aceites, rejeitadas, pendentes

---

### Story 10.6: Documentacao e guia de onboarding
**Complexidade:** S (3 SP)

**Descricao:** Documentar tudo o que um novo salao precisa para activar o Verifactu: obter certificado digital, fazer upload, configurar, e verificar.

**Tarefas:**
- Guia passo-a-passo: como obter certificado digital na FNMT
- Adicionar env vars AEAT ao `.env.example` com comentarios
- FAQ: problemas comuns (certificado expirado, AEAT indisponivel, XML rejeitado)
- In-app onboarding wizard ou checklist na pagina fiscal

---

## Estimativa de Complexidade

| Fase | Stories | Complexidade | Story Points |
|------|---------|-------------|-------------|
| 1. Validacao e Robustez | 10.1 - 10.3 | Media-Alta | 16 |
| 2. Integracao Real | 10.4 - 10.5 | Alta | 13 |
| 3. Finalizacao | 10.6 | Baixa | 3 |
| **TOTAL** | **6 stories** | | **~32 SP** |

---

## Riscos

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Ambiente pruebas AEAT indisponivel | Alto | Manter mock server como fallback |
| XSD oficial muda sem aviso | Medio | Monitorar sede.agenciatributaria.gob.es |
| Certificado de teste dificil de obter | Medio | Usar certificado de pruebas FNMT |
| node-forge pesado para bundle | Baixo | Usar apenas server-side |

---
*@aios-master (Orion) — 2026-03-31*
