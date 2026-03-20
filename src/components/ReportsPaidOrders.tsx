import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/ExportButtons";
import { exportPaidOrders } from "@/utils/exportUtils";

const ReportsPaidOrders = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setInvoices(data);
      setLoading(false);
    })();
  }, []);

  const total = invoices.reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">طلبات مدفوعة</h1>
            <span className="text-sm text-muted-foreground">الإجمالي: {total.toLocaleString()} ر.س</span>
          </div>
          <ExportButtons
            onExportPDF={() => exportPaidOrders(invoices, "pdf")}
            onExportExcel={() => exportPaidOrders(invoices, "excel")}
            disabled={invoices.length === 0}
          />
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">رقم الفاتورة</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-primary">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(inv.created_at), "dd MMM yyyy", { locale: ar })}</td>
                    <td className="py-3 px-4 font-bold">{Number(inv.total).toLocaleString()} ر.س</td>
                    <td className="py-3 px-4">{inv.payment_method === "cash" ? "نقدي" : inv.payment_method === "card" ? "شبكة" : inv.payment_method}</td>
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

export default ReportsPaidOrders;