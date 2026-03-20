import { Search, Plus, Calendar, FileText, Phone, HelpCircle, User, Star, Menu, Globe, LogOut, Building2, Warehouse } from "lucide-react";
import { useTranslation } from "react-i18next";
import { languages, getDir } from "@/i18n";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  onMenuToggle?: () => void;
}

const TopBar = ({ onMenuToggle }: TopBarProps) => {
  const { t, i18n } = useTranslation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const branchName = localStorage.getItem("selectedBranchName");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const locale = i18n.language === "ar" ? "ar-SA" : i18n.language === "bn" ? "bn-BD" : i18n.language === "id" ? "id-ID" : i18n.language === "ur" ? "ur-PK" : "en-US";
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "numeric", day: "numeric" });
  const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = languages.find((l) => l.code === i18n.language);

  return (
    <header className="flex items-center justify-between bg-topbar text-topbar-foreground px-4 py-1.5 text-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="h-8 w-8 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-base font-bold">{t("company_name")}</h1>
      </div>

      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1 px-3 py-1.5 rounded bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          {t("invoice")}
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors">
          <FileText className="h-3.5 w-3.5" />
          {t("in_progress")}
          <span className="bg-white/20 rounded px-1.5 text-[10px]">0</span>
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors">
          ✓ {t("ready_delivery")}
          <span className="bg-white/20 rounded px-1.5 text-[10px]">0</span>
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors">
          🚗 {t("delivery_orders")}
          <span className="bg-white/20 rounded px-1.5 text-[10px]">0</span>
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors">
          <Search className="h-3.5 w-3.5" />
          {t("search")}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{currentLang?.name || "العربية"}</span>
          </button>
          {showLangMenu && (
            <div className="absolute top-full mt-1 end-0 bg-card border border-border rounded-md shadow-lg z-50 min-w-[160px] overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={`w-full text-start px-4 py-2 text-sm hover:bg-secondary/60 transition-colors ${
                    i18n.language === lang.code ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="bg-warning text-warning-foreground px-2 py-0.5 rounded text-[10px] font-bold">
          {t("loyalty_disabled")}
        </span>
        <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors">
          <Phone className="h-3.5 w-3.5" />
          {t("contact_us")}
        </button>
        <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
          {t("help")}
        </button>
        <button
          onClick={() => navigate("/warehouse")}
          className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
        >
          <Warehouse className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold">{t("warehouse") || "المستودع"}</span>
        </button>
        <button
          onClick={() => navigate("/branches")}
          className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold">{branchName || "الفروع"}</span>
        </button>
        <div className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          <span>{user?.email?.split("@")[0] || "—"}</span>
          {role && (
            <span className="bg-primary/20 text-primary-foreground px-1.5 rounded text-[10px]">
              {t(role === "admin" ? "role_admin" : "role_employee")}
            </span>
          )}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("logout")}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
