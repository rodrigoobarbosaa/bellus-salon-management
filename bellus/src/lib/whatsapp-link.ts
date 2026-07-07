import {
  REMINDER_24H_TEMPLATES,
  CONFIRMATION_TEMPLATES,
  RETURN_REMINDER_TEMPLATES,
  REVIEW_REQUEST_TEMPLATES,
  renderTemplate,
} from "@/lib/notifications/templates";

/**
 * Normalize a phone number to international format without '+'.
 * Strips spaces, dashes, parentheses, and the leading '+'.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()+ ]/g, "");
}

/**
 * Strip emojis from text to avoid encoding issues in wa.me URLs.
 * Some browsers/devices corrupt emojis when passing them via window.open().
 */
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FEFF}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .replace(/  +/g, " ")
    .replace(/^ /gm, "");
}

interface WhatsAppLinkParams {
  telefone: string;
  nome_cliente: string;
  servico: string;
  profissional: string;
  data: string;
  hora: string;
  salao: string;
  endereco?: string;
  idioma?: "pt" | "es" | "en" | "ru";
}

/**
 * Build a wa.me link with a pre-filled reminder message (24h).
 * Opens WhatsApp Web/App — zero API cost.
 */
export function buildWhatsAppLink(params: WhatsAppLinkParams): string {
  const locale = params.idioma ?? "es";
  const template = REMINDER_24H_TEMPLATES[locale] ?? REMINDER_24H_TEMPLATES.es;

  // Remove the opt-out line since this is manual (no automated messaging)
  const cleanTemplate = template.replace(/\n_.*\{link_optout\}.*_/, "");

  const message = renderTemplate(cleanTemplate, {
    nome_cliente: params.nome_cliente,
    servico: params.servico,
    profissional: params.profissional,
    data: params.data,
    hora: params.hora,
    salao: params.salao,
    endereco: params.endereco ?? "",
  });

  const phone = normalizePhone(params.telefone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(stripEmojis(message))}`;
}

/**
 * Build a wa.me link with a booking confirmation message.
 */
export function buildBookingWhatsAppLink(params: WhatsAppLinkParams): string {
  const locale = params.idioma ?? "es";
  const template = CONFIRMATION_TEMPLATES[locale] ?? CONFIRMATION_TEMPLATES.es;

  const message = renderTemplate(template, {
    nome_cliente: params.nome_cliente,
    servico: params.servico,
    profissional: params.profissional,
    data: params.data,
    hora: params.hora,
    salao: params.salao,
    endereco: params.endereco ?? "",
  });

  const phone = normalizePhone(params.telefone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(stripEmojis(message))}`;
}

interface ReturnReminderLinkParams {
  telefone: string;
  nome_cliente: string;
  servico: string;
  intervalo_tempo: string;
  salao: string;
  idioma?: "pt" | "es" | "en" | "ru";
}

/**
 * Build a wa.me link with a return reminder message.
 */
export function buildReturnReminderWhatsAppLink(params: ReturnReminderLinkParams): string {
  const locale = params.idioma ?? "es";
  const template = RETURN_REMINDER_TEMPLATES[locale] ?? RETURN_REMINDER_TEMPLATES.es;

  const message = renderTemplate(template, {
    nome_cliente: params.nome_cliente,
    servico: params.servico,
    intervalo_tempo: params.intervalo_tempo,
    salao: params.salao,
  });

  const phone = normalizePhone(params.telefone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(stripEmojis(message))}`;
}

interface ReviewRequestLinkParams {
  telefone: string;
  nome_cliente: string;
  salao: string;
  link_reviews: string;
  idioma?: "pt" | "es" | "en" | "ru";
}

/**
 * Build a wa.me link with a review request message.
 */
export function buildReviewRequestWhatsAppLink(params: ReviewRequestLinkParams): string {
  const locale = params.idioma ?? "es";
  const template = REVIEW_REQUEST_TEMPLATES[locale] ?? REVIEW_REQUEST_TEMPLATES.es;

  const message = renderTemplate(template, {
    nome_cliente: params.nome_cliente,
    salao: params.salao,
    link_reviews: params.link_reviews,
  });

  const phone = normalizePhone(params.telefone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(stripEmojis(message))}`;
}
