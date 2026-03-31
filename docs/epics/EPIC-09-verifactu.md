# EPIC-09 — Módulo Verifactu (Facturación Electrónica Certificada)
**Wave:** 9
**FRs:** FR-09 (Ley Antifraude 11/2021), FR-10 (RD 1007/2023 — SIF), FR-11 (Ley Crea y Crece 18/2022)
**Prioridade:** MUST HAVE (obrigação legal)
**Depende de:** EPIC-05 (Caixa), EPIC-06 (Fiscal)
**Status:** Done

---

## Contexto Legal

A Ley Antifraude (11/2021) + Real Decreto 1007/2023 obrigam TODOS os negócios na Espanha a usar software de faturação certificado (SIF — Sistema Informático de Facturación) com o sistema VERIFACTU.

### Prazos Legais
- **29 Jul 2025:** Desenvolvedores só podem comercializar software adaptado
- **1 Jan 2027:** Empresas (Sociedades) devem usar software certificado
- **1 Jul 2027:** Autónomos devem usar software certificado

### Multas
- Negócio com software não certificado: **€50.000/ano**
- Desenvolvedor que vende software não certificado: **€150.000/ano**

### Referências Legais
- Ley 11/2021 (Ley Antifraude)
- Real Decreto 1007/2023 (Reglamento SIF)
- Orden HAC/1177/2024 (Especificações técnicas XML)
- Ley 18/2022 (Crea y Crece — facturación electrónica B2B)

---

## Objetivo

Tornar o Bellus um software de faturação certificado conforme a Ley Antifraude espanhola, implementando:
1. Sistema de faturas inalteráveis com hash encadeado SHA-256
2. Geração de XML no formato AEAT (Orden HAC/1177/2024)
3. QR Code Verifactu em cada fatura
4. Assinatura eletrónica qualificada
5. Envio automático à AEAT via API Verifactu
6. Registro de eventos (audit log) inalterável
7. Declaración Responsable visível no sistema
8. Página de gestão de faturas no dashboard

---

## Stories

### Fase 1 — Fundação (Schema + Modelo de Dados)
- [x] Story 9.1: Schema DB — tabelas `facturas`, `factura_lineas`, `factura_eventos`
- [x] Story 9.2: Sistema de numeração sequencial de faturas (serie + número)
- [x] Story 9.3: Server actions CRUD para geração de faturas a partir de transações

### Fase 2 — Integridade e Segurança (Hash + Assinatura)
- [x] Story 9.4: Hash SHA-256 encadeado entre faturas (cadeia inalterável)
- [x] Story 9.5: Assinatura eletrónica qualificada (integração certificado digital)
- [x] Story 9.6: Registro de eventos inalterável (audit log SIF)

### Fase 3 — Formato AEAT (XML + QR)
- [x] Story 9.7: Gerador XML formato Verifactu (Orden HAC/1177/2024)
- [x] Story 9.8: QR Code Verifactu em cada fatura (dados-chave codificados)
- [x] Story 9.9: Gerador de PDF de fatura com QR e dados fiscais completos

### Fase 4 — Integração AEAT (API + Envio)
- [x] Story 9.10: Cliente API AEAT — envio automático de registros Verifactu
- [x] Story 9.11: Gestão de estados de envio (pendente, enviado, aceite, rejeitado)
- [x] Story 9.12: Retry e error handling para falhas de comunicação com AEAT

### Fase 5 — Interface de Utilizador
- [x] Story 9.13: Página `/dashboard/facturas` — listagem e filtros de faturas
- [x] Story 9.14: Detalhe de fatura — visualização, download PDF, reenvio à AEAT
- [x] Story 9.15: Geração automática de fatura ao concluir pagamento (integração Caixa)

### Fase 6 — Compliance e Certificação
- [x] Story 9.16: Declaración Responsable — texto legal visível no sistema
- [x] Story 9.17: Fatura retificativa (anulação com novo registro vinculado)
- [x] Story 9.18: Testes E2E do fluxo completo (pagamento → fatura → XML → envio AEAT)

