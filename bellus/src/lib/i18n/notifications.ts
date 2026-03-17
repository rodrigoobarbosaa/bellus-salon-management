import { defaultLocale, type Locale } from "@/i18n/config";

interface NotificationTemplates {
  confirmationSubject: string;
  confirmationBody: (params: { clientName: string; serviceName: string; date: string; time: string; salonName: string }) => string;
  reminderSubject: string;
  reminderBody: (params: { clientName: string; serviceName: string; date: string; time: string; salonName: string }) => string;
  cancellationSubject: string;
  cancellationBody: (params: { clientName: string; salonName: string }) => string;
  returnReminderSubject: string;
  returnReminderBody: (params: { clientName: string; serviceName: string; salonName: string }) => string;
}

const templates: Record<Locale, NotificationTemplates> = {
  es: {
    confirmationSubject: "Cita confirmada",
    confirmationBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Hola ${clientName}, tu cita para ${serviceName} el ${date} a las ${time} en ${salonName} ha sido confirmada.`,
    reminderSubject: "Recordatorio de cita",
    reminderBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Hola ${clientName}, te recordamos tu cita para ${serviceName} mañana ${date} a las ${time} en ${salonName}.`,
    cancellationSubject: "Cita cancelada",
    cancellationBody: ({ clientName, salonName }) =>
      `Hola ${clientName}, tu cita en ${salonName} ha sido cancelada. Contáctanos para reagendar.`,
    returnReminderSubject: "Te echamos de menos",
    returnReminderBody: ({ clientName, serviceName, salonName }) =>
      `Hola ${clientName}, hace tiempo que no nos visitas. ¿Qué tal reservar un ${serviceName} en ${salonName}?`,
  },
  pt: {
    confirmationSubject: "Agendamento confirmado",
    confirmationBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Olá ${clientName}, seu agendamento para ${serviceName} em ${date} às ${time} no ${salonName} foi confirmado.`,
    reminderSubject: "Lembrete de agendamento",
    reminderBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Olá ${clientName}, lembramos do seu agendamento para ${serviceName} amanhã ${date} às ${time} no ${salonName}.`,
    cancellationSubject: "Agendamento cancelado",
    cancellationBody: ({ clientName, salonName }) =>
      `Olá ${clientName}, seu agendamento no ${salonName} foi cancelado. Entre em contato para reagendar.`,
    returnReminderSubject: "Sentimos sua falta",
    returnReminderBody: ({ clientName, serviceName, salonName }) =>
      `Olá ${clientName}, faz tempo que não nos visita. Que tal agendar um ${serviceName} no ${salonName}?`,
  },
  en: {
    confirmationSubject: "Appointment confirmed",
    confirmationBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Hi ${clientName}, your appointment for ${serviceName} on ${date} at ${time} at ${salonName} has been confirmed.`,
    reminderSubject: "Appointment reminder",
    reminderBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Hi ${clientName}, this is a reminder for your ${serviceName} appointment tomorrow ${date} at ${time} at ${salonName}.`,
    cancellationSubject: "Appointment cancelled",
    cancellationBody: ({ clientName, salonName }) =>
      `Hi ${clientName}, your appointment at ${salonName} has been cancelled. Contact us to reschedule.`,
    returnReminderSubject: "We miss you",
    returnReminderBody: ({ clientName, serviceName, salonName }) =>
      `Hi ${clientName}, it's been a while since your last visit. How about booking a ${serviceName} at ${salonName}?`,
  },
  ru: {
    confirmationSubject: "Запись подтверждена",
    confirmationBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Здравствуйте, ${clientName}! Ваша запись на ${serviceName} ${date} в ${time} в ${salonName} подтверждена.`,
    reminderSubject: "Напоминание о записи",
    reminderBody: ({ clientName, serviceName, date, time, salonName }) =>
      `Здравствуйте, ${clientName}! Напоминаем о записи на ${serviceName} завтра ${date} в ${time} в ${salonName}.`,
    cancellationSubject: "Запись отменена",
    cancellationBody: ({ clientName, salonName }) =>
      `Здравствуйте, ${clientName}! Ваша запись в ${salonName} была отменена. Свяжитесь с нами для перезаписи.`,
    returnReminderSubject: "Мы скучаем по вам",
    returnReminderBody: ({ clientName, serviceName, salonName }) =>
      `Здравствуйте, ${clientName}! Давно не виделись. Как насчёт записи на ${serviceName} в ${salonName}?`,
  },
};

export function getNotificationTemplates(locale: string): NotificationTemplates {
  return templates[(locale as Locale)] ?? templates[defaultLocale];
}
