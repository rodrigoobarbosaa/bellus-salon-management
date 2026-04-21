/**
 * Motor conversacional — conecta Claude AI com as tools de agendamento.
 * Recebe mensagem do cliente, processa com Claude, executa tools, responde.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CHATBOT_TOOLS, executeTool } from "./tools";
import { sendReply } from "@/lib/evolution/send-message";

interface ConversationContext {
  conversaId: string;
  mensagemId: string;
  clienteId: string | null;
  estado: string;
  contexto: Record<string, unknown>;
  canal: "whatsapp" | "instagram";
  externalId: string;
  conteudo: string;
  tipo: string;
}

interface MessageHistoryItem {
  role: "user" | "assistant";
  content: string;
}

const MAX_TOOL_ROUNDS = 5;

/**
 * Processa uma mensagem recebida com Claude e responde ao cliente.
 */
export async function processWithAI(
  supabase: SupabaseClient,
  salaoId: string,
  ctx: ConversationContext
) {
  console.log(`[Chatbot] processWithAI called for conversa ${ctx.conversaId}, estado=${ctx.estado}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[Chatbot] ANTHROPIC_API_KEY not configured, skipping AI processing");
    return;
  }

  console.log("[Chatbot] API key found, length:", apiKey.length);

  // Se conversa está em modo "aguardando_humano", não processar com IA
  if (ctx.estado === "aguardando_humano") {
    console.log("[Chatbot] Conversa em modo aguardando_humano, skipping");
    return;
  }

  // Buscar contexto do salão
  const salonContext = await getSalonContext(supabase, salaoId);
  console.log("[Chatbot] Salon context:", salonContext.nome);

  // Buscar histórico recente da conversa (últimas 20 mensagens)
  const history = await getConversationHistory(supabase, ctx.conversaId);

  // Construir system prompt
  const systemPrompt = buildSystemPrompt(salonContext, ctx);

  // Construir mensagens (histórico + mensagem atual)
  const messages: MessageHistoryItem[] = [
    ...history,
    { role: "user", content: ctx.conteudo },
  ];

  // Chamar Claude com tool use (loop até não haver mais tool calls)
  console.log("[Chatbot] Calling Claude API...");
  let response: ClaudeResponse;
  try {
    response = await callClaude(apiKey, systemPrompt, messages, CHATBOT_TOOLS);
    console.log("[Chatbot] Claude response, stopReason:", response.stopReason, "blocks:", response.content.length);
  } catch (err) {
    console.error("[Chatbot] Claude API error:", err);
    return;
  }
  let rounds = 0;

  while (response.stopReason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];

    for (const block of response.content) {
      if (block.type === "tool_use") {
        // Verificar escalação para humano
        if (block.name === "escalar_para_humano") {
          await supabase
            .from("conversas")
            .update({ estado: "aguardando_humano" })
            .eq("id", ctx.conversaId);

          const motivo = (block.input as Record<string, unknown>).motivo as string;
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id!,
            content: JSON.stringify({ escalado: true, motivo }),
          });
          continue;
        }

        const result = await executeTool(supabase, salaoId, block.name!, block.input as Record<string, unknown>);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id!,
          content: result,
        });
      }
    }

    // Continuar conversa com resultados das tools
    response = await callClaudeWithToolResults(
      apiKey, systemPrompt, messages, response.content, toolResults, CHATBOT_TOOLS
    );
  }

  // Extrair texto da resposta
  const replyText = response.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { type: string; text?: string }) => b.text ?? "")
    .join("\n")
    .trim();

  if (!replyText) {
    console.log("[Chatbot] No reply text extracted from Claude response");
    return;
  }

  console.log("[Chatbot] Reply:", replyText.substring(0, 100));

  // Enviar resposta ao cliente
  const sendResult = await sendReply(ctx.canal, ctx.externalId, replyText);
  console.log("[Chatbot] Send result:", JSON.stringify(sendResult));

  // Persistir resposta no histórico
  await supabase
    .from("conversas_mensagens")
    .insert({
      conversa_id: ctx.conversaId,
      salao_id: salaoId,
      direcao: "enviada",
      tipo: "texto",
      conteudo: replyText,
      meta_message_id: sendResult.messageId ?? null,
      status: sendResult.success ? "enviada" : "falhou",
    });

  // Atualizar contexto da conversa
  await supabase
    .from("conversas")
    .update({ ultima_mensagem_em: new Date().toISOString() })
    .eq("id", ctx.conversaId);
}

// --- Helpers ---

async function getSalonContext(supabase: SupabaseClient, salaoId: string) {
  const { data: salao } = await supabase
    .from("saloes")
    .select("nome, endereco, telefone, horario_funcionamento, moeda")
    .eq("id", salaoId)
    .single();

  const s = salao as {
    nome: string; endereco: string | null; telefone: string | null;
    horario_funcionamento: Record<string, unknown> | null; moeda: string | null;
  } | null;

  return {
    nome: s?.nome ?? "Salão",
    endereco: s?.endereco ?? "",
    telefone: s?.telefone ?? "",
    horarios: s?.horario_funcionamento ?? {},
    moeda: s?.moeda ?? "EUR",
  };
}

async function getConversationHistory(
  supabase: SupabaseClient,
  conversaId: string
): Promise<MessageHistoryItem[]> {
  const { data } = await supabase
    .from("conversas_mensagens")
    .select("direcao, conteudo")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: true })
    .limit(20);

  return ((data ?? []) as Array<{ direcao: string; conteudo: string | null }>)
    .filter(m => m.conteudo)
    .map(m => ({
      role: m.direcao === "recebida" ? "user" as const : "assistant" as const,
      content: m.conteudo!,
    }));
}

function buildSystemPrompt(
  salon: { nome: string; endereco: string; telefone: string; horarios: Record<string, unknown>; moeda: string },
  ctx: ConversationContext
): string {
  const hoje = new Date().toISOString().split("T")[0];
  const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const diaSemana = diasSemana[new Date().getDay()];

  return `Eres la asistente virtual de ${salon.nome}, un salón de belleza.
Tu nombre es Bellus y tu trabajo es ayudar a los clientes a agendar citas, consultar disponibilidad y responder preguntas sobre los servicios.

INFORMACIÓN DEL SALÓN:
- Nombre: ${salon.nome}
- Dirección: ${salon.endereco}
- Teléfono: ${salon.telefone}
- Moneda: ${salon.moeda}
- Horarios: ${JSON.stringify(salon.horarios)}

HOY: ${hoje} (${diaSemana})
CANAL: ${ctx.canal}
${ctx.clienteId ? `CLIENTE IDENTIFICADO: ID ${ctx.clienteId}` : "CLIENTE NUEVO (no identificado)"}
${ctx.canal === "whatsapp" ? `TELÉFONO DEL CLIENTE: ${ctx.externalId}` : `INSTAGRAM ID: ${ctx.externalId}`}

REGLAS:
1. Responde SIEMPRE en el idioma del cliente (detecta automáticamente: español, portugués, inglés, ruso).
2. Sé amable, concisa y profesional. Usa emojis con moderación (máximo 2 por mensaje).
3. Para agendar: primero pregunta qué servicio quiere, luego usa las tools para verificar disponibilidad.
4. NUNCA inventes horarios o precios — usa SIEMPRE las tools para consultar datos reales.
5. Antes de crear un agendamiento, CONFIRMA con el cliente: servicio, fecha, hora y profesional.
6. Si el cliente pregunta algo que no sabes o quiere hablar con un humano, usa la tool "escalar_para_humano".
7. Mensajes cortos (máximo 300 caracteres por mensaje). Divide si necesario.
8. Si el cliente dice "cancelar", busca sus citas y confirma cuál cancelar.
9. No compartas información de otros clientes ni datos sensibles del salón.
10. Si recibes audio o imagen, pide al cliente que escriba el mensaje en texto.`;
}

// --- Claude API Calls ---

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

interface ClaudeResponse {
  content: ContentBlock[];
  stopReason: string;
}

async function callClaude(
  apiKey: string,
  system: string,
  messages: MessageHistoryItem[],
  tools: typeof CHATBOT_TOOLS
): Promise<ClaudeResponse> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[Chatbot] Claude API error:", res.status, JSON.stringify(data).substring(0, 500));
    return { content: [], stopReason: "error" };
  }
  return {
    content: data.content ?? [],
    stopReason: data.stop_reason ?? "end_turn",
  };
}

async function callClaudeWithToolResults(
  apiKey: string,
  system: string,
  originalMessages: MessageHistoryItem[],
  assistantContent: ContentBlock[],
  toolResults: Array<{ type: string; tool_use_id: string; content: string }>,
  tools: typeof CHATBOT_TOOLS
): Promise<ClaudeResponse> {
  const messages = [
    ...originalMessages.map(m => ({ role: m.role, content: m.content })),
    { role: "assistant", content: assistantContent },
    { role: "user", content: toolResults },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages,
      tools,
    }),
  });

  const data = await res.json();
  return {
    content: data.content ?? [],
    stopReason: data.stop_reason ?? "end_turn",
  };
}
