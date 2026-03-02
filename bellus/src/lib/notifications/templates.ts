/**
 * Default notification templates with variable placeholders.
 * Variables: {nome_cliente}, {servico}, {profissional}, {data}, {hora}, {salao}, {endereco}
 */

export const CONFIRMATION_TEMPLATES: Record<string, string> = {
  es: `¡Hola {nome_cliente}! 👋

Tu cita en *{salao}* ha sido reservada:

📋 Servicio: {servico}
👤 Profesional: {profissional}
📅 Fecha: {data}
🕐 Hora: {hora}
📍 Dirección: {endereco}

Te esperamos. Si necesitas cancelar, contacta al salón.

— {salao}`,

  pt: `Olá {nome_cliente}! 👋

Sua reserva em *{salao}* foi confirmada:

📋 Serviço: {servico}
👤 Profissional: {profissional}
📅 Data: {data}
🕐 Horário: {hora}
📍 Endereço: {endereco}

Te esperamos! Se precisar cancelar, entre em contato com o salão.

— {salao}`,

  en: `Hi {nome_cliente}! 👋

Your appointment at *{salao}* has been booked:

📋 Service: {servico}
👤 Professional: {profissional}
📅 Date: {data}
🕐 Time: {hora}
📍 Address: {endereco}

We look forward to seeing you! To cancel, please contact the salon.

— {salao}`,

  ru: `Здравствуйте, {nome_cliente}! 👋

Ваша запись в *{salao}* подтверждена:

📋 Услуга: {servico}
👤 Специалист: {profissional}
📅 Дата: {data}
🕐 Время: {hora}
📍 Адрес: {endereco}

Ждём вас! Для отмены свяжитесь с салоном.

— {salao}`,
};

export const REMINDER_24H_TEMPLATES: Record<string, string> = {
  es: `Hola {nome_cliente} 👋

Te recordamos que mañana tienes cita en *{salao}*:

📋 {servico} con {profissional}
📅 {data} a las {hora}
📍 {endereco}

¡Te esperamos!`,

  pt: `Olá {nome_cliente} 👋

Lembrete: amanhã você tem reserva em *{salao}*:

📋 {servico} com {profissional}
📅 {data} às {hora}
📍 {endereco}

Te esperamos!`,

  en: `Hi {nome_cliente} 👋

Reminder: you have an appointment tomorrow at *{salao}*:

📋 {servico} with {profissional}
📅 {data} at {hora}
📍 {endereco}

See you there!`,

  ru: `Здравствуйте, {nome_cliente} 👋

Напоминаем: завтра у вас запись в *{salao}*:

📋 {servico} с {profissional}
📅 {data} в {hora}
📍 {endereco}

Ждём вас!`,
};

/**
 * Render a template by replacing {variable} placeholders.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{${key}}`, value || "");
  }
  return result;
}

/**
 * Get the confirmation template for a locale, with optional custom template override.
 */
export function getConfirmationTemplate(locale: string, customTemplate?: string | null): string {
  if (customTemplate) return customTemplate;
  return CONFIRMATION_TEMPLATES[locale] ?? CONFIRMATION_TEMPLATES.es;
}

/**
 * Get the reminder template for a locale, with optional custom template override.
 */
export function getReminderTemplate(locale: string, customTemplate?: string | null): string {
  if (customTemplate) return customTemplate;
  return REMINDER_24H_TEMPLATES[locale] ?? REMINDER_24H_TEMPLATES.es;
}
