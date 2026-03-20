import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import MarketingTools from "@/components/MarketingTools";
import { useState } from "react";

const MarketingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <MarketingTools />
      </div>
    </div>
  );
};

export default MarketingPage;
