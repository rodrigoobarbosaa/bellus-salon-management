import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: (await import(`@/locales/${locale}/common.json`)).default,
  };
});
