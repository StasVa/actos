import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import ru from "./locales/ru.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
      ru: { translation: ru },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "de", "es", "ru"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "actos.i18n.language",
    },
    returnNull: false,
  });

export default i18n;
