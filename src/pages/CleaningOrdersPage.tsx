import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import OrdersByStatus from "@/components/OrdersByStatus";
import { useState } from "react";
import { Clock } from "lucide-react";

const CleaningOrdersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <OrdersByStatus
          status="cleaning"
          title="قيد التنفيذ"
          icon={<Clock className="h-6 w-6 text-primary" />}
        />
      </div>
    </div>
  );
};

export default CleaningOrdersPage;
