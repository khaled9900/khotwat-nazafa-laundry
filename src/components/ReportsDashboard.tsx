import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  Calendar, FileText, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useState } from "react";

// بيانات تجريبية
const monthlySales = [
  { month: "يناير", sales: 12500, orders: 45, profit: 3200 },
  { month: "فبراير", sales: 15800, orders: 52, profit: 4100 },
  { month: "مارس", sales: 18200, orders: 61, profit: 5300 },
  { month: "أبريل", sales: 14300, orders: 48, profit: 3800 },
  { month: "مايو", sales: 21000, orders: 72, profit: 6200 },
  { month: "يونيو", sales: 19500, orders: 65, profit: 5800 },
  { month: "يوليو", sales: 23400, orders: 78, profit: 7100 },
  { month: "أغسطس", sales: 20100, orders: 68, profit: 5900 },
  { month: "سبتمبر", sales: 25800, orders: 85, profit: 7800 },
  { month: "أكتوبر", sales: 22700, orders: 76, profit: 6700 },
  { month: "نوفمبر", sales: 28300, orders: 92, profit: 8500 },
  { month: "ديسمبر", sales: 31000, orders: 105, profit: 9400 },
];

const dailySales = [
  { day: "السبت", amount: 4200 },
  { day: "الأحد", amount: 3800 },
  { day: "الإثنين", amount: 5100 },
  { day: "الثلاثاء", amount: 4700 },
  { day: "الأربعاء", amount: 5500 },
  { day: "الخميس", amount: 6200 },
  { day: "الجمعة", amount: 3200 },
];

const categorySales = [
  { name: "كنب ومراتب", value: 35, color: "hsl(210, 70%, 45%)" },
  { name: "مفارش", value: 28, color: "hsl(160, 60%, 40%)" },
  { name: "بطانيات", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "ستائر", value: 12, color: "hsl(340, 65%, 50%)" },
  { name: "أخرى", value: 7, color: "hsl(260, 50%, 55%)" },
];

const topProducts = [
  { name: "كنب ثلاثي", sold: 45, revenue: 15750 },
  { name: "مرتبة طبية", sold: 38, revenue: 9500 },
  { name: "بطانية شتوية", sold: 65, revenue: 4875 },
  { name: "ستائر كبيرة", sold: 22, revenue: 3300 },
  { name: "سجاد صالة", sold: 18, revenue: 900 },
];

const paymentMethods = [
  { name: "نقدي", value: 42, color: "hsl(160, 60%, 40%)" },
  { name: "شبكة", value: 35, color: "hsl(210, 70%, 45%)" },
  { name: "تحويل", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "آجل", value: 8, color: "hsl(340, 65%, 50%)" },
];

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => (
  <div className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="text-2xl font-extrabold text-foreground mb-1">{value}</p>
    <div className="flex items-center gap-1">
      {change >= 0 ? (
        <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
      )}
      <span className={`text-xs font-semibold ${change >= 0 ? "text-accent" : "text-destructive"}`}>
        {Math.abs(change)}%
      </span>
      <span className="text-xs text-muted-foreground">مقارنة بالشهر السابق</span>
    </div>
  </div>
);

type Period = "weekly" | "monthly" | "yearly";

const ReportsDashboard = () => {
  const [period, setPeriod] = useState<Period>("monthly");

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">التقارير والإحصائيات</h1>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  period === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "weekly" ? "أسبوعي" : p === "monthly" ? "شهري" : "سنوي"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المبيعات"
            value="31,000 ر.س"
            change={12.5}
            icon={DollarSign}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            title="عدد الطلبات"
            value="105"
            change={8.3}
            icon={ShoppingCart}
            color="bg-accent/10 text-accent"
          />
          <StatCard
            title="عدد العملاء"
            value="78"
            change={5.2}
            icon={Users}
            color="bg-warning/10 text-warning"
          />
          <StatCard
            title="متوسط قيمة الطلب"
            value="295 ر.س"
            change={-2.1}
            icon={TrendingUp}
            color="bg-destructive/10 text-destructive"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Sales Chart */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
            <h2 className="font-bold text-foreground mb-4">المبيعات الشهرية</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySales}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 20%, 88%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} ر.س`,
                    name === "sales" ? "المبيعات" : "الأرباح",
                  ]}
                />
                <Legend formatter={(value) => (value === "sales" ? "المبيعات" : "الأرباح")} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(210, 70%, 45%)"
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="hsl(160, 60%, 40%)"
                  fill="url(#profitGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie Chart */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="font-bold text-foreground mb-4">المبيعات حسب التصنيف</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "النسبة"]}
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 20%, 88%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {categorySales.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-foreground">{cat.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Sales */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="font-bold text-foreground mb-4">المبيعات اليومية (هذا الأسبوع)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} ر.س`, "المبيعات"]}
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 20%, 88%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" fill="hsl(210, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="font-bold text-foreground mb-4">طرق الدفع</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "النسبة"]}
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 20%, 88%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: method.color }} />
                  <span className="text-foreground">{method.name}</span>
                  <span className="font-bold text-foreground mr-auto">{method.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            الأصناف الأكثر مبيعاً
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-2.5 px-3 font-semibold text-foreground">#</th>
                <th className="text-right py-2.5 px-3 font-semibold text-foreground">الصنف</th>
                <th className="text-right py-2.5 px-3 font-semibold text-foreground">الكمية المباعة</th>
                <th className="text-right py-2.5 px-3 font-semibold text-foreground">الإيرادات</th>
                <th className="text-right py-2.5 px-3 font-semibold text-foreground">النسبة</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => {
                const totalRevenue = topProducts.reduce((s, p) => s + p.revenue, 0);
                const percentage = ((product.revenue / totalRevenue) * 100).toFixed(1);
                return (
                  <tr key={product.name} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground">{index + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{product.name}</td>
                    <td className="py-2.5 px-3">{product.sold}</td>
                    <td className="py-2.5 px-3 font-bold text-price-tag">{product.revenue.toLocaleString()} ر.س</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Orders Chart */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="font-bold text-foreground mb-4">عدد الطلبات الشهرية</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${value} طلب`, "الطلبات"]}
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 20%, 88%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2.5}
                dot={{ fill: "hsl(38, 92%, 50%)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
