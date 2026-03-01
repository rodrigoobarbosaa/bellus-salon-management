export const locales = ["es", "pt", "en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
