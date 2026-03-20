import SalesAnalysis from "@/components/SalesAnalysis";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { useState } from "react";

const SalesAnalysisPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <SalesAnalysis />
      </div>
    </div>
  );
};

export default SalesAnalysisPage;
