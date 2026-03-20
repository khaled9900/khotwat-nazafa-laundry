import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import MainMenu from "@/components/MainMenu";
import { useState } from "react";

const MainMenuPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <MainMenu />
      </div>
    </div>
  );
};

export default MainMenuPage;
