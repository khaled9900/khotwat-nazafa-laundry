import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import UserBranchesManagement from "@/components/UserBranchesManagement";
import { useState } from "react";

const UserBranchesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <UserBranchesManagement />
        </div>
      </div>
    </div>
  );
};

export default UserBranchesPage;
