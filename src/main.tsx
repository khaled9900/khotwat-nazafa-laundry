import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import i18n, { getDir } from "./i18n";

const lang = i18n.language || "ar";
document.documentElement.lang = lang;
document.documentElement.dir = getDir(lang);

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = getDir(lng);
});

createRoot(document.getElementById("root")!).render(<App />);
