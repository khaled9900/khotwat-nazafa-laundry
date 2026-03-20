import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import MessagesSend from "@/components/MessagesSend";
import MessagesQuery from "@/components/MessagesQuery";
import MessagesBalance from "@/components/MessagesBalance";

const componentMap: Record<string, React.ComponentType> = {
  "/messages/send": MessagesSend,
  "/messages/query": MessagesQuery,
  "/messages/balance": MessagesBalance,
};

const MessagesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const Component = componentMap[location.pathname] || MessagesSend;

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

export default MessagesPage;
