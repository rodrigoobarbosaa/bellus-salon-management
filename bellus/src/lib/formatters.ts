import type { Locale } from "@/i18n/config";

const localeMap: Record<string, string> = {
  pt: "pt-BR",
  es: "es-ES",
  en: "en-GB",
  ru: "ru-RU",
};

export function formatDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(localeMap[locale] ?? locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatTime(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
