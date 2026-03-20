import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import ExpensesManagement from "@/components/ExpensesManagement";
import MonthlyExpensesReport from "@/components/MonthlyExpensesReport";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const ExpensesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMonthly = location.pathname === "/expenses/monthly";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        {isMonthly ? (
          <main className="flex-1 overflow-y-auto p-6">
            <MonthlyExpensesReport />
          </main>
        ) : (
          <ExpensesManagement />
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
