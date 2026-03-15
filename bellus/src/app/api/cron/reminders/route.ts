import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send-notification";
import { getReminderTemplate, renderTemplate } from "@/lib/notifications/templates";

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
  const { data: agendamentos } = await supabase
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

  const agendamentoIds = items.map((a) => a.id);
  const clienteIds   = [...new Set(items.map((a) => a.cliente_id))];
  const servicoIds   = [...new Set(items.map((a) => a.servico_id))];
  const profIds      = [...new Set(items.map((a) => a.profissional_id))];
  const salaoIds     = [...new Set(items.map((a) => a.salao_id))];

  // Batch-fetch all related data and already-sent reminders in parallel
  const [alreadySentRes, clientesRes, servicosRes, profsRes, saloesRes] = await Promise.all([
    supabase
      .from("notificacoes_log")
      .select("agendamento_id")
      .in("agendamento_id", agendamentoIds)
      .eq("tipo", "lembrete_24h"),
    supabase
      .from("clientes")
      .select("id, nome, telefone, idioma_preferido, opt_out_notificacoes")
      .in("id", clienteIds),
    supabase
      .from("servicos")
      .select("id, nome")
      .in("id", servicoIds),
    supabase
      .from("profissionais")
      .select("id, nome")
      .in("id", profIds),
    supabase
      .from("saloes")
      .select("id, nome, endereco")
      .in("id", salaoIds),
  ]);

  const alreadySentIds = new Set(
    ((alreadySentRes.data ?? []) as { agendamento_id: string }[]).map((r) => r.agendamento_id)
  );

  type ClienteRow = { id: string; nome: string; telefone: string; idioma_preferido: string; opt_out_notificacoes?: boolean };
  type NomeRow    = { id: string; nome: string };
  type SalaoRow   = { id: string; nome: string; endereco: string | null };

  const clienteMap = Object.fromEntries(((clientesRes.data ?? []) as unknown as ClienteRow[]).map((c) => [c.id, c]));
  const servicoMap = Object.fromEntries(((servicosRes.data ?? []) as unknown as NomeRow[]).map((s) => [s.id, s.nome]));
  const profMap    = Object.fromEntries(((profsRes.data ?? []) as unknown as NomeRow[]).map((p) => [p.id, p.nome]));
  const salaoMap   = Object.fromEntries(((saloesRes.data ?? []) as unknown as SalaoRow[]).map((s) => [s.id, s]));

  let sent = 0;
  let skipped = 0;

  for (const ag of items) {
    if (alreadySentIds.has(ag.id)) { skipped++; continue; }

    const cl = clienteMap[ag.cliente_id];
    if (!cl || cl.opt_out_notificacoes || !cl.telefone) { skipped++; continue; }

    const salao = salaoMap[ag.salao_id];

    const inicio = new Date(ag.data_hora_inicio);
    const dateStr = inicio.toLocaleDateString(cl.idioma_preferido, { day: "numeric", month: "long", year: "numeric" });
    const timeStr = inicio.toLocaleTimeString(cl.idioma_preferido, { hour: "2-digit", minute: "2-digit" });

    // Custom template (per-salao, per-idioma) — still one query but only if needed
    const { data: customTpl } = await supabase
      .from("notification_templates")
      .select("template")
      .eq("salao_id", ag.salao_id)
      .eq("tipo", "lembrete_24h")
      .eq("idioma", cl.idioma_preferido as "pt" | "es" | "en" | "ru")
      .maybeSingle();

    const template = getReminderTemplate(
      cl.idioma_preferido,
      (customTpl as { template: string } | null)?.template
    );

    const message = renderTemplate(template, {
      nome_cliente: cl.nome,
      servico: servicoMap[ag.servico_id] ?? "",
      profissional: profMap[ag.profissional_id] ?? "",
      data: dateStr,
      hora: timeStr,
      salao: salao?.nome ?? "",
      endereco: salao?.endereco ?? "",
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
