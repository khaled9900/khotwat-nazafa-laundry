import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import WarehouseManagement from "@/components/WarehouseManagement";
import { useState } from "react";

const WarehousePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <WarehouseManagement />
      </div>
    </div>
  );
};

export default WarehousePage;
