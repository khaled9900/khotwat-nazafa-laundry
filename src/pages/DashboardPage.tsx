import { useState } from "react";
import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import DashboardStats from "@/components/DashboardStats";

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <DashboardStats />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
