import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import ProductsManagement from "@/components/ProductsManagement";
import { useState } from "react";

const ProductsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <ProductsManagement />
      </div>
    </div>
  );
};

export default ProductsPage;
