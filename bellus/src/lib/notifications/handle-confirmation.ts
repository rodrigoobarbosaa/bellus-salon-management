import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/meta/send-message";
import { sendStaffNotification } from "./send-notification";

interface ConfirmationContext {
  conversaId: string;
  clienteId: string | null;
  estado: string;
  contexto: Record<string, unknown>;
  conteudo: string;
  externalId: string;
  canal: string;
}

type ResponseType = "yes" | "no" | "reschedule" | "unknown";

/**
 * Normalize a client response to a confirmation request.
 * Supports ES, PT, EN, RU.
 */
function normalizeResponse(text: string): ResponseType {
  const t = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // YES patterns
  if (/^(si|sim|yes|da|ok|confirmo|confirmar|1|vale|claro|por supuesto)$/i.test(t)) return "yes";
  if (/^si[,. !]\s*/i.test(t) || /^sim[,. !]\s*/i.test(t) || /^yes[,. !]\s*/i.test(t)) return "yes";

  // NO patterns
  if (/^(no|nao|nein|net|cancel|cancelar|2)$/i.test(t)) return "no";
  if (/^no[,. !]\s*/i.test(t) || /^nao[,. !]\s*/i.test(t)) return "no";

  // RESCHEDULE patterns
  if (/^(cambiar|reagendar|remarcar|reschedule|perenesti|3|mover|cambio)$/i.test(t)) return "reschedule";

  return "unknown";
}

/**
 * Handle a client response to a confirmation request.
 * Returns true if the response was handled (skip AI processing).
 * Returns false if the AI chatbot should process the message.
 */
export async function handleConfirmationResponse(
  supabase: SupabaseClient,
  salaoId: string,
  ctx: ConfirmationContext
): Promise<boolean> {
  const { awaiting_confirmation, agendamento_id, profissional_id, expires_at } = ctx.contexto;

  if (!awaiting_confirmation || !agendamento_id) return false;

  // Check if expired
  if (expires_at && new Date(expires_at as string) < new Date()) {
    await clearConfirmationContext(supabase, ctx.conversaId);
    return false;
  }

  const response = normalizeResponse(ctx.conteudo);

  if (response === "yes") {
    await handleConfirmYes(supabase, salaoId, agendamento_id as string, ctx);
    return true;
  }

  if (response === "no") {
    await handleConfirmNo(supabase, salaoId, agendamento_id as string, profissional_id as string, ctx);
    return true;
  }

  if (response === "reschedule") {
    await clearConfirmationContext(supabase, ctx.conversaId);
    const guideMsg = "Entendido, vamos a cambiar tu cita. Por favor, contacta al salón para reagendar. 🔄";
    await sendReplyAndLog(supabase, salaoId, ctx, guideMsg);
    return true;
  }

  // Unrecognized response — forward to professional and let client know
  await forwardMessageToProfessional(supabase, salaoId, agendamento_id as string, profissional_id as string, ctx);

  const replyMsg = `Tu mensaje ha sido enviado al salón. Te responderemos lo antes posible. 👍

Si quieres confirmar tu cita, responde:
✅ *SI* para confirmar
❌ *NO* para cancelar`;

  await sendReplyAndLog(supabase, salaoId, ctx, replyMsg);
  return true;
}

async function handleConfirmYes(
  supabase: SupabaseClient,
  salaoId: string,
  agendamentoId: string,
  ctx: ConfirmationContext
) {
  // Update appointment status to confirmado
  await supabase
    .from("agendamentos")
    .update({ status: "confirmado", updated_at: new Date().toISOString() })
    .eq("id", agendamentoId)
    .eq("salao_id", salaoId);

  const replyMsg = "¡Perfecto! Tu cita ha sido confirmada. ¡Te esperamos! ✅";
  await sendReplyAndLog(supabase, salaoId, ctx, replyMsg);
  await clearConfirmationContext(supabase, ctx.conversaId);

  console.log(`[Confirmation] Appointment ${agendamentoId} confirmed by client ${ctx.externalId}`);
}

