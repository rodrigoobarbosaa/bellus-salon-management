import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send-notification";
import { getConfirmationRequestTemplate, renderTemplate } from "@/lib/notifications/templates";
import { generateOptOutToken } from "@/lib/opt-out-token";

/**
 * GET /api/cron/reminders
 * Sends 24h interactive confirmation requests for upcoming appointments.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Window: ALL appointments for tomorrow (Madrid timezone)
  // Cron runs at 20:00 Madrid — send confirmations the evening before
  const now = new Date();

  // Calculate tomorrow's date in Madrid timezone (handles DST automatically)
  const madridFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
  const todayMadrid = madridFormatter.format(now);
  const todayDate = new Date(todayMadrid + "T00:00:00");
  todayDate.setDate(todayDate.getDate() + 1);
  const tomorrowStr = todayDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // Get Madrid UTC offset dynamically (handles summer/winter)
  const madridNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const offsetMs = madridNow.getTime() - now.getTime();
  // from = tomorrow 00:00 Madrid in UTC, to = tomorrow 23:59:59 Madrid in UTC
  const from = new Date(new Date(`${tomorrowStr}T00:00:00Z`).getTime() - offsetMs);
  const to = new Date(new Date(`${tomorrowStr}T23:59:59Z`).getTime() - offsetMs);

  console.log(`[Reminders] Running at ${now.toISOString()}, tomorrow (Madrid): ${tomorrowStr}, window: ${from.toISOString()} - ${to.toISOString()}`);

  // Fetch eligible appointments
  const { data: agendamentos, error: agError } = await supabase
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

  if (agError) {
    console.error("[Reminders] Error fetching agendamentos:", agError);
    return NextResponse.json({ error: "Database error", details: agError.message }, { status: 500 });
  }

  if (!agendamentos || (agendamentos as unknown[]).length === 0) {
    console.log("[Reminders] No appointments found in window");
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

  console.log(`[Reminders] Found ${items.length} appointments:`, items.map(a => ({
    id: a.id.slice(0, 8),
    prof: a.profissional_id.slice(0, 8),
    status: a.status,
  })));

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
      .in("tipo", ["lembrete_24h", "confirmacao_interativa"]),
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

  // Log any query errors
  if (alreadySentRes.error) console.error("[Reminders] Error fetching already sent:", alreadySentRes.error);
  if (clientesRes.error) console.error("[Reminders] Error fetching clientes:", clientesRes.error);
  if (servicosRes.error) console.error("[Reminders] Error fetching servicos:", servicosRes.error);
  if (profsRes.error) console.error("[Reminders] Error fetching profissionais:", profsRes.error);
  if (saloesRes.error) console.error("[Reminders] Error fetching saloes:", saloesRes.error);

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

  console.log(`[Reminders] Loaded: ${Object.keys(clienteMap).length} clients, ${Object.keys(servicoMap).length} services, ${Object.keys(profMap).length} professionals`);

  let sent = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};

  for (const ag of items) {
    if (alreadySentIds.has(ag.id)) {
      skipped++;
      skipReasons["already_sent"] = (skipReasons["already_sent"] || 0) + 1;
      continue;
    }

    const cl = clienteMap[ag.cliente_id];
    if (!cl) {
      skipped++;
      skipReasons["client_not_found"] = (skipReasons["client_not_found"] || 0) + 1;
      console.warn(`[Reminders] Client ${ag.cliente_id.slice(0, 8)} not found for appointment ${ag.id.slice(0, 8)}`);
      continue;
    }

    if (cl.opt_out_notificacoes) {
      skipped++;
      skipReasons["opted_out"] = (skipReasons["opted_out"] || 0) + 1;
      continue;
    }

    if (!cl.telefone) {
      skipped++;
      skipReasons["no_phone"] = (skipReasons["no_phone"] || 0) + 1;
      console.warn(`[Reminders] Client ${cl.nome} has no phone number`);
      continue;
    }

    const salao = salaoMap[ag.salao_id];
    const inicio = new Date(ag.data_hora_inicio);
    const idioma = cl.idioma_preferido || "es";
    const dateStr = inicio.toLocaleDateString(idioma, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
    const timeStr = inicio.toLocaleTimeString(idioma, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

    // Custom template (per-salao, per-idioma)
    const { data: customTpl } = await supabase
      .from("notification_templates")
      .select("template")
      .eq("salao_id", ag.salao_id)
      .eq("tipo", "confirmacao_interativa")
      .eq("idioma", idioma as "pt" | "es" | "en" | "ru")
      .maybeSingle();

    const template = getConfirmationRequestTemplate(
      idioma,
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
      link_optout: `${process.env.NEXT_PUBLIC_APP_URL || "https://bellus.app"}/api/opt-out?client_id=${ag.cliente_id}&token=${generateOptOutToken(ag.cliente_id)}`,
    });

    await sendNotification({
      supabase,
      salaoId: ag.salao_id,
      clienteId: ag.cliente_id,
      agendamentoId: ag.id,
      telefone: cl.telefone,
      tipo: "confirmacao_interativa",
      message,
    });

    // Set awaiting_confirmation context on the conversation
    const normalizedPhone = cl.telefone.replace(/^\+/, "").replace(/[\s-]/g, "");
    const { data: conversa } = await supabase
      .from("conversas")
      .select("id, contexto")
      .eq("salao_id", ag.salao_id)
      .eq("canal", "whatsapp")
      .eq("external_id", normalizedPhone)
      .maybeSingle();

    const confirmationCtx = {
      awaiting_confirmation: true,
      agendamento_id: ag.id,
      profissional_id: ag.profissional_id,
      confirmation_sent_at: new Date().toISOString(),
      expires_at: new Date(new Date(ag.data_hora_inicio).getTime() - 2 * 60 * 60 * 1000).toISOString(),
    };

    if (conversa) {
      await supabase
        .from("conversas")
        .update({
          contexto: { ...(conversa.contexto as Record<string, unknown>), ...confirmationCtx },
        })
        .eq("id", (conversa as { id: string }).id);
    } else {
      await supabase.from("conversas").insert({
        salao_id: ag.salao_id,
        cliente_id: ag.cliente_id,
        canal: "whatsapp",
        external_id: normalizedPhone,
        estado: "ativo",
        contexto: confirmationCtx,
      });
    }

    console.log(`[Reminders] Sent confirmation request to ${cl.nome} (prof: ${profMap[ag.profissional_id] ?? ag.profissional_id.slice(0, 8)})`);
    sent++;
  }

  console.log(`[Reminders] Done. Sent: ${sent}, Skipped: ${skipped}, Reasons:`, skipReasons);
  return NextResponse.json({ sent, skipped, total: items.length, skipReasons });
}
