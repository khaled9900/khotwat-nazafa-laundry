import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ExportButtons from "@/components/ExportButtons";
import { exportUserSales } from "@/utils/exportUtils";

const ReportsUserSales = () => {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [month]);

  const fetchData = async () => {
    setLoading(true);
    const start = `${month}-01`;
    const end = format(endOfMonth(new Date(`${month}-01`)), "yyyy-MM-dd");
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`);
    if (data) setInvoices(data);
    setLoading(false);
  };

  const byMethod = invoices.reduce((acc: Record<string, number>, inv) => {
    const method = inv.payment_method === "cash" ? "نقدي" : inv.payment_method === "card" ? "شبكة" : inv.payment_method;
    acc[method] = (acc[method] || 0) + Number(inv.total);
    return acc;
  }, {});

  const chartData = Object.entries(byMethod).map(([name, total]) => ({ name, total }));
  const totalSales = invoices.reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">مبيعات المستخدم</h1>
          </div>
          <ExportButtons
            onExportPDF={() => exportUserSales(invoices, month, "pdf")}
            onExportExcel={() => exportUserSales(invoices, month, "excel")}
            disabled={invoices.length === 0}
          />
        </div>
        <div className="flex items-center gap-4">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
          <span className="text-sm text-muted-foreground">الإجمالي: <strong>{totalSales.toLocaleString()} ر.س</strong> | {invoices.length} فاتورة</span>
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : chartData.length > 0 ? (
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="font-bold text-foreground mb-4">المبيعات حسب طريقة الدفع</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ر.س`, "المبيعات"]} />
                <Bar dataKey="total" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">لا توجد بيانات لهذا الشهر</div>
        )}
      </div>
    </div>
  );
};

export default ReportsUserSales;