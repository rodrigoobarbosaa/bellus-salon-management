/**
 * Parsers para webhooks Meta (WhatsApp Cloud API + Instagram Messaging API).
 * Extrai mensagens e status updates dos payloads da Meta.
 */

// --- Types ---

export interface IncomingMessage {
  canal: "whatsapp" | "instagram";
  externalId: string;       // phone number (WA) or instagram scoped ID (IG)
  messageId: string;        // Meta message ID
  timestamp: number;
  tipo: "texto" | "imagem" | "audio" | "interativo";
  conteudo: string;         // text body, caption, or interactive selection
  metadata: Record<string, unknown>;
}

export interface StatusUpdate {
  canal: "whatsapp" | "instagram";
  messageId: string;
  status: "enviada" | "entregue" | "lida" | "falhou";
  timestamp: number;
  externalId: string;
}

export type WebhookEvent =
  | { type: "message"; data: IncomingMessage }
  | { type: "status"; data: StatusUpdate };

// --- WhatsApp Parser ---

function parseWhatsAppMessages(entry: Record<string, unknown>): WebhookEvent[] {
  const events: WebhookEvent[] = [];
  const changes = (entry.changes ?? []) as Array<Record<string, unknown>>;

  for (const change of changes) {
    const value = change.value as Record<string, unknown> | undefined;
    if (!value) continue;

    // Messages
    const messages = (value.messages ?? []) as Array<Record<string, unknown>>;
    for (const msg of messages) {
      const tipo = mapWhatsAppType(msg.type as string);
      const conteudo = extractWhatsAppContent(msg);

      events.push({
        type: "message",
        data: {
          canal: "whatsapp",
          externalId: msg.from as string,
          messageId: msg.id as string,
          timestamp: Number(msg.timestamp) * 1000,
          tipo,
          conteudo,
          metadata: { raw_type: msg.type },
        },
      });
    }

    // Status updates
    const statuses = (value.statuses ?? []) as Array<Record<string, unknown>>;
    for (const s of statuses) {
      events.push({
        type: "status",
        data: {
          canal: "whatsapp",
          messageId: s.id as string,
          status: mapWhatsAppStatus(s.status as string),
          timestamp: Number(s.timestamp) * 1000,
          externalId: s.recipient_id as string,
        },
      });
    }
  }

  return events;
}

function mapWhatsAppType(type: string): IncomingMessage["tipo"] {
  switch (type) {
    case "text": return "texto";
    case "image": return "imagem";
    case "audio": case "voice": return "audio";
    case "interactive": case "button": return "interativo";
    default: return "texto";
  }
}

function extractWhatsAppContent(msg: Record<string, unknown>): string {
  const type = msg.type as string;

  if (type === "text") {
    return ((msg.text as Record<string, unknown>)?.body as string) ?? "";
  }
  if (type === "interactive") {
    const interactive = msg.interactive as Record<string, unknown>;
    const buttonReply = interactive?.button_reply as Record<string, unknown>;
    const listReply = interactive?.list_reply as Record<string, unknown>;
    return (buttonReply?.title ?? listReply?.title ?? buttonReply?.id ?? listReply?.id ?? "") as string;
  }
  if (type === "image") {
    return ((msg.image as Record<string, unknown>)?.caption as string) ?? "[imagem]";
  }
  if (type === "button") {
    return ((msg.button as Record<string, unknown>)?.text as string) ?? "";
  }
  return `[${type}]`;
}

function mapWhatsAppStatus(status: string): StatusUpdate["status"] {
  switch (status) {
    case "sent": return "enviada";
    case "delivered": return "entregue";
    case "read": return "lida";
    case "failed": return "falhou";
    default: return "enviada";
  }
}

// --- Instagram Parser ---

function parseInstagramMessages(entry: Record<string, unknown>): WebhookEvent[] {
  const events: WebhookEvent[] = [];
  const messaging = (entry.messaging ?? []) as Array<Record<string, unknown>>;

  for (const event of messaging) {
    const sender = event.sender as Record<string, unknown>;
    const message = event.message as Record<string, unknown> | undefined;

    if (message) {
      const attachments = (message.attachments ?? []) as Array<Record<string, unknown>>;
      const hasImage = attachments.some((a) => a.type === "image");
      const hasAudio = attachments.some((a) => a.type === "audio");

      events.push({
        type: "message",
        data: {
          canal: "instagram",
          externalId: sender.id as string,
          messageId: message.mid as string,
          timestamp: Number(event.timestamp),
          tipo: hasImage ? "imagem" : hasAudio ? "audio" : "texto",
          conteudo: (message.text as string) ?? "[media]",
          metadata: { attachments: attachments.length > 0 ? attachments : undefined },
        },
      });
    }
  }

  return events;
}

// --- Main Parser ---

export function parseMetaWebhook(body: Record<string, unknown>): WebhookEvent[] {
  const object = body.object as string;
  const entries = (body.entry ?? []) as Array<Record<string, unknown>>;
  const events: WebhookEvent[] = [];

  for (const entry of entries) {
    if (object === "whatsapp_business_account") {
      events.push(...parseWhatsAppMessages(entry));
    } else if (object === "instagram") {
      events.push(...parseInstagramMessages(entry));
    }
  }

  return events;
}
