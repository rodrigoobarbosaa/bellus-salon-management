# ADR: Verifactu — Assinatura Eletrónica (Build vs Buy)

**Data:** 2026-03-30
**Status:** Accepted
**Decisão:** Build local (Node.js crypto) com opção futura de API terceiros

---

## Contexto

O RD 1007/2023 exige que faturas Verifactu sejam assinadas com certificado digital qualificado. Avaliamos duas abordagens:

### Opção A: Build Local (Node.js crypto)
- Usar `node:crypto` para assinar o hash SHA-256 com chave privada do certificado .p12/.pfx
- Chave privada extraída do .p12 no momento do upload, armazenada encriptada
- **Custo:** €0/mês
- **Complexidade:** Média — parsing de .p12, gestão de certificados, alerta expiração
- **Controlo:** Total — sem dependência de terceiros

### Opção B: API Terceiros (fiskaly/efsta/Invopop)
- fiskaly: €49-199/mês, API completa (assinatura + envio AEAT)
- efsta: Preço sob consulta, certificação completa
- Invopop (gobl.org): Open-source, mas requer self-hosting
- **Custo:** €50-200/mês
- **Complexidade:** Baixa — SDK pronto
- **Controlo:** Limitado — dependência do provider

## Decisão

**Build Local** para MVP, com interface preparada para swap futuro.

### Razões:
1. **Custo zero** — Bellus é um produto em fase inicial, custos fixos devem ser minimizados
2. **Independência** — Sem vendor lock-in, sem downtime de terceiros
3. **Node.js crypto é suficiente** — RSA-SHA256 é standard, não precisa de lib externa
4. **Interface abstrata** — `signFacturaHash()` pode ser redirecionada para API externa no futuro sem alterar o fluxo
5. **Modo degradado** — Sistema funciona sem certificado (firma_digital=null), permitindo adoção gradual

### Riscos mitigados:
- Certificado expirado → Alerta no dashboard 30 dias antes
- Sem certificado → Modo degradado com warning (não bloqueia operação)
- Migração futura → Interface `SignatureProvider` permite swap para fiskaly/efsta

## Consequências

- O proprietário precisa de um certificado digital qualificado (FNMT, Camerfirma, etc.)
- Upload do .p12 na UI de configurações fiscais (implementação futura)
- Para MVP, a chave privada PEM é armazenada encriptada via env var
- Se o volume justificar, migrar para fiskaly no futuro (interface já preparada)
