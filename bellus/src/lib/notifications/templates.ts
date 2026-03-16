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

— {salao}
_No deseas recibir mensajes? {link_optout}_`,

  pt: `Olá {nome_cliente}! 👋

Sua reserva em *{salao}* foi confirmada:

📋 Serviço: {servico}
👤 Profissional: {profissional}
📅 Data: {data}
🕐 Horário: {hora}
📍 Endereço: {endereco}

Te esperamos! Se precisar cancelar, entre em contato com o salão.

— {salao}
_Não quer receber mensagens? {link_optout}_`,

  en: `Hi {nome_cliente}! 👋

Your appointment at *{salao}* has been booked:

📋 Service: {servico}
👤 Professional: {profissional}
📅 Date: {data}
🕐 Time: {hora}
📍 Address: {endereco}

We look forward to seeing you! To cancel, please contact the salon.

— {salao}
_Don't want to receive messages? {link_optout}_`,

  ru: `Здравствуйте, {nome_cliente}! 👋

Ваша запись в *{salao}* подтверждена:

📋 Услуга: {servico}
👤 Специалист: {profissional}
📅 Дата: {data}
🕐 Время: {hora}
📍 Адрес: {endereco}

Ждём вас! Для отмены свяжитесь с салоном.

— {salao}
_Не хотите получать сообщения? {link_optout}_`,
};

export const REMINDER_24H_TEMPLATES: Record<string, string> = {
  es: `Hola {nome_cliente} 👋

Te recordamos que mañana tienes cita en *{salao}*:

📋 {servico} con {profissional}
📅 {data} a las {hora}
📍 {endereco}

¡Te esperamos!
_No deseas recibir mensajes? {link_optout}_`,

  pt: `Olá {nome_cliente} 👋

Lembrete: amanhã você tem reserva em *{salao}*:

📋 {servico} com {profissional}
📅 {data} às {hora}
📍 {endereco}

Te esperamos!
_Não quer receber mensagens? {link_optout}_`,

  en: `Hi {nome_cliente} 👋

Reminder: you have an appointment tomorrow at *{salao}*:

📋 {servico} with {profissional}
📅 {data} at {hora}
📍 {endereco}

See you there!
_Don't want to receive messages? {link_optout}_`,

  ru: `Здравствуйте, {nome_cliente} 👋

Напоминаем: завтра у вас запись в *{salao}*:

📋 {servico} с {profissional}
📅 {data} в {hora}
📍 {endereco}

Ждём вас!
_Не хотите получать сообщения? {link_optout}_`,
};

export const RETURN_REMINDER_TEMPLATES: Record<string, string> = {
  es: `Hola {nome_cliente} 👋

¡Te echamos de menos en *{salao}*! 💇

Ha pasado un tiempo desde tu última visita. ¿Quieres agendar tu próxima cita?

📅 Reserva aquí: {link_booking}

¡Te esperamos!
— {salao}
_No deseas recibir mensajes? {link_optout}_`,

  pt: `Olá {nome_cliente} 👋

Sentimos sua falta no *{salao}*! 💇

Já faz um tempo desde sua última visita. Que tal agendar a próxima?

📅 Reserve aqui: {link_booking}

Te esperamos!
— {salao}
_Não quer receber mensagens? {link_optout}_`,

  en: `Hi {nome_cliente} 👋

We miss you at *{salao}*! 💇

It's been a while since your last visit. Ready to book your next appointment?

📅 Book here: {link_booking}

See you soon!
— {salao}
_Don't want to receive messages? {link_optout}_`,

  ru: `Здравствуйте, {nome_cliente} 👋

Мы скучаем по вам в *{salao}*! 💇

Прошло время с вашего последнего визита. Хотите записаться снова?

📅 Записаться: {link_booking}

Ждём вас!
— {salao}
_Не хотите получать сообщения? {link_optout}_`,
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

/**
 * Get the return reminder template for a locale, with optional custom override.
 */
export function getReturnReminderTemplate(locale: string, customTemplate?: string | null): string {
  if (customTemplate) return customTemplate;
  return RETURN_REMINDER_TEMPLATES[locale] ?? RETURN_REMINDER_TEMPLATES.es;
}
