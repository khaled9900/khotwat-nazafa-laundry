import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const PosInventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => p.name.includes(search));

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">قائمة الأصناف</h1>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الصنف</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التصنيف</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">السعر</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">سعر المتر</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <span className="ml-2">{p.emoji}</span>{p.name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.category || "—"}</td>
                    <td className="py-3 px-4 font-bold">{p.price} ر.س</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {p.price_per_meter ? `${p.price_per_meter} ر.س` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosInventory;
