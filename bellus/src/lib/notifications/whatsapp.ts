/**
 * WhatsApp Business via Meta Cloud API (Graph API).
 * Substitui Twilio — chamada direta, sem intermediário.
 *
 * Env vars necessárias:
 *   WHATSAPP_PHONE_NUMBER_ID — ID do número na Meta Business
 *   WHATSAPP_ACCESS_TOKEN    — Token permanente da Meta Business
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 */

const GRAPH_API_VERSION = "v21.0";

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  return { phoneNumberId, accessToken };
}

export function isWhatsAppConfigured(): boolean {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();
  return Boolean(phoneNumberId && accessToken);
}

/**
 * Normaliza número de telefone para formato internacional sem '+'.
 * Meta Cloud API espera: "34612345678" (sem +, sem espaços, sem hífens)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]+/g, "").replace(/^\+/, "");
}

/**
 * Envia mensagem de texto simples via WhatsApp (Meta Cloud API).
 */
export async function sendWhatsApp(to: string, message: string): Promise<SendResult> {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp Meta Cloud API not configured" };
  }

  const phone = normalizePhone(to);

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.error?.message ?? data?.error?.error_data?.details ?? `HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Envia mensagem com template aprovado pela Meta.
 * Templates são obrigatórios para iniciar conversas (fora da janela de 24h).
 *
 * @param to       — número destino (ex: "+34612345678")
 * @param template — nome do template aprovado (ex: "booking_confirmation")
 * @param lang     — código idioma (ex: "es", "pt_BR", "en")
 * @param params   — parâmetros do template (substituem {{1}}, {{2}}, etc.)
 */
export async function sendWhatsAppTemplate(
  to: string,
  template: string,
  lang: string,
  params: string[] = []
): Promise<SendResult> {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp Meta Cloud API not configured" };
  }

  const phone = normalizePhone(to);

  const components: Array<Record<string, unknown>> = [];
  if (params.length > 0) {
    components.push({
      type: "body",
      parameters: params.map((p) => ({ type: "text", text: p })),
    });
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: lang },
          components,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.error?.message ?? `HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
