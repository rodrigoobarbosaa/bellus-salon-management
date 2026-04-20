import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyMetaSignature } from "@/lib/meta/verify-signature";
import { parseMetaWebhook } from "@/lib/meta/parse-webhook";
import { handleIncomingMessage, handleStatusUpdate } from "@/lib/meta/handle-webhook";
import { processWithAI } from "@/lib/chatbot/engine";

/**
 * GET /api/webhooks/meta — Webhook verification (Meta challenge).
 * Meta envia GET com hub.mode, hub.verify_token, hub.challenge.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    console.log("[Meta Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/webhooks/meta — Recebe mensagens e status updates.
 * Processa WhatsApp e Instagram no mesmo endpoint.
 */
export async function POST(request: NextRequest) {
  // 1. Ler body como texto para validação HMAC
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    console.warn("[Meta Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // 2. Parsear payload
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta espera 200 rapidamente — processar async
  // Mas em Vercel serverless, precisamos processar antes de retornar
  const events = parseMetaWebhook(body);

  if (events.length === 0) {
    return NextResponse.json({ status: "ok" });
  }

  const supabase = createServiceClient();

  // 3. Resolver salao_id pelo phone_number_id ou page_id
  const salaoId = await resolveSalaoId(supabase, body);
  if (!salaoId) {
    console.warn("[Meta Webhook] Could not resolve salao_id from webhook payload");
    return NextResponse.json({ status: "ok" });
  }

  // 4. Processar eventos
  for (const event of events) {
    try {
      if (event.type === "message") {
        const result = await handleIncomingMessage(supabase, salaoId, event.data);
        console.log(`[Meta Webhook] Message received: ${result.canal} ${result.externalId} → conversa ${result.conversaId}`);

        // Processar com IA (Claude) e responder ao cliente
        await processWithAI(supabase, salaoId, result);
      } else if (event.type === "status") {
        await handleStatusUpdate(supabase, event.data);
      }
    } catch (err) {
      console.error("[Meta Webhook] Error processing event:", err);
    }
  }

  return NextResponse.json({ status: "ok" });
}

/**
 * Resolve salao_id a partir do payload do webhook.
 * Para WhatsApp: usa phone_number_id → busca na config do salão.
 * Para Instagram: usa page_id → busca na config do salão.
 *
 * MVP: Retorna o primeiro salão (single-tenant simplificado).
 * Multi-tenant: Mapeia phone_number_id/page_id → salao_id via tabela de config.
 */
async function resolveSalaoId(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>
): Promise<string | null> {
  // MVP: pega o primeiro (e provavelmente único) salão
  const { data } = await supabase
    .from("saloes")
    .select("id")
    .limit(1)
    .single();

  return (data as { id: string } | null)?.id ?? null;
}
