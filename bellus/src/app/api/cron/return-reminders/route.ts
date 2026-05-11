import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send-notification";
import { getReturnReminderTemplate, renderTemplate } from "@/lib/notifications/templates";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/cron/return-reminders
 * Sends return reminder notifications to clients whose proximo_retorno <= today
 * and who don't have a future appointment.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (fail-closed: reject if secret is missing or mismatched)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch clients with proximo_retorno <= today, not opted out, with phone
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, salao_id, nome, telefone, idioma_preferido, proximo_retorno")
    .lte("proximo_retorno", today)
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
    const { data: futureAg } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("cliente_id", cl.id)
      .in("status", ["pendente", "confirmado"])
      .gte("data_hora_inicio", new Date().toISOString())
      .limit(1);

    if (futureAg && (futureAg as unknown[]).length > 0) {
      // Client already has upcoming appointment — clear proximo_retorno
      await supabase
        .from("clientes")
        .update({ proximo_retorno: null })
        .eq("id", cl.id);
      skipped++;
      continue;
    }

    // Check if return reminder already sent recently (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentReminder } = await supabase
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
    const { data: salao } = await supabase
      .from("saloes")
      .select("nome")
      .eq("id", cl.salao_id)
      .single();

    const salaoNome = (salao as { nome: string } | null)?.nome ?? "";

    // Get last completed appointment to know which service triggers the return
    const { data: lastApt } = await supabase
      .from("agendamentos")
      .select("servico_id, servicos:servico_id(nome, intervalo_retorno_dias)")
      .eq("cliente_id", cl.id)
      .eq("status", "concluido")
      .order("data_hora_inicio", { ascending: false })
      .limit(1)
      .single();

    const lastService = lastApt as { servico_id: string; servicos: { nome: string; intervalo_retorno_dias: number | null } | null } | null;
    const servicoNome = lastService?.servicos?.nome ?? "";
    const intervaloDias = lastService?.servicos?.intervalo_retorno_dias ?? 0;
    const intervaloMeses = intervaloDias > 0 ? Math.round(intervaloDias / 30) : 0;

    // Build localized "X month(s)" string
    const idioma = cl.idioma_preferido || "es";
    let intervaloTexto = "";
    if (intervaloMeses > 0) {
      const labels: Record<string, [string, string]> = {
        es: ["mes", "meses"],
        pt: ["mês", "meses"],
        en: ["month", "months"],
        ru: ["месяц", "месяцев"],
      };
      const [singular, plural] = labels[idioma] ?? labels.es;
      intervaloTexto = `${intervaloMeses} ${intervaloMeses === 1 ? singular : plural}`;
    }

    // Check for custom template
    const { data: customTpl } = await supabase
      .from("notification_templates")
      .select("template")
      .eq("salao_id", cl.salao_id)
      .eq("tipo", "lembrete_retorno")
      .eq("idioma", cl.idioma_preferido as "pt" | "es" | "en" | "ru")
      .single();

    const template = getReturnReminderTemplate(
      cl.idioma_preferido,
      (customTpl as { template: string } | null)?.template
    );

    const message = renderTemplate(template, {
      nome_cliente: cl.nome,
      salao: salaoNome,
      servico: servicoNome,
      intervalo_tempo: intervaloTexto,
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
