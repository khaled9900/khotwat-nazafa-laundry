import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import InvoiceHeader from "@/components/InvoiceHeader";
import ProductGrid from "@/components/ProductGrid";
import InvoiceSidebar from "@/components/InvoiceSidebar";
import AppSidebar from "@/components/AppSidebar";
import type { Product, CartItem } from "@/data/products";
import { toast } from "sonner";

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1, itemLength: 0, itemWidth: 0, meters: 0, notes: "", price_per_meter: product.price_per_meter }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItemDimensions = useCallback((id: string, field: 'itemLength' | 'itemWidth' | 'meters', value: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }, []);

  const updateItemNotes = useCallback((id: string, notes: string) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes } : i))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const saveInvoice = useCallback(() => {
    toast.success("تم حفظ الفاتورة بنجاح ✅");
    setCart([]);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <InvoiceHeader />
      <div className="flex flex-1 min-h-0">
        {/* Right: App Sidebar (navigation) */}
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Left: Invoice Sidebar */}
        <InvoiceSidebar
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onSaveInvoice={saveInvoice}
          onUpdateItemDimensions={updateItemDimensions}
          onUpdateItemNotes={updateItemNotes}
        />
        {/* Center/Right: Product Grid */}
        <ProductGrid onAddToCart={addToCart} />
      </div>
    </div>
  );
};

export default Index;
