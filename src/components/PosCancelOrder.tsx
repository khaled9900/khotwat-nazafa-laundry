import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PosCancelOrder = () => {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveInvoices();
  }, []);

  const fetchActiveInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  };

  const handleCancel = async (id: string, invoiceNumber: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء الفاتورة ${invoiceNumber}؟`)) return;
    const { error } = await supabase
      .from("invoices")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل إلغاء الطلب", variant: "destructive" });
    } else {
      toast({ title: "تم الإلغاء", description: `تم إلغاء الفاتورة ${invoiceNumber}` });
      fetchActiveInvoices();
    }
  };

  const filtered = invoices.filter(
    (inv) => inv.invoice_number.includes(search) || inv.total.toString().includes(search)
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <XCircle className="h-6 w-6 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">إلغاء الطلبات</h1>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الفاتورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد طلبات قابلة للإلغاء</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => (
              <div key={inv.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">فاتورة #{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inv.created_at), "dd MMM yyyy HH:mm", { locale: ar })}
                  </p>
                  <p className="text-sm font-bold text-primary">{inv.total.toLocaleString()} ر.س</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(inv.id, inv.invoice_number)}
                >
                  إلغاء الطلب
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosCancelOrder;