---

## Acceptance Criteria (Epic-level)

- [x] AC-01: Cada transação concluída gera automaticamente uma fatura com número sequencial único
- [x] AC-02: Faturas são inalteráveis — sem UPDATE/DELETE, apenas anulação com retificativa
- [x] AC-03: Hash SHA-256 de cada fatura vinculado à fatura anterior (cadeia íntegra)
- [x] AC-04: XML gerado conforme formato AEAT (Orden HAC/1177/2024) e validado
- [x] AC-05: QR Code Verifactu presente em cada fatura (PDF e tela)
- [x] AC-06: Envio automático à AEAT via API com confirmação de receção
- [x] AC-07: Registro de eventos inalterável rastreia toda operação no sistema
- [x] AC-08: Declaración Responsable visível no sistema conforme regulamento
- [x] AC-09: Fatura retificativa gera novo registro vinculado ao original
- [x] AC-10: `npm run build` sem erros, testes passam

---

## Arquitetura Técnica (Visão Geral)

### Novas Tabelas
```
facturas              — header da fatura (imutável, append-only)
factura_lineas        — linhas/itens da fatura
factura_eventos       — audit log inalterável (SIF events)
factura_envios_aeat   — log de envios à AEAT (status, response)
```

### Novos Arquivos
```
src/app/actions/facturas.ts          — server actions
src/app/actions/verifactu.ts         — envio AEAT
src/lib/verifactu/
  ├── hash.ts                        — SHA-256 encadeado
  ├── xml-builder.ts                 — gerador XML AEAT
  ├── qr-generator.ts                — QR Code Verifactu
  ├── signature.ts                   — assinatura eletrónica
  ├── aeat-client.ts                 — cliente API AEAT
  └── types.ts                       — tipos TypeScript
src/app/(dashboard)/dashboard/facturas/
  ├── page.tsx                       — listagem
  ├── [id]/page.tsx                  — detalhe
  └── factura-pdf.tsx                — gerador PDF
```

### Integrações
- **Caixa (EPIC-05):** Ao concluir pagamento → gerar fatura automaticamente
- **Fiscal (EPIC-06):** IVA/IRPF calculados pela config fiscal existente
- **API AEAT:** Envio XML via SOAP/REST (especificação Verifactu)
- **Certificado Digital:** Assinatura com certificado .p12/.pfx do autónomo

### Opção de API de Terceiros
Para simplificar a assinatura eletrónica e envio à AEAT, considerar integração com APIs como:
- [fiskaly Verifactu API](https://www.fiskaly.com/signes/verifactu)
- [efsta Verifactu API](https://www.efsta.eu/en/solutions/verifactu-api)
- [Invopop Verifactu API](https://www.invopop.com/coverage/verifactu-api)

Decisão a tomar na Story 9.5 (assinatura) e 9.10 (envio AEAT).

---

## Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Especificações técnicas AEAT mudam | Alto | Monitorar BOE e sede.agenciatributaria.gob.es |
| API AEAT em ambiente de testes indisponível | Médio | Implementar mock server para dev/staging |
| Certificado digital do autónomo expirado/inválido | Médio | Validação no upload + alertas de expiração |
| Complexidade do formato XML | Médio | Usar API de terceiros como fallback |
| Requisitos de criptografia no browser | Baixo | Operações de hash/assinatura no server-side |

---

## Estimativa de Complexidade

| Fase | Stories | Complexidade | Story Points |
|------|---------|-------------|-------------|
| 1. Fundação | 9.1 - 9.3 | Média | 13 |
| 2. Integridade | 9.4 - 9.6 | Alta | 21 |
| 3. Formato AEAT | 9.7 - 9.9 | Alta | 21 |
| 4. Integração AEAT | 9.10 - 9.12 | Alta | 21 |
| 5. Interface | 9.13 - 9.15 | Média | 13 |
| 6. Compliance | 9.16 - 9.18 | Média | 13 |
| **TOTAL** | **18 stories** | | **~102 SP** |

---
*@pm (Morgan) — 2026-03-30*
