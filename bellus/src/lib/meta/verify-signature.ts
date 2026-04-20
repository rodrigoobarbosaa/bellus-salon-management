import { createHmac } from "crypto";

/**
 * Verifica HMAC SHA-256 do webhook da Meta (X-Hub-Signature-256).
 * Rejeita payloads adulterados.
 */
export function verifyMetaSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;

  const expected = createHmac("sha256", appSecret)
    .update(body, "utf-8")
    .digest("hex");

  return signature === `sha256=${expected}`;
}
