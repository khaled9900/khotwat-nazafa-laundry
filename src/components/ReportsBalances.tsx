import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ExportButtons from "@/components/ExportButtons";
import { exportCustomerBalances } from "@/utils/exportUtils";

const ReportsBalances = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("*").order("total_spent", { ascending: false });
      if (data) setCustomers(data);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter((c) => c.name.includes(search) || c.phone?.includes(search));

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">أرصدة العملاء</h1>
          </div>
          <ExportButtons
            onExportPDF={() => exportCustomerBalances(filtered, "pdf")}
            onExportExcel={() => exportCustomerBalances(filtered, "excel")}
            disabled={filtered.length === 0}
          />
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">العميل</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الهاتف</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">عدد الطلبات</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">إجمالي الإنفاق</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{c.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="py-3 px-4 text-center">{c.total_orders}</td>
                    <td className="py-3 px-4 font-bold">{Number(c.total_spent).toLocaleString()} ر.س</td>
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

export default ReportsBalances;