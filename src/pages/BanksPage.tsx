import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import BanksList from "@/components/BanksList";
import BankTransactions from "@/components/BankTransactions";
import BankStatement from "@/components/BankStatement";

const componentMap: Record<string, React.ComponentType> = {
  "/banks/list": BanksList,
  "/banks/transactions": BankTransactions,
  "/banks/statement": BankStatement,
};

const BanksPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const Component = componentMap[location.pathname] || BanksList;

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

export default BanksPage;
