import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
  Receipt, DollarSign, Wallet, Users, TrendingUp, TrendingDown,
  Loader2, Clock, ShoppingCart, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TodayStats {
  invoicesCount: number;
  revenue: number;
  expenses: number;
  newCustomers: number;
  avgInvoice: number;
  profit: number;
  hourlyData: { hour: string; count: number; revenue: number }[];
  paymentBreakdown: { name: string; value: number; color: string }[];
  recentInvoices: { invoice_number: string; total: number; created_at: string; payment_method: string }[];
  yesterdayRevenue: number;
  yesterdayInvoices: number;
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: "hsl(160, 60%, 40%)",
  نقدي: "hsl(160, 60%, 40%)",
  card: "hsl(210, 70%, 45%)",
  بطاقة: "hsl(210, 70%, 45%)",
  transfer: "hsl(38, 92%, 50%)",
  تحويل: "hsl(38, 92%, 50%)",
};

const DashboardStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TodayStats>({
    invoicesCount: 0, revenue: 0, expenses: 0, newCustomers: 0,
    avgInvoice: 0, profit: 0, hourlyData: [], paymentBreakdown: [],
    recentInvoices: [], yesterdayRevenue: 0, yesterdayInvoices: 0,
  });

  useEffect(() => {
    fetchTodayStats();
    const interval = setInterval(fetchTodayStats, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchTodayStats = async () => {
    try {
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const todayStart = `${todayStr}T00:00:00`;
      const todayEnd = `${todayStr}T23:59:59`;

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, "yyyy-MM-dd");
      const yesterdayStart = `${yesterdayStr}T00:00:00`;
      const yesterdayEnd = `${yesterdayStr}T23:59:59`;

      const [invoicesRes, expensesRes, customersRes, yesterdayInvRes] = await Promise.all([
        supabase.from("invoices").select("invoice_number, total, created_at, payment_method").gte("created_at", todayStart).lte("created_at", todayEnd).order("created_at", { ascending: false }),
        supabase.from("expenses").select("amount").eq("expense_date", todayStr),
        supabase.from("customers").select("id").gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("invoices").select("total").gte("created_at", yesterdayStart).lte("created_at", yesterdayEnd),
      ]);

      const invoices = invoicesRes.data || [];
      const expenses = expensesRes.data || [];
      const customers = customersRes.data || [];
      const yesterdayInvoices = yesterdayInvRes.data || [];

      const revenue = invoices.reduce((s, i) => s + Number(i.total), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const yesterdayRevenue = yesterdayInvoices.reduce((s, i) => s + Number(i.total), 0);

      // Hourly breakdown
      const hourMap: Record<number, { count: number; revenue: number }> = {};
      for (let h = 6; h <= 23; h++) hourMap[h] = { count: 0, revenue: 0 };
      invoices.forEach((inv) => {
        const h = new Date(inv.created_at).getHours();
        if (!hourMap[h]) hourMap[h] = { count: 0, revenue: 0 };
        hourMap[h].count++;
        hourMap[h].revenue += Number(inv.total);
      });
      const hourlyData = Object.entries(hourMap)
        .map(([h, v]) => ({ hour: `${h}:00`, count: v.count, revenue: v.revenue }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      // Payment breakdown
      const payMap: Record<string, number> = {};
      invoices.forEach((inv) => {
        const pm = inv.payment_method || "نقدي";
        payMap[pm] = (payMap[pm] || 0) + Number(inv.total);
      });
      const paymentBreakdown = Object.entries(payMap).map(([name, value]) => ({
        name,
        value,
        color: PAYMENT_COLORS[name] || "hsl(260, 50%, 55%)",
      }));

      setStats({
        invoicesCount: invoices.length,
        revenue,
        expenses: totalExpenses,
        newCustomers: customers.length,
        avgInvoice: invoices.length > 0 ? revenue / invoices.length : 0,
        profit: revenue - totalExpenses,
        hourlyData,
        paymentBreakdown,
        recentInvoices: invoices.slice(0, 5).map((i) => ({
          invoice_number: i.invoice_number,
          total: Number(i.total),
          created_at: i.created_at,
          payment_method: i.payment_method,
        })),
        yesterdayRevenue,
        yesterdayInvoices: yesterdayInvoices.length,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const revenueChange = stats.yesterdayRevenue > 0
    ? ((stats.revenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100)
    : stats.revenue > 0 ? 100 : 0;

  const invoiceChange = stats.yesterdayInvoices > 0
    ? ((stats.invoicesCount - stats.yesterdayInvoices) / stats.yesterdayInvoices * 100)
    : stats.invoicesCount > 0 ? 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      label: "فواتير اليوم", value: String(stats.invoicesCount), icon: Receipt,
      color: "text-primary", bg: "bg-primary/10",
      change: invoiceChange, suffix: "",
    },
    {
      label: "إيرادات اليوم", value: `${fmt(stats.revenue)} ر.س`, icon: DollarSign,
      color: "text-emerald-600", bg: "bg-emerald-500/10",
      change: revenueChange, suffix: "",
    },
    {
      label: "مصروفات اليوم", value: `${fmt(stats.expenses)} ر.س`, icon: Wallet,
      color: "text-destructive", bg: "bg-destructive/10",
      change: null, suffix: "",
    },
    {
      label: "عملاء جدد", value: String(stats.newCustomers), icon: Users,
      color: "text-amber-600", bg: "bg-amber-500/10",
      change: null, suffix: "",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Today header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(), "EEEE dd MMMM yyyy", { locale: ar })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          تحديث تلقائي
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            {card.change !== null && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${card.change >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {card.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(card.change).toFixed(1)}% عن أمس</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Profit + Avg summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${stats.profit >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
            {stats.profit >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">صافي ربح اليوم</p>
            <p className={`text-lg font-bold ${stats.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {fmt(stats.profit)} ر.س
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">متوسط قيمة الفاتورة</p>
            <p className="text-lg font-bold text-foreground">{fmt(stats.avgInvoice)} ر.س</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">المبيعات حسب الساعة</h3>
          {stats.hourlyData.some((h) => h.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === "revenue" ? `${fmt(v)} ر.س` : v
                  }
                  labelFormatter={(l) => `الساعة ${l}`}
                />
                <Bar dataKey="revenue" name="الإيرادات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              لا توجد فواتير اليوم بعد
            </div>
          )}
        </div>

        {/* Payment methods pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">طرق الدفع</h3>
          {stats.paymentBreakdown.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.paymentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                  >
                    {stats.paymentBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${fmt(v)} ر.س`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {stats.paymentBreakdown.map((pm, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pm.color }} />
                      <span className="text-muted-foreground">{pm.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{fmt(pm.value)} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              لا توجد بيانات
            </div>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      {stats.recentInvoices.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">آخر الفواتير</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">رقم الفاتورة</th>
                  <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">طريقة الدفع</th>
                  <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((inv, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600">{fmt(inv.total)} ر.س</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{inv.payment_method}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {format(new Date(inv.created_at), "hh:mm a", { locale: ar })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
