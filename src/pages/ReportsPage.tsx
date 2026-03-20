import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import ReportsDashboard from "@/components/ReportsDashboard";
import { useState } from "react";

const ReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <ReportsDashboard />
      </div>
    </div>
  );
};

export default ReportsPage;
