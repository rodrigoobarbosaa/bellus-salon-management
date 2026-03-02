import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send-notification";
import { getReminderTemplate, renderTemplate } from "@/lib/notifications/templates";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

/**
 * GET /api/cron/reminders
 * Sends 24h reminder notifications for upcoming appointments.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Window: appointments between 23h and 25h from now
  const now = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Fetch eligible appointments (confirmed or pendente, not cancelled)
  const { data: agendamentos } = await db(supabase)
    .from("agendamentos")
    .select(`
      id,
      salao_id,
      cliente_id,
      profissional_id,
      servico_id,
      data_hora_inicio,
      status
    `)
    .in("status", ["pendente", "confirmado"])
    .gte("data_hora_inicio", from.toISOString())
    .lte("data_hora_inicio", to.toISOString());

  if (!agendamentos || (agendamentos as unknown[]).length === 0) {
    return NextResponse.json({ sent: 0, message: "No reminders to send" });
  }

  const items = agendamentos as Array<{
    id: string;
    salao_id: string;
    cliente_id: string;
    profissional_id: string;
    servico_id: string;
    data_hora_inicio: string;
    status: string;
  }>;

  let sent = 0;
  let skipped = 0;

  for (const ag of items) {
    // Check if reminder already sent for this appointment
    const { data: existingReminder } = await db(supabase)
      .from("notificacoes_log")
      .select("id")
      .eq("agendamento_id", ag.id)
      .eq("tipo", "lembrete_24h")
      .single();

    if (existingReminder) {
      skipped++;
      continue;
    }

    // Fetch client info
    const { data: cliente } = await db(supabase)
      .from("clientes")
      .select("nome, telefone, idioma_preferido, opt_out_notificacoes")
      .eq("id", ag.cliente_id)
      .single();

    if (!cliente) continue;

    const cl = cliente as {
      nome: string;
      telefone: string;
      idioma_preferido: string;
      opt_out_notificacoes?: boolean;
    };

    if (cl.opt_out_notificacoes || !cl.telefone) {
      skipped++;
      continue;
    }

    // Fetch service and professional names
    const { data: servico } = await db(supabase)
      .from("servicos")
      .select("nome")
      .eq("id", ag.servico_id)
      .single();

    const { data: prof } = await db(supabase)
      .from("profissionais")
      .select("nome")
      .eq("id", ag.profissional_id)
      .single();

    const { data: salao } = await db(supabase)
      .from("saloes")
      .select("nome, endereco")
      .eq("id", ag.salao_id)
      .single();

    const servicoNome = (servico as { nome: string } | null)?.nome ?? "";
    const profNome = (prof as { nome: string } | null)?.nome ?? "";
    const salaoNome = (salao as { nome: string; endereco: string | null } | null)?.nome ?? "";
    const salaoEndereco = (salao as { nome: string; endereco: string | null } | null)?.endereco ?? "";

    const inicio = new Date(ag.data_hora_inicio);
    const dateStr = inicio.toISOString().slice(0, 10);
    const timeStr = inicio.toISOString().slice(11, 16);

    // Check for custom template
    const { data: customTpl } = await db(supabase)
      .from("notification_templates")
      .select("template")
      .eq("salao_id", ag.salao_id)
      .eq("tipo", "lembrete_24h")
      .eq("idioma", cl.idioma_preferido)
      .single();

    const template = getReminderTemplate(
      cl.idioma_preferido,
      (customTpl as { template: string } | null)?.template
    );

    const message = renderTemplate(template, {
      nome_cliente: cl.nome,
      servico: servicoNome,
      profissional: profNome,
      data: dateStr,
      hora: timeStr,
      salao: salaoNome,
      endereco: salaoEndereco,
    });

    await sendNotification({
      supabase,
      salaoId: ag.salao_id,
      clienteId: ag.cliente_id,
      agendamentoId: ag.id,
      telefone: cl.telefone,
      tipo: "lembrete_24h",
      message,
    });

    sent++;
  }

  return NextResponse.json({ sent, skipped, total: items.length });
}