async function handleConfirmNo(
  supabase: SupabaseClient,
  salaoId: string,
  agendamentoId: string,
  profissionalId: string,
  ctx: ConfirmationContext
) {
  // Update appointment status to cancelado
  await supabase
    .from("agendamentos")
    .update({ status: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", agendamentoId)
    .eq("salao_id", salaoId);

  const replyMsg = "Tu cita ha sido cancelada. Si cambias de opinión, escríbenos para reagendar. 👋";
  await sendReplyAndLog(supabase, salaoId, ctx, replyMsg);

  // Notify the professional
  await notifyProfessional(supabase, salaoId, agendamentoId, profissionalId);

  await clearConfirmationContext(supabase, ctx.conversaId);

  console.log(`[Confirmation] Appointment ${agendamentoId} cancelled by client ${ctx.externalId}`);
}

/**
 * Forward an unrecognized message from a client to their assigned professional.
 */
async function forwardMessageToProfessional(
  supabase: SupabaseClient,
  salaoId: string,
  agendamentoId: string,
  profissionalId: string,
  ctx: ConfirmationContext
) {
  const [profRes, clienteRes] = await Promise.all([
    supabase.from("profissionais").select("nome, telefone").eq("id", profissionalId).single(),
    supabase.from("clientes").select("nome").eq("id", ctx.clienteId ?? "").single(),
  ]);

  const prof = profRes.data as { nome: string; telefone: string | null } | null;
  const clienteNome = (clienteRes.data as { nome: string } | null)?.nome ?? ctx.externalId;

  if (!prof?.telefone) {
    console.error(`[Confirmation] Cannot forward — professional ${profissionalId} has no phone`);
    return;
  }

  const staffMsg = `💬 *Mensaje de cliente*

${clienteNome} respondió a la confirmación de cita con:

"${ctx.conteudo}"

Responde directamente al +${ctx.externalId} si necesita atención.`;

  await sendStaffNotification({ telefone: prof.telefone, message: staffMsg });

  console.log(`[Confirmation] Forwarded message from ${clienteNome} to professional ${prof.nome}`);
}

/**
 * Notify the professional that a client did NOT confirm.
 */
async function notifyProfessional(
  supabase: SupabaseClient,
  salaoId: string,
  agendamentoId: string,
  profissionalId: string
) {
  const { data: ag } = await supabase
    .from("agendamentos")
    .select("data_hora_inicio, cliente_id, servico_id")
    .eq("id", agendamentoId)
    .single();

  if (!ag) return;

  const agData = ag as { data_hora_inicio: string; cliente_id: string; servico_id: string };

  const [profRes, clienteRes, servicoRes] = await Promise.all([
    supabase.from("profissionais").select("nome, telefone").eq("id", profissionalId).single(),
    supabase.from("clientes").select("nome").eq("id", agData.cliente_id).single(),
    supabase.from("servicos").select("nome").eq("id", agData.servico_id).single(),
  ]);

  const prof = profRes.data as { nome: string; telefone: string | null } | null;
  const clienteNome = (clienteRes.data as { nome: string } | null)?.nome ?? "Cliente";
  const servicoNome = (servicoRes.data as { nome: string } | null)?.nome ?? "";

  if (!prof?.telefone) {
    console.error(`[Confirmation] Professional ${profissionalId} has no phone number for notification`);
    return;
  }

  const inicio = new Date(agData.data_hora_inicio);
  const dateStr = inicio.toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  const timeStr = inicio.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

  const staffMsg = `⚠️ *Cliente no confirmó*

${clienteNome} NO ha confirmado su cita:
📋 ${servicoNome}
📅 ${dateStr} a las ${timeStr}

La cita ha sido cancelada automáticamente.`;

  await sendStaffNotification({ telefone: prof.telefone, message: staffMsg });

  // Log the notification
  await supabase.from("notificacoes_log").insert({
    salao_id: salaoId,
    cliente_id: agData.cliente_id,
    agendamento_id: agendamentoId,
    tipo: "alerta_nao_confirmado",
    mensagem: staffMsg,
    status: "enviado",
    enviado_em: new Date().toISOString(),
  });
}

/**
 * Send a reply to the client and log it in conversas_mensagens.
 */
async function sendReplyAndLog(
  supabase: SupabaseClient,
  salaoId: string,
  ctx: ConfirmationContext,
  message: string
) {
  await sendWhatsAppMessage(ctx.externalId, message);

  await supabase.from("conversas_mensagens").insert({
    conversa_id: ctx.conversaId,
    salao_id: salaoId,
    direcao: "enviada",
    tipo: "texto",
    conteudo: message,
    status: "enviada",
  });
}

/**
 * Clear the awaiting_confirmation flag from the conversation context.
 */
async function clearConfirmationContext(supabase: SupabaseClient, conversaId: string) {
  const { data: conversa } = await supabase
    .from("conversas")
    .select("contexto")
    .eq("id", conversaId)
    .single();

  if (!conversa) return;

  const contexto = { ...(conversa.contexto as Record<string, unknown>) };
  delete contexto.awaiting_confirmation;
  delete contexto.agendamento_id;
  delete contexto.profissional_id;
  delete contexto.expires_at;
  delete contexto.confirmation_sent_at;

  await supabase
    .from("conversas")
    .update({ contexto })
    .eq("id", conversaId);
}

/**
 * Handle timeout for non-responses (called by cron).
 * Notifies the professional that the client didn't respond.
 */
export async function handleConfirmationTimeout(
  supabase: SupabaseClient,
  salaoId: string,
  conversaId: string,
  contexto: Record<string, unknown>
) {
  const { agendamento_id, profissional_id } = contexto;

  if (!agendamento_id || !profissional_id) {
    await clearConfirmationContext(supabase, conversaId);
    return;
  }

  // Check if appointment is still pendente
  const { data: ag } = await supabase
    .from("agendamentos")
    .select("status, data_hora_inicio, cliente_id, servico_id")
    .eq("id", agendamento_id as string)
    .single();

  if (!ag) {
    await clearConfirmationContext(supabase, conversaId);
    return;
  }

  const agData = ag as { status: string; data_hora_inicio: string; cliente_id: string; servico_id: string };

  // Only notify if appointment is still pendente
  if (agData.status !== "pendente") {
    await clearConfirmationContext(supabase, conversaId);
    return;
  }

  const [profRes, clienteRes, servicoRes] = await Promise.all([
    supabase.from("profissionais").select("nome, telefone").eq("id", profissional_id as string).single(),
    supabase.from("clientes").select("nome").eq("id", agData.cliente_id).single(),
    supabase.from("servicos").select("nome").eq("id", agData.servico_id).single(),
  ]);

  const prof = profRes.data as { nome: string; telefone: string | null } | null;
  const clienteNome = (clienteRes.data as { nome: string } | null)?.nome ?? "Cliente";
  const servicoNome = (servicoRes.data as { nome: string } | null)?.nome ?? "";

  if (prof?.telefone) {
    const inicio = new Date(agData.data_hora_inicio);
    const dateStr = inicio.toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "Europe/Madrid" });
    const timeStr = inicio.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

    const staffMsg = `⚠️ *Cliente no respondió*

${clienteNome} no respondió a la confirmación de su cita:
📋 ${servicoNome}
📅 ${dateStr} a las ${timeStr}

La cita sigue como *pendiente*. Por favor, contacta al cliente directamente.`;

    await sendStaffNotification({ telefone: prof.telefone, message: staffMsg });
  }

  await supabase.from("notificacoes_log").insert({
    salao_id: salaoId,
    cliente_id: agData.cliente_id,
    agendamento_id: agendamento_id as string,
    tipo: "alerta_nao_confirmado",
    mensagem: `Timeout: ${clienteNome} no respondio confirmacion`,
    status: "enviado",
    enviado_em: new Date().toISOString(),
  });

  await clearConfirmationContext(supabase, conversaId);
}
