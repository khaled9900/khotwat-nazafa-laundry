import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Banknote, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PosCashbox = () => {
  const [todayInvoices, setTodayInvoices] = useState<any[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToday();
  }, []);

  const fetchToday = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const [{ data: inv }, { data: exp }] = await Promise.all([
      supabase.from("invoices").select("*").gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`),
      supabase.from("expenses").select("*").eq("expense_date", today),
    ]);
    if (inv) setTodayInvoices(inv);
    if (exp) setTodayExpenses(exp);
    setLoading(false);
  };

  const totalSales = todayInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalExpenses = todayExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const cashSales = todayInvoices.filter((i) => i.payment_method === "cash").reduce((s, i) => s + Number(i.total), 0);
  const cardSales = todayInvoices.filter((i) => i.payment_method === "card").reduce((s, i) => s + Number(i.total), 0);
  const netCash = cashSales - totalExpenses;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Banknote className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">تسليم الصندوق</h1>
          <span className="text-sm text-muted-foreground mr-auto">
            {format(new Date(), "dd MMMM yyyy", { locale: ar })}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">إجمالي المبيعات</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{totalSales.toLocaleString()} ر.س</p>
                <p className="text-xs text-muted-foreground mt-1">{todayInvoices.length} فاتورة</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">مبيعات نقدية</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{cashSales.toLocaleString()} ر.س</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-muted-foreground">المصروفات</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{totalExpenses.toLocaleString()} ر.س</p>
                <p className="text-xs text-muted-foreground mt-1">{todayExpenses.length} مصروف</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 border-primary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">صافي الصندوق</span>
                </div>
                <p className={`text-2xl font-extrabold ${netCash >= 0 ? "text-accent" : "text-destructive"}`}>
                  {netCash.toLocaleString()} ر.س
                </p>
              </div>
            </div>

            {todayInvoices.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="font-bold text-foreground mb-3">تفاصيل الفواتير اليوم</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-2 px-3 font-semibold text-foreground">رقم الفاتورة</th>
                      <th className="text-right py-2 px-3 font-semibold text-foreground">الوقت</th>
                      <th className="text-right py-2 px-3 font-semibold text-foreground">المبلغ</th>
                      <th className="text-right py-2 px-3 font-semibold text-foreground">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-mono text-primary">{inv.invoice_number}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {format(new Date(inv.created_at), "HH:mm", { locale: ar })}
                        </td>
                        <td className="py-2 px-3 font-bold">{Number(inv.total).toLocaleString()} ر.س</td>
                        <td className="py-2 px-3">{inv.payment_method === "cash" ? "نقدي" : inv.payment_method === "card" ? "شبكة" : inv.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PosCashbox;
