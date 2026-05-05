import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send-notification";
import { getReviewRequestTemplate, renderTemplate } from "@/lib/notifications/templates";

/**
 * GET /api/test-review?secret=xxx
 * Temporary endpoint to test review sending in production.
 * DELETE THIS AFTER DEBUGGING.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const clienteId = "bd55d9f4-9de1-48aa-bbe2-9ff2b1a00a27"; // Rodrigo
  const agendamentoId = "3a8408f7-9663-4d7c-8e3f-24639e10ebbd";
  const salaoId = "c57bc750-e19a-47e3-ba23-48c8cba2f382";

  const logs: string[] = [];

  logs.push("1. Fetching client...");
  const { data: cliente, error: clErr } = await svc
    .from("clientes")
    .select("nome, telefone, idioma_preferido, opt_out_notificacoes")
    .eq("id", clienteId)
    .single();

  if (clErr) {
    logs.push(`Client error: ${clErr.message}`);
    return NextResponse.json({ logs });
  }

  const cl = cliente as { nome: string; telefone: string | null; idioma_preferido: string; opt_out_notificacoes?: boolean };
  logs.push(`Client: ${cl.nome}, phone: ${cl.telefone}`);

  if (!cl.telefone) {
    logs.push("SKIP: no phone");
    return NextResponse.json({ logs });
  }

  logs.push("2. Fetching salon...");
  const { data: salao, error: sErr } = await svc
    .from("saloes")
    .select("nome, link_google_reviews")
    .eq("id", salaoId)
    .single();

  if (sErr) {
    logs.push(`Salon error: ${sErr.message}`);
    return NextResponse.json({ logs });
  }

  const s = salao as { nome: string; link_google_reviews: string | null };
  logs.push(`Salon: ${s.nome}, link present: ${!!s.link_google_reviews}`);

  if (!s.link_google_reviews) {
    logs.push("SKIP: no review link");
    return NextResponse.json({ logs });
  }

  logs.push("3. Rendering template...");
  const idioma = cl.idioma_preferido || "es";
  const template = getReviewRequestTemplate(idioma);
  const message = renderTemplate(template, {
    nome_cliente: cl.nome,
    salao: s.nome,
    link_reviews: s.link_google_reviews,
  });
  logs.push(`Message length: ${message.length}`);

  logs.push("4. Sending notification...");
  try {
    await sendNotification({
      supabase: svc,
      salaoId,
      clienteId,
      agendamentoId: agendamentoId + "-test",
      telefone: cl.telefone,
      tipo: "review_request",
      message,
    });
    logs.push("5. SENT OK");
  } catch (err) {
    logs.push(`5. ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({ logs });
}
