import crypto from "crypto";

const SECRET =
  process.env.CRON_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "fallback-secret";

export function generateOptOutToken(clientId: string): string {
  return crypto.createHmac("sha256", SECRET).update(clientId).digest("hex");
}

export function verifyOptOutToken(clientId: string, token: string): boolean {
  const expected = generateOptOutToken(clientId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
