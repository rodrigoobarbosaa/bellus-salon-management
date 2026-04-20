/**
 * Envio de mensagens via Meta Cloud API (WhatsApp + Instagram).
 * Usado pelo chatbot para responder aos clientes.
 */

const GRAPH_API_VERSION = "v21.0";

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
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
