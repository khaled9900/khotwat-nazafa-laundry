import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { Send, Phone, Mail, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const channelConfig: Record<string, { title: string; icon: React.ElementType; color: string; description: string }> = {
  "/notifications/whatsapp": { title: "إرسال الفاتورة على الواتس أب", icon: MessageCircle, color: "text-accent", description: "إرسال تفاصيل الفاتورة عبر واتس أب" },
  "/notifications/sms": { title: "إرسال الفاتورة برسالة نصية", icon: Phone, color: "text-primary", description: "إرسال تفاصيل الفاتورة عبر SMS" },
  "/notifications/ready-sms": { title: "إرسال جاهزية الفاتورة برسالة نصية", icon: Send, color: "text-warning", description: "إعلام العميل بأن طلبه جاهز للاستلام" },
  "/notifications/email": { title: "إرسال الفاتورة عبر البريد الإلكتروني", icon: Mail, color: "text-destructive", description: "إرسال تفاصيل الفاتورة عبر البريد الإلكتروني" },
};

const NotificationsPage = () => {
  const location = useLocation();
  const config = channelConfig[location.pathname] || channelConfig["/notifications/sms"];
  const Icon = config.icon;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("invoices").select("*, customers(name, phone, email)").order("created_at", { ascending: false }).limit(50);
      if (data) setInvoices(data);
      setLoading(false);
    })();
  }, []);

  const filtered = invoices.filter((inv) => {
    const customerName = (inv.customers as any)?.name || "";
    return inv.invoice_number.includes(search) || customerName.includes(search);
  });

  const handleSend = (inv: any) => {
    const customerName = (inv.customers as any)?.name || "عميل";
    toast({
      title: "تم الإرسال",
      description: `تم إرسال الفاتورة #${inv.invoice_number} إلى ${customerName} بنجاح (تجريبي)`,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Icon className={`h-6 w-6 ${config.color}`} />
          <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث برقم الفاتورة أو اسم العميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد فواتير</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => (
              <div key={inv.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">#{inv.invoice_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(inv.created_at), "dd MMM yyyy", { locale: ar })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(inv.customers as any)?.name || "عميل غير محدد"} 
                    {(inv.customers as any)?.phone && ` • ${(inv.customers as any).phone}`}
                  </p>
                  <p className="text-sm font-bold text-primary">{Number(inv.total).toLocaleString()} ر.س</p>
                </div>
                <Button size="sm" onClick={() => handleSend(inv)}>
                  <Icon className="h-4 w-4 ml-1" />
                  إرسال
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
