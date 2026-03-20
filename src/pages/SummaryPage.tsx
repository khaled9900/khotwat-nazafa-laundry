import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet,
  Loader2, Calendar
} from "lucide-react";
import TopBar from "@/components/TopBar";
import ExportButtons from "@/components/ExportButtons";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { ar } from "date-fns/locale";

type TimePeriod = "weekly" | "monthly" | "yearly" | "all";

interface SummaryData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalOrders: number;
  monthlyData: { month: string; revenue: number; expenses: number; profit: number }[];
  categoryData: { name: string; value: number; color: string }[];
}

const COLORS = [
  "hsl(210, 70%, 45%)", "hsl(160, 60%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 50%)", "hsl(260, 50%, 55%)", "hsl(30, 80%, 50%)"
];

const periodLabels: Record<TimePeriod, string> = {
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
  all: "الكل",
};

function getDateRange(period: TimePeriod): { start: Date; end: Date } | null {
  const now = new Date();
  switch (period) {
    case "weekly":
      return { start: startOfWeek(now, { weekStartsOn: 6 }), end: endOfWeek(now, { weekStartsOn: 6 }) };
    case "monthly":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "yearly":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "all":
      return null;
  }
}

const SummaryPage = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [data, setData] = useState<SummaryData>({
    totalRevenue: 0, totalExpenses: 0, totalProfit: 0, totalOrders: 0,
    monthlyData: [], categoryData: [],
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const range = getDateRange(period);

      let invoicesQuery = supabase.from("invoices").select("total, created_at, items, payment_method");
      let expensesQuery = supabase.from("expenses").select("amount, expense_date, category_id");

      if (range) {
        const startStr = range.start.toISOString();
        const endStr = range.end.toISOString();
        invoicesQuery = invoicesQuery.gte("created_at", startStr).lte("created_at", endStr);
        expensesQuery = expensesQuery.gte("expense_date", format(range.start, "yyyy-MM-dd")).lte("expense_date", format(range.end, "yyyy-MM-dd"));
      }

      const [invoicesRes, expensesRes] = await Promise.all([invoicesQuery, expensesQuery]);

      const invoices = invoicesRes.data || [];
      const expenses = expensesRes.data || [];

      const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalProfit = totalRevenue - totalExpenses;
      const totalOrders = invoices.length;

      // Monthly aggregation
      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      
      const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};
      
      invoices.forEach((inv) => {
        const d = new Date(inv.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expenses: 0 };
        monthlyMap[key].revenue += Number(inv.total);
      });

      expenses.forEach((exp) => {
        const d = new Date(exp.expense_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expenses: 0 };
        monthlyMap[key].expenses += Number(exp.amount);
      });

      const monthlyData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, val]) => {
          const [, monthIdx] = key.split("-");
          return {
            month: monthNames[parseInt(monthIdx)] || key,
            revenue: val.revenue,
            expenses: val.expenses,
            profit: val.revenue - val.expenses,
          };
        });

      // Category breakdown from invoice items
      const catMap: Record<string, number> = {};
      invoices.forEach((inv) => {
        const items = Array.isArray(inv.items) ? inv.items : [];
        items.forEach((item: any) => {
          const cat = item.category || "أخرى";
          catMap[cat] = (catMap[cat] || 0) + Number(item.price || 0) * Number(item.quantity || 1);
        });
      });

      const categoryData = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

      setData({ totalRevenue, totalExpenses, totalProfit, totalOrders, monthlyData, categoryData });
    } catch (err) {
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const range = getDateRange(period);
  const periodDescription = range
    ? `${format(range.start, "dd MMM yyyy", { locale: ar })} — ${format(range.end, "dd MMM yyyy", { locale: ar })}`
    : "جميع الفترات";

  const cards = [
    { label: "إجمالي الإيرادات", value: data.totalRevenue, icon: DollarSign, color: "text-green-600", bg: "bg-green-500/10" },
    { label: "إجمالي المصروفات", value: data.totalExpenses, icon: Wallet, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "صافي الربح", value: data.totalProfit, icon: data.totalProfit >= 0 ? TrendingUp : TrendingDown, color: data.totalProfit >= 0 ? "text-emerald-600" : "text-red-600", bg: data.totalProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
    { label: "عدد الفواتير", value: data.totalOrders, icon: Receipt, color: "text-primary", bg: "bg-primary/10", isCurrency: false },
  ];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header with period filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">ملخص الأعمال</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <ExportButtons
                onExportPDF={() => {
                  const columns = [
                    { header: "الشهر", key: "month" },
                    { header: "الإيرادات", key: "revenue" },
                    { header: "المصروفات", key: "expenses" },
                    { header: "الربح", key: "profit" },
                  ];
                  exportToPDF({ title: "ملخص الأعمال", subtitle: periodDescription, columns, data: data.monthlyData, fileName: `summary-${period}`, summaryRows: [
                    { label: "إجمالي الإيرادات", value: data.totalRevenue.toFixed(2) },
                    { label: "إجمالي المصروفات", value: data.totalExpenses.toFixed(2) },
                    { label: "صافي الربح", value: data.totalProfit.toFixed(2) },
                  ]});
                }}
                onExportExcel={() => {
                  const columns = [
                    { header: "الشهر", key: "month" },
                    { header: "الإيرادات", key: "revenue" },
                    { header: "المصروفات", key: "expenses" },
                    { header: "الربح", key: "profit" },
                  ];
                  exportToExcel({ title: "ملخص الأعمال", columns, data: data.monthlyData, fileName: `summary-${period}`, summaryRows: [
                    { label: "إجمالي الإيرادات", value: data.totalRevenue.toFixed(2) },
                    { label: "إجمالي المصروفات", value: data.totalExpenses.toFixed(2) },
                    { label: "صافي الربح", value: data.totalProfit.toFixed(2) },
                  ]});
                }}
                disabled={loading}
              />
              {(Object.keys(periodLabels) as TimePeriod[]).map((key) => (
                <Button
                  key={key}
                  variant={period === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(key)}
                  className="min-w-[60px]"
                >
                  {periodLabels[key]}
                </Button>
              ))}
            </div>
          </div>

          {/* Period description */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <span>{periodDescription}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className={`text-xl font-bold ${card.color}`}>
                        {(card as any).isCurrency === false ? card.value : `${formatCurrency(card.value)} ر.س`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">الإيرادات والمصروفات الشهرية</h3>
                  {data.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${formatCurrency(v)} ر.س`} />
                        <Bar dataKey="revenue" name="الإيرادات" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="المصروفات" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات كافية</div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">مؤشر الربح الشهري</h3>
                  {data.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={data.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${formatCurrency(v)} ر.س`} />
                        <Area type="monotone" dataKey="profit" name="الربح" stroke="hsl(160, 70%, 40%)" fill="hsl(160, 70%, 40%)" fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات كافية</div>
                  )}
                </div>

                {data.categoryData.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-4">توزيع الإيرادات حسب الفئة</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={data.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {data.categoryData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `${formatCurrency(v)} ر.س`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">نظرة سريعة</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">متوسط قيمة الفاتورة</span>
                      <span className="font-bold text-foreground">
                        {data.totalOrders > 0 ? formatCurrency(data.totalRevenue / data.totalOrders) : "0.00"} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">نسبة الربح</span>
                      <span className={`font-bold ${data.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {data.totalRevenue > 0 ? ((data.totalProfit / data.totalRevenue) * 100).toFixed(1) : "0"}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">نسبة المصروفات</span>
                      <span className="font-bold text-red-500">
                        {data.totalRevenue > 0 ? ((data.totalExpenses / data.totalRevenue) * 100).toFixed(1) : "0"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SummaryPage;
