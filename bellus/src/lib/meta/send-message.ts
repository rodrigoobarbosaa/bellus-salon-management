/**
 * Envio de mensagens via Meta Cloud API (WhatsApp + Instagram).
 * Suporta texto livre (janela 24h) e templates aprovados (proativo).
 */

const GRAPH_API_VERSION = "v21.0";

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Verifica se WhatsApp Meta Cloud API está configurado.
 */
export function isMetaWhatsAppConfigured(): boolean {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  return Boolean(phoneNumberId && accessToken);
}

/**
 * Envia mensagem proativa via template aprovado pela Meta.
 * Obrigatório para iniciar conversa fora da janela de 24h.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  parameters: string[]
): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp not configured" };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const components: Array<Record<string, unknown>> = [];
  if (parameters.length > 0) {
    components.push({
      type: "body",
      parameters: parameters.map((val) => ({ type: "text", text: val })),
    });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/[^0-9]/g, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Envia mensagem de texto via WhatsApp (Meta Cloud API).
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp not configured" };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/^\+/, ""),
        type: "text",
        text: { body: text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Envia mensagem via Instagram Messaging API.
 */
export async function sendInstagramMessage(recipientId: string, text: string): Promise<SendResult> {
  const pageId = process.env.INSTAGRAM_PAGE_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN; // Mesmo token da Meta Business

  if (!pageId || !accessToken) {
    return { success: false, error: "Instagram not configured" };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true, messageId: data?.message_id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Envia resposta pelo canal correto (WhatsApp ou Instagram).
 */
export async function sendReply(
  canal: "whatsapp" | "instagram",
  externalId: string,
  text: string
): Promise<SendResult> {
  if (canal === "whatsapp") {
    return sendWhatsAppMessage(externalId, text);
  }
  return sendInstagramMessage(externalId, text);
}
