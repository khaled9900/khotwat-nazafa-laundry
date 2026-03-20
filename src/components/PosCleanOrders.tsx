import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PosCleanOrders = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true });
    if (data) setInvoices(data);
    setLoading(false);
  };

  const markCompleted = async (id: string) => {
    const { error } = await supabase.from("invoices").update({ status: "completed" }).eq("id", id);
    if (!error) {
      toast({ title: "تم", description: "تم تحديث حالة الطلب إلى مكتمل" });
      fetchPending();
    }
  };

  const markProcessing = async (id: string) => {
    const { error } = await supabase.from("invoices").update({ status: "processing" }).eq("id", id);
    if (!error) {
      toast({ title: "تم", description: "تم تحديث حالة الطلب إلى قيد المعالجة" });
      fetchPending();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">تنظيف الطلبات</h1>
          <span className="text-sm text-muted-foreground mr-auto">({invoices.length} طلب معلق)</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد طلبات معلقة - جميع الطلبات مكتملة!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">#{inv.invoice_number}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inv.status === "processing"
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-warning/10 text-warning border border-warning/30"
                  }`}>
                    {inv.status === "processing" ? "قيد المعالجة" : "قيد الانتظار"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(inv.created_at), "dd MMM yyyy HH:mm", { locale: ar })}
                </p>
                <p className="font-bold text-primary">{inv.total.toLocaleString()} ر.س</p>
                <div className="flex gap-2">
                  {inv.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => markProcessing(inv.id)} className="flex-1">
                      بدء المعالجة
                    </Button>
                  )}
                  <Button size="sm" onClick={() => markCompleted(inv.id)} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 ml-1" />
                    مكتمل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosCleanOrders;
