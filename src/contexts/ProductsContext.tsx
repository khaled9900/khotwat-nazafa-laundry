import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { products as fallbackProducts, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id">>) => void;
  deleteProduct: (id: string) => void;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
};

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
        if (error) throw error;

        if (data && data.length > 0) {
          setProducts(data.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            emoji: p.emoji,
            price_per_meter: p.price_per_meter ? Number(p.price_per_meter) : null,
          })));
        } else if (!initialized) {
          const inserts = fallbackProducts.map((p) => ({
            name: p.name,
            price: p.price,
            category: p.category,
            emoji: p.emoji,
          }));
          const { data: seeded, error: seedErr } = await supabase.from("products").insert(inserts).select();
          if (seedErr) throw seedErr;
          if (seeded) {
            setProducts(seeded.map((p) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              category: p.category,
              emoji: p.emoji,
              price_per_meter: p.price_per_meter ? Number(p.price_per_meter) : null,
            })));
          }
        }
        setInitialized(true);
      } catch (err) {
        console.error("Error loading products:", err);
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [initialized]);

  const addProduct = useCallback(async (product: Omit<Product, "id">) => {
    try {
      const { data, error } = await supabase.from("products").insert({
        name: product.name,
        price: product.price,
        category: product.category,
        emoji: product.emoji,
        price_per_meter: product.price_per_meter || null,
      }).select().single();
      if (error) throw error;
      setProducts((prev) => [...prev, {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        category: data.category,
        emoji: data.emoji,
        price_per_meter: data.price_per_meter ? Number(data.price_per_meter) : null,
      }]);
    } catch (err) {
      console.error("Error adding product:", err);
      toast.error("حدث خطأ أثناء إضافة المنتج");
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Omit<Product, "id">>) => {
    try {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error("حدث خطأ أثناء تعديل المنتج");
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("حدث خطأ أثناء حذف المنتج");
    }
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
};
