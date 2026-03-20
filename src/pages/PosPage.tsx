import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import PosOrders from "@/components/PosOrders";
import PosCancelOrder from "@/components/PosCancelOrder";
import PosInventory from "@/components/PosInventory";
import PosCleanOrders from "@/components/PosCleanOrders";
import PosAssociation from "@/components/PosAssociation";
import PosCashbox from "@/components/PosCashbox";

const componentMap: Record<string, React.ComponentType> = {
  "/pos/orders": PosOrders,
  "/pos/cancel": PosCancelOrder,
  "/pos/inventory": PosInventory,
  "/pos/clean": PosCleanOrders,
  "/pos/association": PosAssociation,
  "/pos/cashbox": PosCashbox,
};

const PosPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const Component = componentMap[location.pathname] || PosOrders;

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

export default PosPage;
