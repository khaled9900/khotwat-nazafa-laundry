import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/ExportButtons";
import { exportCashboxReport } from "@/utils/exportUtils";

const ReportsCashbox = () => {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [month]);

  const fetchData = async () => {
    setLoading(true);
    const start = `${month}-01`;
    const end = format(endOfMonth(new Date(`${month}-01`)), "yyyy-MM-dd");
    const [{ data: inv }, { data: exp }] = await Promise.all([
      supabase.from("invoices").select("*").gte("created_at", `${start}T00:00:00`).lte("created_at", `${end}T23:59:59`),
      supabase.from("expenses").select("*").gte("expense_date", start).lte("expense_date", end),
    ]);
    if (inv) setInvoices(inv);
    if (exp) setExpenses(exp);
    setLoading(false);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(new Date(`${month}-01`)),
    end: endOfMonth(new Date(`${month}-01`)),
  });

  const dailyData = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const daySales = invoices.filter((i) => i.created_at.startsWith(dayStr)).reduce((s, i) => s + Number(i.total), 0);
    const dayExpenses = expenses.filter((e) => e.expense_date === dayStr).reduce((s, e) => s + Number(e.amount), 0);
    return { date: day, dateStr: format(day, "dd MMM", { locale: ar }), sales: daySales, expenses: dayExpenses, net: daySales - dayExpenses };
  }).filter((d) => d.sales > 0 || d.expenses > 0);

  const totalSales = dailyData.reduce((s, d) => s + d.sales, 0);
  const totalExp = dailyData.reduce((s, d) => s + d.expenses, 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">تقرير حسابات الصندوق</h1>
          </div>
          <ExportButtons
            onExportPDF={() => exportCashboxReport(dailyData, month, "pdf")}
            onExportExcel={() => exportCashboxReport(dailyData, month, "excel")}
            disabled={dailyData.length === 0}
          />
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-xl font-extrabold text-accent">{totalSales.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                <p className="text-xl font-extrabold text-destructive">{totalExp.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">الصافي</p>
                <p className={`text-xl font-extrabold ${totalSales - totalExp >= 0 ? "text-accent" : "text-destructive"}`}>
                  {(totalSales - totalExp).toLocaleString()} ر.س
                </p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">المبيعات</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">المصروفات</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((d) => (
                    <tr key={d.date.toISOString()} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-3 px-4">{d.dateStr}</td>
                      <td className="py-3 px-4 text-accent font-bold">{d.sales.toLocaleString()} ر.س</td>
                      <td className="py-3 px-4 text-destructive font-bold">{d.expenses.toLocaleString()} ر.س</td>
                      <td className={`py-3 px-4 font-bold ${d.net >= 0 ? "text-accent" : "text-destructive"}`}>
                        {d.net.toLocaleString()} ر.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsCashbox;