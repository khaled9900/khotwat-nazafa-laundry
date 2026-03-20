import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PosAssociation = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomersWithOrders();
  }, []);

  const fetchCustomersWithOrders = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .gt("total_orders", 0)
      .order("total_spent", { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">الجمعية</h1>
        </div>

        <p className="text-sm text-muted-foreground">ربط العملاء بطلباتهم وإدارة الاشتراكات</p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد بيانات</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">العميل</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الهاتف</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">عدد الطلبات</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">إجمالي الإنفاق</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{c.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {c.total_orders}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{Number(c.total_spent).toLocaleString()} ر.س</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {format(new Date(c.created_at), "dd MMM yyyy", { locale: ar })}
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

export default PosAssociation;
