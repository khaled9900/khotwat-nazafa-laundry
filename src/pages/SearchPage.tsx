import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import SearchInvoices from "@/components/SearchInvoices";
import SearchSubscriptions from "@/components/SearchSubscriptions";
import SystemLogs from "@/components/SystemLogs";

const componentMap: Record<string, React.ComponentType> = {
  "/search/invoices": SearchInvoices,
  "/search/subscriptions": SearchSubscriptions,
  "/search/logs": SystemLogs,
};

const SearchPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const Component = componentMap[location.pathname] || SearchInvoices;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Component />
      </div>
    </div>
  );
};

export default SearchPage;
