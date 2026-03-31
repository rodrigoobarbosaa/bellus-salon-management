import { createSign, createVerify, createPrivateKey, createPublicKey, X509Certificate } from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Assinatura eletrónica de faturas Verifactu.
 * Usa Node.js crypto (RSA-SHA256) com certificado digital qualificado.
 *
 * ADR: docs/architecture/adr-verifactu-signature.md
 * Decisão: Build local com interface preparada para swap futuro.
 */

export interface SignatureResult {
  firma_digital: string | null;
  signed: boolean;
  warning?: string;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  valid_from: string;
  valid_to: string;
  days_until_expiry: number;
  expired: boolean;
}

/**
 * Assina o hash de uma fatura com a chave privada do certificado.
 * Retorna a assinatura em Base64 ou null em modo degradado.
 *
 * @param hash - Hash SHA-256 da fatura (hex string, 64 chars)
 * @param privateKeyPem - Chave privada PEM do certificado
 * @returns SignatureResult com firma_digital em Base64
 */
export function signFacturaHash(
  hash: string,
  privateKeyPem: string | null
): SignatureResult {
  if (!privateKeyPem) {
    return {
      firma_digital: null,
      signed: false,
      warning: "Certificado digital não configurado. Fatura criada sem assinatura eletrónica.",
    };
  }

  try {
    const key = createPrivateKey(privateKeyPem);
    const signer = createSign("SHA256");
    signer.update(hash, "utf8");
    const signature = signer.sign(key, "base64");

    return { firma_digital: signature, signed: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      firma_digital: null,
      signed: false,
      warning: `Erro ao assinar fatura: ${msg}`,
    };
  }
}

/**
 * Verifica a assinatura de uma fatura com a chave pública do certificado.
 *
 * @param hash - Hash SHA-256 da fatura (hex string)
 * @param firmaDigital - Assinatura em Base64
 * @param publicKeyPem - Chave pública PEM do certificado
 * @returns true se a assinatura é válida
 */
export function verifyFacturaSignature(
  hash: string,
  firmaDigital: string,
  publicKeyPem: string
): boolean {
  try {
    const key = createPublicKey(publicKeyPem);
    const verifier = createVerify("SHA256");
    verifier.update(hash, "utf8");
    return verifier.verify(key, firmaDigital, "base64");
  } catch {
    return false;
  }
}

/**
 * Extrai a chave privada de um ficheiro .p12/.pfx (PKCS12).
 * Requer Node.js 16+ com suporte a PKCS12.
 *
 * @param p12Buffer - Buffer do ficheiro .p12
 * @param password - Password do certificado
 * @returns Chave privada em formato PEM
 */
export function extractPrivateKeyFromP12(
  p12Buffer: Buffer,
  password: string
): { privateKeyPem: string; certificatePem: string } {
  const key = createPrivateKey({
    key: p12Buffer,
    format: "pkcs12" as unknown as "pem",
    passphrase: password,
  });

  const privateKeyPem = key.export({ type: "pkcs8", format: "pem" }) as string;

  // Extrair certificado público
  // Note: Node.js não extrai o cert do PKCS12 diretamente,
  // para produção considerar node-forge para parsing completo
  return { privateKeyPem, certificatePem: "" };
}

/**
 * Obtém informações do certificado X.509 (expiração, subject, etc.)
 */
export function getCertificateInfo(certPem: string): CertificateInfo | null {
  try {
    const cert = new X509Certificate(certPem);
    const validTo = new Date(cert.validTo);
    const now = new Date();
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      subject: cert.subject,
      issuer: cert.issuer,
      valid_from: cert.validFrom,
      valid_to: cert.validTo,
      days_until_expiry: daysUntilExpiry,
      expired: daysUntilExpiry < 0,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica se o certificado do salão está próximo da expiração (< 30 dias).
 */
export function isCertificateExpiringSoon(certInfo: CertificateInfo): boolean {
  return certInfo.days_until_expiry < 30 && !certInfo.expired;
}

/**
 * Obtém a chave privada PEM configurada para o salão.
 * Busca na env var VERIFACTU_PRIVATE_KEY_PEM ou retorna null (modo degradado).
 *
 * Futuro: buscar do Supabase Storage (encriptado) por salão.
 */
export async function getSalaoPrivateKey(salaoId: string): Promise<string | null> {
  // MVP: chave privada global via env var
  // Produção: buscar encriptada do Supabase Storage por salão
  const envKey = process.env.VERIFACTU_PRIVATE_KEY_PEM;
  if (envKey) return envKey;

  // Tentar buscar do Supabase (futura implementação)
  // const supabase = await createClient();
  // const { data } = await supabase.storage...

  return null; // Modo degradado
}
