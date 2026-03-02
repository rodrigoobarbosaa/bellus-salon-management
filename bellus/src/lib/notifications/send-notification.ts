import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsApp, sendSMS, isTwilioConfigured } from "./twilio";
import { getConfirmationTemplate, renderTemplate } from "./templates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

interface BookingConfirmationParams {
  supabase: SupabaseClient;
  salaoId: string;
  clienteId: string;
  agendamentoId: string;
  telefone: string;
  idioma: string;
  variables: Record<string, string>;
  customTemplate?: string | null;
}

/**
 * Send booking confirmation via WhatsApp (fallback to SMS, fallback to log only).
 * Never throws — all errors are caught and logged.
 */
export async function sendBookingConfirmation(params: BookingConfirmationParams) {
  const { supabase, salaoId, clienteId, agendamentoId, telefone, idioma, variables, customTemplate } = params;

  // Check if client opted out
  const { data: cliente } = await db(supabase)
    .from("clientes")
    .select("opt_out_notificacoes")
    .eq("id", clienteId)
    .single();

  if ((cliente as { opt_out_notificacoes?: boolean } | null)?.opt_out_notificacoes) {
    console.log(`Client ${clienteId} opted out of notifications`);
    return;
  }

  // Get template and render
  const template = getConfirmationTemplate(idioma, customTemplate);
  const message = renderTemplate(template, variables);

  // Log notification as pending
  const { data: notifLog } = await db(supabase)
    .from("notificacoes_log")
    .insert({
      salao_id: salaoId,
      cliente_id: clienteId,
      agendamento_id: agendamentoId,
      tipo: "confirmacao",
      mensagem: message,
      status: "pendente",
    })
    .select("id")
    .single();

  const logId = (notifLog as { id: string } | null)?.id;

  if (!isTwilioConfigured()) {
    console.log(`[Notification] Twilio not configured. Message logged only:`, message.slice(0, 80));
    return;
  }

  // Try WhatsApp first
  const waResult = await sendWhatsApp(telefone, message);

  if (waResult.success) {
    if (logId) {
      await db(supabase)
        .from("notificacoes_log")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", logId);
    }
    return;
  }

  console.warn(`WhatsApp failed: ${waResult.error}. Trying SMS...`);

  // Fallback to SMS
  const smsResult = await sendSMS(telefone, message);

  if (smsResult.success) {
    if (logId) {
      await db(supabase)
        .from("notificacoes_log")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", logId);
    }
    return;
  }

  console.error(`SMS also failed: ${smsResult.error}`);

  // Mark as failed
  if (logId) {
    await db(supabase)
      .from("notificacoes_log")
      .update({ status: "falhou" })
      .eq("id", logId);
  }
}

/**
 * Send a generic notification (used by reminder cron and other triggers).
 */
export async function sendNotification(params: {
  supabase: SupabaseClient;
  salaoId: string;
  clienteId: string;
  agendamentoId: string | null;
  telefone: string;
  tipo: "confirmacao" | "lembrete_24h" | "lembrete_retorno";
  message: string;
}) {
  const { supabase, salaoId, clienteId, agendamentoId, telefone, tipo, message } = params;

  // Check opt-out
  const { data: cliente } = await db(supabase)
    .from("clientes")
    .select("opt_out_notificacoes")
    .eq("id", clienteId)
    .single();

  if ((cliente as { opt_out_notificacoes?: boolean } | null)?.opt_out_notificacoes) {
    return;
  }

  // Log
  const { data: notifLog } = await db(supabase)
    .from("notificacoes_log")
    .insert({
      salao_id: salaoId,
      cliente_id: clienteId,
      agendamento_id: agendamentoId,
      tipo,
      mensagem: message,
      status: "pendente",
    })
    .select("id")
    .single();

  const logId = (notifLog as { id: string } | null)?.id;

  if (!isTwilioConfigured()) {
    console.log(`[Notification] ${tipo} logged (Twilio not configured)`);
    return;
  }

  const waResult = await sendWhatsApp(telefone, message);
  if (waResult.success) {
    if (logId) {
      await db(supabase)
        .from("notificacoes_log")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", logId);
    }
    return;
  }

  const smsResult = await sendSMS(telefone, message);
  if (smsResult.success) {
    if (logId) {
      await db(supabase)
        .from("notificacoes_log")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", logId);
    }
    return;
  }

  if (logId) {
    await db(supabase)
      .from("notificacoes_log")
      .update({ status: "falhou" })
      .eq("id", logId);
  }
}
