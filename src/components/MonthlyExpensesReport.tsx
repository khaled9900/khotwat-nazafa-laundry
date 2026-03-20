import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Expense {
  id: string;
  amount: number;
  category_id: string | null;
  expense_date: string;
}

interface Category {
  id: string;
  name: string;
}

const COLORS = [
  "hsl(210, 70%, 45%)", "hsl(160, 60%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(270, 60%, 50%)", "hsl(190, 70%, 45%)",
  "hsl(330, 60%, 50%)", "hsl(120, 50%, 40%)", "hsl(45, 80%, 50%)",
];

const MonthlyExpensesReport = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        supabase.from("expenses").select("id, amount, category_id, expense_date"),
        supabase.from("expense_categories").select("id, name"),
      ]);
      if (expRes.data) setExpenses(expRes.data);
      if (catRes.data) setCategories(catRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const years = useMemo(() => {
    const yrs = new Set(expenses.map((e) => new Date(e.expense_date).getFullYear()));
    yrs.add(new Date().getFullYear());
    return Array.from(yrs).sort((a, b) => b - a);
  }, [expenses]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthNames = [
      t("month_jan"), t("month_feb"), t("month_mar"), t("month_apr"),
      t("month_may"), t("month_jun"), t("month_jul"), t("month_aug"),
      t("month_sep"), t("month_oct"), t("month_nov"), t("month_dec"),
    ];

    return months.map((m) => {
      const monthExpenses = expenses.filter((e) => {
        const d = new Date(e.expense_date);
        return d.getFullYear() === parseInt(selectedYear) && d.getMonth() === m;
      });

      const row: Record<string, any> = { name: monthNames[m], total: 0 };
      categories.forEach((c) => {
        const sum = monthExpenses
          .filter((e) => e.category_id === c.id)
          .reduce((acc, e) => acc + Number(e.amount), 0);
        row[c.name] = sum;
        row.total += sum;
      });

      const uncategorized = monthExpenses
        .filter((e) => !e.category_id)
        .reduce((acc, e) => acc + Number(e.amount), 0);
      if (uncategorized > 0) {
        row[t("uncategorized")] = uncategorized;
        row.total += uncategorized;
      }

      return row;
    });
  }, [expenses, categories, selectedYear, t]);

  const categoryTotals = useMemo(() => {
    const yearExpenses = expenses.filter(
      (e) => new Date(e.expense_date).getFullYear() === parseInt(selectedYear)
    );

    const totals: { name: string; value: number }[] = [];
    categories.forEach((c) => {
      const sum = yearExpenses
        .filter((e) => e.category_id === c.id)
        .reduce((acc, e) => acc + Number(e.amount), 0);
      if (sum > 0) totals.push({ name: c.name, value: sum });
    });

    const uncategorized = yearExpenses
      .filter((e) => !e.category_id)
      .reduce((acc, e) => acc + Number(e.amount), 0);
    if (uncategorized > 0) totals.push({ name: t("uncategorized"), value: uncategorized });

    return totals;
  }, [expenses, categories, selectedYear, t]);

  const totalExpenses = categoryTotals.reduce((a, b) => a + b.value, 0);
  const avgMonthly = totalExpenses / 12;
  const maxMonth = monthlyData.reduce((max, m) => (m.total > max.total ? m : max), monthlyData[0]);

  const barKeys = useMemo(() => {
    const keys = categories.map((c) => c.name);
    if (categoryTotals.some((c) => c.name === t("uncategorized"))) keys.push(t("uncategorized"));
    return keys;
  }, [categories, categoryTotals, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with year selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          {t("monthly_expenses_report")}
        </h2>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("total_expenses_year")}</p>
              <p className="text-xl font-bold text-foreground">{totalExpenses.toFixed(2)} {t("sar")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("avg_monthly")}</p>
              <p className="text-xl font-bold text-foreground">{avgMonthly.toFixed(2)} {t("sar")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingDown className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("highest_month")}</p>
              <p className="text-xl font-bold text-foreground">
                {maxMonth?.name} ({maxMonth?.total?.toFixed(2)} {t("sar")})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Monthly by category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("expenses_by_month_category")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                {barKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === barKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Category distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("expenses_by_category")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryTotals.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => `${value.toFixed(2)} ${t("sar")}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category details table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("category_details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryTotals.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">{t("no_data")}</p>
              ) : (
                categoryTotals
                  .sort((a, b) => b.value - a.value)
                  .map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-sm font-bold text-foreground">{cat.value.toFixed(2)} {t("sar")}</span>
                        <span className="text-xs text-muted-foreground ms-2">
                          ({totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyExpensesReport;
