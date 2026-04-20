/**
 * Envio de mensagens via Evolution API v2.
 * Conecta ao WhatsApp Business através de WebSocket (como dispositivo adicional),
 * mantendo o app no celular da proprietária funcionando normalmente.
 *
 * Env vars:
 *   EVOLUTION_API_URL       — URL base da Evolution API (Railway)
 *   EVOLUTION_API_KEY       — API key global
 *   EVOLUTION_INSTANCE_NAME — Nome da instância (ex: "Bellus")
 */

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getEvolutionConfig() {
  return {
    apiUrl: process.env.EVOLUTION_API_URL ?? "",
    apiKey: process.env.EVOLUTION_API_KEY ?? "",
    instanceName: process.env.EVOLUTION_INSTANCE_NAME ?? "Bellus",
  };
}

export function isEvolutionConfigured(): boolean {
  const { apiUrl, apiKey } = getEvolutionConfig();
  return Boolean(apiUrl && apiKey);
}

/**
 * Normaliza número para formato que Evolution API aceita.
 * Remove @s.whatsapp.net, +, espaços, hífens.
 */
function normalizeNumber(phone: string): string {
  return phone
    .replace(/@s\.whatsapp\.net$/, "")
    .replace(/[\s\-()]+/g, "")
    .replace(/^\+/, "");
}

/**
 * Envia mensagem de texto via Evolution API.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<SendResult> {
  const { apiUrl, apiKey, instanceName } = getEvolutionConfig();

  if (!apiUrl || !apiKey) {
    return { success: false, error: "Evolution API not configured" };
  }

  const number = normalizeNumber(to);

  try {
    const res = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data?.message ?? `HTTP ${res.status}` };
    }

    return {
      success: true,
      messageId: data?.key?.id ?? data?.messageId,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Envia resposta pelo canal correto.
 * Instagram ainda não é suportado via Evolution API — só WhatsApp.
 */
export async function sendReply(
  canal: "whatsapp" | "instagram",
  externalId: string,
  text: string
): Promise<SendResult> {
  if (canal === "instagram") {
    return { success: false, error: "Instagram not supported via Evolution API yet" };
  }
  return sendWhatsAppMessage(externalId, text);
}
