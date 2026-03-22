import { REMINDER_24H_TEMPLATES, renderTemplate } from "@/lib/notifications/templates";

/**
 * Normalize a phone number to international format without '+'.
 * Strips spaces, dashes, parentheses, and the leading '+'.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()+ ]/g, "");
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
 * Build a wa.me link with a pre-filled reminder message.
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
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
