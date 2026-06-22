import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage, sendWhatsAppTemplate, isMetaWhatsAppConfigured as isWhatsAppConfigured } from "@/lib/meta/send-message";
import { getConfirmationTemplate, renderTemplate } from "./templates";

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

  // Get template and render
  const template = getConfirmationTemplate(idioma, customTemplate);
  const message = renderTemplate(template, variables);

  // Log notification as pending
  const { data: notifLog } = await supabase
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

  if (!isWhatsAppConfigured()) {
    console.log(`[Notification] WhatsApp not configured. Message logged only:`, message.slice(0, 80));
    return;
  }

  // Send via Meta Cloud API template (proactive — outside 24h window)
  const waResult = await sendWhatsAppTemplate(
    telefone,
    "cita_reservada",
    "es",
    [
      variables.nome_cliente ?? "",
      variables.salao ?? "",
      variables.servico ?? "",
      variables.profissional ?? "",
      variables.data ?? "",
      variables.hora ?? "",
      variables.endereco ?? "",
    ]
  );

  if (waResult.success) {
    if (logId) {
      await supabase
        .from("notificacoes_log")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", logId);
    }
    return;
  }

  console.error(`WhatsApp failed: ${waResult.error}`);

  // Mark as failed
  if (logId) {
    await supabase
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
  tipo: "confirmacao" | "lembrete_24h" | "lembrete_retorno" | "confirmacao_interativa" | "review_request" | "alerta_nao_confirmado";
  message: string;
}) {
  const { supabase, salaoId, clienteId, agendamentoId, telefone, tipo, message } = params;

  // Log
  const { data: notifLog } = await supabase
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

  if (!isWhatsAppConfigured()) {
    console.log(`[Notification] ${tipo} logged (WhatsApp not configured)`);
    return;
  }

  // Map notification types to Meta templates
  const templateConfig = getMetaTemplateForType(tipo, message);
  const waResult = await sendWhatsAppTemplate(
    telefone,
    templateConfig.templateName,
    templateConfig.language,
    templateConfig.parameters
  );
  if (waResult.success) {
    if (logId) {
      await supabase
        .from("notificacoes_log")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", logId);
    }
    return;
  }

  console.error(`[Notification] ${tipo} WhatsApp failed: ${waResult.error}`);

  if (logId) {
    await supabase
      .from("notificacoes_log")
      .update({ status: "falhou" })
      .eq("id", logId);
  }
}

/**
 * Send a notification directly to staff (professional) via WhatsApp.
 * Does not log to notificacoes_log, does not check opt-out.
 */
export async function sendStaffNotification(params: {
  telefone: string;
  message: string;
}) {
  if (!isWhatsAppConfigured()) {
    console.log(`[StaffNotification] WhatsApp not configured. Message:`, params.message.slice(0, 100));
    return;
  }

  const waResult = await sendWhatsAppMessage(params.telefone, params.message);
  if (!waResult.success) {
    console.error(`[StaffNotification] Failed to send to ${params.telefone}: ${waResult.error}`);
  }
}

/**
 * Map notification type to the appropriate Meta template and parameters.
 * Extracts template variables from the pre-rendered message text using regex.
 */
function getMetaTemplateForType(
  tipo: string,
  message: string
): { templateName: string; language: string; parameters: string[] } {
  // For confirmacao_interativa, use the interactive confirmation template
  if (tipo === "confirmacao_interativa") {
    // Extract variables from rendered message
    const nome = extractBetween(message, ["Hola ", "Olá ", "Hi ", "Здравствуйте, "], ["!", " "]);
    const salao = extractBold(message) ?? "";
    const servico = extractAfter(message, ["Servicio: ", "Serviço: ", "Service: ", "Услуга: "]) ?? "";
    const profissional = extractAfter(message, ["Profesional: ", "Profissional: ", "Professional: ", "Специалист: "]) ?? "";
    const dataHora = extractAfter(message, ["📅 "]) ?? "";

    // Parse data and hora from the combined string
    const parts = dataHora.split(/ a las | às | at | в /);
    const data = parts[0] ?? "";
    const hora = parts[1] ?? "";
    const endereco = extractAfter(message, ["📍 "]) ?? "";

    return {
      templateName: "cita_confirmacion",
      language: "es",
      parameters: [nome, salao, servico, profissional, data, hora, endereco],
    };
  }

  // For lembrete_retorno, use return reminder template
  if (tipo === "lembrete_retorno") {
    const nome = extractBetween(message, ["Hola ", "Olá ", "Hi ", "Здравствуйте, "], ["!", " "]);
    const salao = extractBold(message) ?? "";
    // Extract time interval ("2 semanas", "1 mes", etc.)
    const intervalo = extractBetween(message, ["Hace ", "Já faz ", "It's been ", "Прошло "], [" que ", " desde ", " since "]) ?? "";

    return {
      templateName: "recordatorio_retorno",
      language: "es",
      parameters: [nome, intervalo, salao],
    };
  }

  // For review_request, use review template
  if (tipo === "review_request") {
    const nome = extractBetween(message, ["Hola ", "Olá ", "Hi ", "Здравствуйте, "], ["!", " "]);
    const salao = extractBold(message) ?? "";
    const link = extractAfter(message, ["⭐ "]) ?? "";

    return {
      templateName: "solicitud_resena",
      language: "es",
      parameters: [nome, salao, link],
    };
  }

  // Default fallback: use cita_confirmacion for any unmatched type
  return {
    templateName: "cita_confirmacion",
    language: "es",
    parameters: [],
  };
}

/** Extract text between a set of possible prefixes and suffixes. */
function extractBetween(text: string, prefixes: string[], suffixes: string[]): string {
  for (const prefix of prefixes) {
    const start = text.indexOf(prefix);
    if (start === -1) continue;
    const afterPrefix = start + prefix.length;
    let end = text.length;
    for (const suffix of suffixes) {
      const suffixPos = text.indexOf(suffix, afterPrefix);
      if (suffixPos !== -1 && suffixPos < end) end = suffixPos;
    }
    return text.substring(afterPrefix, end).trim();
  }
  return "";
}

/** Extract first bold text (*text*) from message. */
function extractBold(text: string): string | null {
  const match = text.match(/\*([^*]+)\*/);
  return match?.[1] ?? null;
}

/** Extract text after a marker, up to the next newline. */
function extractAfter(text: string, markers: string[]): string | null {
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx === -1) continue;
    const start = idx + marker.length;
    const end = text.indexOf("\n", start);
    return text.substring(start, end === -1 ? undefined : end).trim();
  }
  return null;
}
