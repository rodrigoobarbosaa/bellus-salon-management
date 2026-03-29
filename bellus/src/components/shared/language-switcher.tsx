"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";
import { locales, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";

const localeLabels: Record<Locale, string> = {
  pt: "PT",
  es: "ES",
  en: "EN",
  ru: "RU",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value as Locale;
    startTransition(async () => {
      await setLocale(newLocale);
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-1 transition-colors hover:text-stone-700">
      <Globe className="h-4 w-4 text-stone-500" />
      <select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        className="bg-transparent text-sm text-stone-600 outline-none cursor-pointer transition-colors hover:text-stone-700"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
