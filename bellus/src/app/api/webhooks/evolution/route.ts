import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { handleIncomingMessage, handleStatusUpdate } from "@/lib/meta/handle-webhook";
import { processWithAI } from "@/lib/chatbot/engine";
import type { IncomingMessage, StatusUpdate } from "@/lib/meta/parse-webhook";

/**
 * POST /api/webhooks/evolution — Recebe webhooks da Evolution API v2.
 *
 * Events relevantes:
 * - messages.upsert: nova mensagem recebida
 * - messages.update: status update (delivered, read)
 * - connection.update: status da conexão (usado para monitoramento)
 */
export async function POST(request: NextRequest) {
  // 1. Verificar autenticação via header ou query param
  const apiKey = request.headers.get("apikey") ?? request.nextUrl.searchParams.get("token");
  const expectedKey = process.env.EVOLUTION_INSTANCE_TOKEN;

  if (expectedKey && apiKey && apiKey !== expectedKey) {
    console.warn("[Evolution Webhook] Invalid apikey");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parsear payload
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string | undefined;

  if (!event) {
    return NextResponse.json({ status: "ok" });
  }

  console.log(`[Evolution Webhook] Event: ${event}`);

  const supabase = createServiceClient();

  // 3. Resolver salao_id (MVP: primeiro salão)
  const salaoId = await resolveSalaoId(supabase);
  if (!salaoId) {
    console.warn("[Evolution Webhook] Could not resolve salao_id");
    return NextResponse.json({ status: "ok" });
  }

  // 4. Processar por tipo de evento (Evolution API v2 usa UPPERCASE)
  const eventNormalized = event.toUpperCase();
  try {
    if (eventNormalized === "MESSAGES_UPSERT" || event === "messages.upsert") {
      await handleMessagesUpsert(supabase, salaoId, body);
    } else if (eventNormalized === "MESSAGES_UPDATE" || event === "messages.update") {
      await handleMessagesUpdate(supabase, body);
    } else if (eventNormalized === "CONNECTION_UPDATE" || event === "connection.update") {
      const state = (body.data as Record<string, unknown>)?.state;
      console.log(`[Evolution Webhook] Connection state: ${state}`);
    }
  } catch (err) {
    console.error(`[Evolution Webhook] Error processing ${event}:`, err);
  }

  return NextResponse.json({ status: "ok" });
}

/**
 * Processa messages.upsert — nova mensagem recebida.
 *
 * Payload Evolution API v2:
 * {
 *   event: "messages.upsert",
 *   instance: "Bellus",
 *   data: {
 *     key: { remoteJid: "34612345678@s.whatsapp.net", fromMe: false, id: "..." },
 *     pushName: "Maria",
 *     message: { conversation: "Hola!" } | { extendedTextMessage: { text: "..." } },
 *     messageType: "conversation" | "extendedTextMessage" | "imageMessage" | "audioMessage",
 *     messageTimestamp: 1703001234
 *   }
 * }
 */
async function handleMessagesUpsert(
  supabase: ReturnType<typeof createServiceClient>,
  salaoId: string,
  body: Record<string, unknown>
) {
  const data = body.data as Record<string, unknown>;
  if (!data) return;

  const key = data.key as { remoteJid?: string; fromMe?: boolean; id?: string } | undefined;
  if (!key?.remoteJid) return;

  // Ignorar mensagens enviadas por nós (fromMe)
  if (key.fromMe) return;

  // Ignorar mensagens de grupos
  if (key.remoteJid.includes("@g.us")) return;

  // Extrair número (remover @s.whatsapp.net)
  const externalId = key.remoteJid.replace(/@s\.whatsapp\.net$/, "");

  // Extrair conteúdo da mensagem
  const message = data.message as Record<string, unknown> | undefined;
  const messageType = data.messageType as string | undefined;

  let conteudo = "";
  let tipo: "texto" | "imagem" | "audio" = "texto";

  if (messageType === "conversation" && message?.conversation) {
    conteudo = message.conversation as string;
  } else if (messageType === "extendedTextMessage") {
    const ext = message?.extendedTextMessage as { text?: string } | undefined;
    conteudo = ext?.text ?? "";
  } else if (messageType === "imageMessage") {
    tipo = "imagem";
    const img = message?.imageMessage as { caption?: string } | undefined;
    conteudo = img?.caption ?? "[imagem]";
  } else if (messageType === "audioMessage") {
    tipo = "audio";
    conteudo = "[audio]";
  } else {
    // Tentar extrair texto de qualquer tipo
    conteudo = (message?.conversation as string) ?? "";
    if (!conteudo) {
      const ext = message?.extendedTextMessage as { text?: string } | undefined;
      conteudo = ext?.text ?? "";
    }
    if (!conteudo) {
      console.log(`[Evolution Webhook] Unsupported messageType: ${messageType}`);
      return;
    }
  }

  if (!conteudo) return;

  // Mapear para o formato IncomingMessage que handle-webhook espera
  const messageTimestamp = data.messageTimestamp as number | undefined;
  const incomingMsg: IncomingMessage = {
    canal: "whatsapp",
    externalId,
    messageId: key.id ?? "",
    timestamp: messageTimestamp ? messageTimestamp * 1000 : Date.now(),
    tipo,
    conteudo,
    metadata: {
      pushName: data.pushName ?? "",
      messageType,
      source: "evolution",
    },
  };

  // Reutilizar a mesma lógica de handle-webhook (encontra/cria conversa, persiste mensagem)
  const result = await handleIncomingMessage(supabase, salaoId, incomingMsg);
  console.log(`[Evolution Webhook] Message from ${externalId} → conversa ${result.conversaId}`);

  // Processar com IA (Claude)
  await processWithAI(supabase, salaoId, result);
}

/**
 * Processa messages.update — status de mensagem (delivered, read).
 *
 * Payload:
 * {
 *   event: "messages.update",
 *   data: { key: { id: "..." }, update: { status: 3 } }
 * }
 *
 * Status codes: 2=sent, 3=delivered, 4=read
 */
async function handleMessagesUpdate(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>
) {
  const data = body.data as Record<string, unknown>;
  if (!data) return;

  const key = data.key as { id?: string } | undefined;
  const update = data.update as { status?: number } | undefined;

  if (!key?.id || !update?.status) return;

  const statusMap: Record<number, StatusUpdate["status"]> = {
    2: "enviada",
    3: "entregue",
    4: "lida",
  };

  const status = statusMap[update.status];
  if (!status) return;

  const remoteJid = (data.key as Record<string, unknown>)?.remoteJid as string | undefined;
  const statusUpdate: StatusUpdate = {
    canal: "whatsapp",
    messageId: key.id,
    status,
    timestamp: Date.now(),
    externalId: remoteJid?.replace(/@s\.whatsapp\.net$/, "") ?? "",
  };

  await handleStatusUpdate(supabase, statusUpdate);
}

async function resolveSalaoId(
  supabase: ReturnType<typeof createServiceClient>
): Promise<string | null> {
  const { data } = await supabase
    .from("saloes")
    .select("id")
    .limit(1)
    .single();

  return (data as { id: string } | null)?.id ?? null;
}
