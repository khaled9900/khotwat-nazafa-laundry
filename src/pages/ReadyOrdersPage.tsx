import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import OrdersByStatus from "@/components/OrdersByStatus";
import { useState } from "react";
import { PackageCheck } from "lucide-react";

const ReadyOrdersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <OrdersByStatus
          status="ready"
          title="جاهزة للتسليم"
          icon={<PackageCheck className="h-6 w-6 text-accent" />}
        />
      </div>
    </div>
  );
};

export default ReadyOrdersPage;
