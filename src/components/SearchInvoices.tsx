import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/ExportButtons";
import { exportSearchInvoices } from "@/utils/exportUtils";

const SearchInvoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInvoices(); }, [dateFrom, dateTo, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    let query = supabase.from("invoices").select("*, customers(name, phone)").order("created_at", { ascending: false });
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query.limit(200);
    if (data) setInvoices(data);
    setLoading(false);
  };

  const filtered = invoices.filter((inv) => {
    const customerName = (inv.customers as any)?.name || "";
    const customerPhone = (inv.customers as any)?.phone || "";
    return inv.invoice_number.includes(search) || customerName.includes(search) || customerPhone.includes(search) || inv.total.toString().includes(search);
  });

  const statusLabels: Record<string, string> = { completed: "مكتمل", pending: "قيد الانتظار", cancelled: "ملغي", processing: "قيد المعالجة" };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">بحث شامل للفواتير</h1>
          </div>
          <ExportButtons
            onExportPDF={() => exportSearchInvoices(filtered, "pdf")}
            onExportExcel={() => exportSearchInvoices(filtered, "excel")}
            disabled={filtered.length === 0}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground text-sm">فلاتر البحث</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="رقم فاتورة / اسم / هاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
            <Input type="date" placeholder="من تاريخ" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" placeholder="إلى تاريخ" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <select className="border border-border rounded-md px-3 py-2 text-sm bg-background" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتمل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="processing">قيد المعالجة</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">عدد النتائج: {filtered.length}</p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">رقم الفاتورة</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">العميل</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-primary font-bold">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-foreground">{(inv.customers as any)?.name || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(inv.created_at), "dd MMM yyyy HH:mm", { locale: ar })}</td>
                    <td className="py-3 px-4 font-bold">{Number(inv.total).toLocaleString()} ر.س</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.status === "completed" ? "bg-accent/10 text-accent" : inv.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{statusLabels[inv.status] || inv.status}</span></td>
                    <td className="py-3 px-4">{inv.payment_method === "cash" ? "نقدي" : inv.payment_method === "card" ? "شبكة" : inv.payment_method}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد نتائج</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInvoices;