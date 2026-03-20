import { useNavigate } from "react-router-dom";
import { ArrowRight, Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";

const ComingSoonPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Construction className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
            <h1 className="text-2xl font-bold text-foreground">{t("coming_soon") || "قريباً"}</h1>
            <p className="text-muted-foreground text-sm">{t("feature_coming_soon") || "هذه الميزة قيد التطوير وستكون متاحة قريباً"}</p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              {t("back_to_home") || "العودة للرئيسية"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
