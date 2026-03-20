import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./locales/ar";
import en from "./locales/en";
import ur from "./locales/ur";
import bn from "./locales/bn";
import id from "./locales/id";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      ur: { translation: ur },
      bn: { translation: bn },
      id: { translation: id },
    },
    fallbackLng: "ar",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "app-language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export const languages = [
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "en", name: "English", dir: "ltr" },
  { code: "ur", name: "اردو", dir: "rtl" },
  { code: "bn", name: "বাংলা", dir: "ltr" },
  { code: "id", name: "Bahasa Indonesia", dir: "ltr" },
];

export const getDir = (lang: string) =>
  languages.find((l) => l.code === lang)?.dir || "rtl";

export default i18n;
