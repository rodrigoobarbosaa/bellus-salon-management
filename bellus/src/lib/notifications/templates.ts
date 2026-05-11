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

export const RETURN_REMINDER_TEMPLATES: Record<string, string> = {
  es: `Hola {nome_cliente} 👋

¡Ya pasó {intervalo_tempo} desde tu último *{servico}* y es hora de volver para mantenerlo perfecto! 💇

Escríbenos por aquí mismo para agendar tu próxima cita 😊

¡Te esperamos en *{salao}*!`,

  pt: `Olá {nome_cliente} 👋

Já faz {intervalo_tempo} desde o seu último *{servico}* e está na hora de voltar para manter tudo perfeito! 💇

Responda por aqui mesmo para agendar a próxima 😊

Te esperamos no *{salao}*!`,

  en: `Hi {nome_cliente} 👋

It's been {intervalo_tempo} since your last *{servico}* and it's time to come back to keep it looking great! 💇

Just reply here to book your next appointment 😊

We're waiting for you at *{salao}*!`,

  ru: `Здравствуйте, {nome_cliente} 👋

Прошло {intervalo_tempo} с вашего последнего *{servico}* — пора вернуться, чтобы поддержать результат! 💇

Напишите нам прямо здесь, чтобы записаться 😊

Ждём вас в *{salao}*!`,
};

export const CONFIRMATION_REQUEST_TEMPLATES: Record<string, string> = {
  es: `Hola {nome_cliente} 👋

Te recordamos tu cita en *{salao}*:

📋 {servico} con {profissional}
📅 {data} a las {hora}

Por favor confirma tu asistencia:
✅ Responde *SI* para confirmar
❌ Responde *NO* para cancelar
🔄 Responde *CAMBIAR* para reagendar

O escríbenos cualquier cosa y tu mensaje llegará al salón.`,

  pt: `Olá {nome_cliente} 👋

Lembrete da sua reserva em *{salao}*:

📋 {servico} com {profissional}
📅 {data} às {hora}

Confirme sua presença:
✅ Responda *SIM* para confirmar
❌ Responda *NAO* para cancelar
🔄 Responda *REMARCAR* para reagendar

Ou escreva qualquer coisa e sua mensagem chegará ao salão.`,

  en: `Hi {nome_cliente} 👋

Reminder of your appointment at *{salao}*:

📋 {servico} with {profissional}
📅 {data} at {hora}

Please confirm:
✅ Reply *YES* to confirm
❌ Reply *NO* to cancel
🔄 Reply *RESCHEDULE* to change

Or write anything and your message will reach the salon.`,

  ru: `Здравствуйте, {nome_cliente} 👋

Напоминаем о записи в *{salao}*:

📋 {servico} с {profissional}
📅 {data} в {hora}

Подтвердите запись:
✅ Ответьте *ДА* для подтверждения
❌ Ответьте *НЕТ* для отмены
🔄 Ответьте *ПЕРЕНЕСТИ* для переноса

Или напишите что угодно — ваше сообщение попадёт в салон.`,
};

export const REVIEW_REQUEST_TEMPLATES: Record<string, string> = {
  es: `Hola {nome_cliente} 👋

¡Gracias por tu visita a *{salao}*! 💇

Nos encantaría conocer tu opinión. Déjanos una reseña:
⭐ {link_reviews}

¡Tu opinión nos ayuda mucho! Gracias 🙏`,

  pt: `Olá {nome_cliente} 👋

Obrigado pela sua visita ao *{salao}*! 💇

Adoraríamos saber sua opinião. Deixe uma avaliação:
⭐ {link_reviews}

Sua opinião é muito importante! Obrigado 🙏`,

  en: `Hi {nome_cliente} 👋

Thank you for visiting *{salao}*! 💇

We'd love to hear your feedback. Leave us a review:
⭐ {link_reviews}

Your opinion means a lot! Thanks 🙏`,

  ru: `Здравствуйте, {nome_cliente} 👋

Спасибо за визит в *{salao}*! 💇

Будем рады вашему отзыву:
⭐ {link_reviews}

Ваше мнение очень важно! Спасибо 🙏`,
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

/**
 * Get the confirmation request template (interactive SIM/NAO/REAGENDAR).
 */
export function getConfirmationRequestTemplate(locale: string, customTemplate?: string | null): string {
  if (customTemplate) return customTemplate;
  return CONFIRMATION_REQUEST_TEMPLATES[locale] ?? CONFIRMATION_REQUEST_TEMPLATES.es;
}

/**
 * Get the review request template for a locale, with optional custom override.
 */
export function getReviewRequestTemplate(locale: string, customTemplate?: string | null): string {
  if (customTemplate) return customTemplate;
  return REVIEW_REQUEST_TEMPLATES[locale] ?? REVIEW_REQUEST_TEMPLATES.es;
}
