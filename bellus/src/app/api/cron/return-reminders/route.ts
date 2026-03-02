import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send-notification";
import { getReturnReminderTemplate, renderTemplate } from "@/lib/notifications/templates";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

/**
 * GET /api/cron/return-reminders
 * Sends return reminder notifications to clients whose proximo_retorno <= today
 * and who don't have a future appointment.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch clients with proximo_retorno <= today, not opted out, with phone
  const { data: clientes } = await db(supabase)
    .from("clientes")
    .select("id, salao_id, nome, telefone, idioma_preferido, proximo_retorno")
    .lte("proximo_retorno", today)
    .eq("opt_out_notificacoes", false)
    .neq("telefone", "");

  if (!clientes || (clientes as unknown[]).length === 0) {
    return NextResponse.json({ sent: 0, message: "No return reminders to send" });
  }

  const items = clientes as Array<{
    id: string;
    salao_id: string;
    nome: string;
    telefone: string;
    idioma_preferido: string;
    proximo_retorno: string;
  }>;

  let sent = 0;
  let skipped = 0;

  for (const cl of items) {
    // Check if client already has a future appointment
    const { data: futureAg } = await db(supabase)
      .from("agendamentos")
      .select("id")
      .eq("cliente_id", cl.id)
      .in("status", ["pendente", "confirmado"])
      .gte("data_hora_inicio", new Date().toISOString())
      .limit(1);

    if (futureAg && (futureAg as unknown[]).length > 0) {
      // Client already has upcoming appointment — clear proximo_retorno
      await db(supabase)
        .from("clientes")
        .update({ proximo_retorno: null })
        .eq("id", cl.id);
      skipped++;
      continue;
    }

    // Check if return reminder already sent recently (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentReminder } = await db(supabase)
      .from("notificacoes_log")
      .select("id")
      .eq("cliente_id", cl.id)
      .eq("tipo", "lembrete_retorno")
      .gte("created_at", sevenDaysAgo.toISOString())
      .limit(1);

    if (recentReminder && (recentReminder as unknown[]).length > 0) {
      skipped++;
      continue;
    }

    // Get salon info for template
    const { data: salao } = await db(supabase)
      .from("saloes")
      .select("nome, slug")
      .eq("id", cl.salao_id)
      .single();

    const salaoNome = (salao as { nome: string; slug: string } | null)?.nome ?? "";
    const salaoSlug = (salao as { nome: string; slug: string } | null)?.slug ?? "";

    // Check for custom template
    const { data: customTpl } = await db(supabase)
      .from("notification_templates")
      .select("template")
      .eq("salao_id", cl.salao_id)
      .eq("tipo", "lembrete_retorno")
      .eq("idioma", cl.idioma_preferido)
      .single();

    const template = getReturnReminderTemplate(
      cl.idioma_preferido,
      (customTpl as { template: string } | null)?.template
    );

    const bookingUrl = salaoSlug
      ? `${process.env.NEXT_PUBLIC_APP_URL || "https://bellus.app"}/booking/${salaoSlug}`
      : "";

    const message = renderTemplate(template, {
      nome_cliente: cl.nome,
      salao: salaoNome,
      link_booking: bookingUrl,
    });

    await sendNotification({
      supabase,
      salaoId: cl.salao_id,
      clienteId: cl.id,
      agendamentoId: null,
      telefone: cl.telefone,
      tipo: "lembrete_retorno",
      message,
    });

    sent++;
  }

  return NextResponse.json({ sent, skipped, total: items.length });
}
