import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend
} from "recharts";

const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const pageConfig: Record<string, { title: string; type: string }> = {
  "/stats/monthly-renewals": { title: "إجمالي التجديدات شهرياً", type: "monthly-orders" },
  "/stats/daily-discounts": { title: "مبالغ الخصومات اليومية خلال شهر", type: "daily-discounts" },
  "/stats/monthly-discounts": { title: "مبالغ الخصومات الشهرية خلال سنة", type: "monthly-discounts" },
  "/stats/daily-renewals": { title: "التجديدات اليومية خلال شهر", type: "daily-orders" },
  "/stats/monthly-renewals-year": { title: "التجديدات الشهرية خلال سنة", type: "monthly-orders" },
  "/stats/monthly-items": { title: "كميات الأصناف شهرياً", type: "monthly-items" },
  "/stats/yearly-items": { title: "كميات الأصناف سنوياً", type: "yearly-items" },
};

const StatsPageComponent = () => {
  const location = useLocation();
  const config = pageConfig[location.pathname] || { title: "إحصائيات", type: "monthly-orders" };
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [year, month, config.type]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("invoices").select("*");
    
    if (config.type.startsWith("daily")) {
      const start = `${month}-01`;
      const end = format(endOfMonth(new Date(`${month}-01`)), "yyyy-MM-dd");
      query = query.gte("created_at", `${start}T00:00:00`).lte("created_at", `${end}T23:59:59`);
    } else {
      query = query.gte("created_at", `${year}-01-01T00:00:00`).lte("created_at", `${year}-12-31T23:59:59`);
    }
    
    const { data } = await query;
    if (data) setInvoices(data);
    setLoading(false);
  };

  const getChartData = () => {
    if (config.type === "monthly-orders" || config.type === "monthly-discounts") {
      return monthNames.map((name, i) => {
        const monthInvoices = invoices.filter((inv) => new Date(inv.created_at).getMonth() === i);
        return {
          name,
          count: monthInvoices.length,
          total: monthInvoices.reduce((s, inv) => s + Number(inv.total), 0),
          discount: monthInvoices.reduce((s, inv) => s + (Number(inv.subtotal) - Number(inv.total) + Number(inv.tax)), 0),
        };
      });
    }
    if (config.type.startsWith("daily")) {
      const daysInMonth = endOfMonth(new Date(`${month}-01`)).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayStr = `${month}-${String(day).padStart(2, "0")}`;
        const dayInvoices = invoices.filter((inv) => inv.created_at.startsWith(dayStr));
        return {
          name: `${day}`,
          count: dayInvoices.length,
          total: dayInvoices.reduce((s, inv) => s + Number(inv.total), 0),
          discount: dayInvoices.reduce((s, inv) => s + (Number(inv.subtotal) - Number(inv.total) + Number(inv.tax)), 0),
        };
      });
    }
    if (config.type === "monthly-items" || config.type === "yearly-items") {
      const itemCounts: Record<string, number> = {};
      invoices.forEach((inv) => {
        const items = Array.isArray(inv.items) ? inv.items : [];
        items.forEach((item: any) => {
          const name = item.name || item.product || "غير معروف";
          itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
        });
      });
      return Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }));
    }
    return [];
  };

  const chartData = getChartData();
  const isDiscountChart = config.type.includes("discount");
  const isItemsChart = config.type.includes("items");

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
        </div>

        <div className="flex gap-3">
          {config.type.startsWith("daily") ? (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
          ) : (
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-32"
              min="2020"
              max="2030"
            />
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-4">
            <ResponsiveContainer width="100%" height={400}>
              {isItemsChart ? (
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => [`${v}`, "الكمية"]} />
                  <Bar dataKey="count" fill="hsl(210, 70%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : isDiscountChart ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ر.س`, "الخصومات"]} />
                  <Area type="monotone" dataKey="discount" stroke="hsl(340, 65%, 50%)" fill="hsl(340, 65%, 50%)" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      name === "count" ? `${v} طلب` : `${v.toLocaleString()} ر.س`,
                      name === "count" ? "عدد الطلبات" : "الإجمالي",
                    ]}
                  />
                  <Legend formatter={(v) => (v === "count" ? "عدد الطلبات" : "الإجمالي")} />
                  <Bar dataKey="count" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPageComponent;
