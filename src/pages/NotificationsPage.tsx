import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import NotificationsPageComponent from "@/components/NotificationsPage";
import { useState } from "react";

const NotificationsPageWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <NotificationsPageComponent />
      </div>
    </div>
  );
};

export default NotificationsPageWrapper;
