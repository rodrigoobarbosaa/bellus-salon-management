import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSalonContext } from "@/app/actions/marketing";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, conversationId } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "Messages required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get salon context for the system prompt
  const context = await getSalonContext();

  const systemPrompt = buildSystemPrompt(context);

  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role,
    content: m.content,
  }));

  // Call Claude API with streaming
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude API error:", errorText);
    return new Response(
      JSON.stringify({ error: "Error communicating with AI" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
                  );
                }
                if (parsed.type === "message_stop") {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`));
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof getSalonContext>>) {
  const salonName = context?.salao?.nome || "el salon";
  const address = context?.salao?.endereco || "Valencia, Espanha";
  const services = context?.servicos
    ?.map((s) => `- ${s.nome}: ${s.preco_base} EUR (${s.duracao_minutos}min, ${s.categoria})`)
    .join("\n") || "No hay servicios registrados";
  const totalClients = context?.totalClientes || 0;
  const recentAppointments = context?.agendamentosUltimos30Dias || 0;
  const activeCampaigns = context?.campanhasAtivas
    ?.map((c) => `- ${c.nome} (${c.plataforma}, ${c.status})`)
    .join("\n") || "No hay campanhas activas";

  return `Eres el asistente de marketing IA de Bellus, un sistema de gestion de salon de belleza.

CONTEXTO DEL SALON:
- Nombre: ${salonName}
- Ubicacion: ${address}
- Total de clientes: ${totalClients}
- Citas en los ultimos 30 dias: ${recentAppointments}

SERVICIOS DISPONIBLES:
${services}

CAMPANHAS ACTIVAS:
${activeCampaigns}

TU ROL:
1. Ayudar al propietario con estrategias de marketing en lenguaje simple
2. Sugerir campanhas de Instagram (Meta Ads) y Google Ads
3. Generar textos publicitarios (copy) para anuncios
4. Analizar datos del salon y proponer acciones concretas
5. Responder en el idioma del usuario (espanol o portugues)

REGLAS:
- Se conciso y practico. El propietario no tiene conocimientos de marketing digital.
- Siempre incluye presupuesto estimado cuando propongas una campanha.
- Sugiere segmentacion local (radio 5km de Valencia por defecto).
- Nunca ejecutes acciones automaticamente — siempre pide confirmacion.
- Si el usuario dice "aprueba" o "aprova", confirma la accion que vas a realizar.
- Usa datos reales del salon para personalizar las sugerencias.`;
}
