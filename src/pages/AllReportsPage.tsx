import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import ReportsDashboard from "@/components/ReportsDashboard";
import ReportsBalances from "@/components/ReportsBalances";
import ReportsCashbox from "@/components/ReportsCashbox";
import PaidInvoicesReport from "@/components/PaidInvoicesReport";
import ReportsUserSales from "@/components/ReportsUserSales";

const componentMap: Record<string, React.ComponentType> = {
  "/stats/monthly-invoices": ReportsDashboard,
  "/reports/balances": ReportsBalances,
  "/reports/cashbox": ReportsCashbox,
  "/reports/paid-orders": PaidInvoicesReport,
  "/reports/user-sales": ReportsUserSales,
  "/reports/user-renewals": ReportsUserSales, // reuse
};

const AllReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const Component = componentMap[location.pathname] || ReportsDashboard;

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

export default AllReportsPage;
