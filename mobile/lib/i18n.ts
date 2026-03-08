import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import pt from "@/locales/pt.json";
import es from "@/locales/es.json";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";

const i18n = new I18n({ pt, es, en, ru });

const deviceLang = Localization.getLocales()[0]?.languageCode ?? "es";
i18n.locale = ["pt", "es", "en", "ru"].includes(deviceLang) ? deviceLang : "es";
i18n.enableFallback = true;
i18n.defaultLocale = "es";

export default i18n;
