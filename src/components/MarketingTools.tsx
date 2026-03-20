import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Gift, Users, TrendingUp, Send } from "lucide-react";
import PromoFinancialModels from "@/components/PromoFinancialModels";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const MarketingTools = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [campaign, setCampaign] = useState({ title: "", message: "", target: "all" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("*");
      if (data) setCustomers(data);
      setLoading(false);
    })();
  }, []);

  const targetCounts: Record<string, number> = {
    all: customers.length,
    active: customers.filter((c) => c.total_orders > 0).length,
    inactive: customers.filter((c) => c.total_orders === 0).length,
    vip: customers.filter((c) => Number(c.total_spent) > 1000).length,
  };

  const handleLaunch = () => {
    if (!campaign.title || !campaign.message) return toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
    toast({ title: "تم إطلاق الحملة", description: `تم إرسال "${campaign.title}" إلى ${targetCounts[campaign.target]} عميل (تجريبي)` });
    setCampaign({ title: "", message: "", target: "all" });
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">أدوات التسويق</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">{customers.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <TrendingUp className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">{targetCounts.active}</p>
            <p className="text-xs text-muted-foreground">عملاء نشطين</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <Gift className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">{targetCounts.vip}</p>
            <p className="text-xs text-muted-foreground">عملاء VIP</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">{targetCounts.inactive}</p>
            <p className="text-xs text-muted-foreground">عملاء غير نشطين</p>
          </div>
        </div>

        {/* Campaign Form */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground text-lg">إنشاء حملة تسويقية</h2>
          <Input placeholder="عنوان الحملة" value={campaign.title} onChange={(e) => setCampaign({ ...campaign, title: e.target.value })} />
          <Textarea placeholder="نص الرسالة التسويقية..." value={campaign.message} onChange={(e) => setCampaign({ ...campaign, message: e.target.value })} className="min-h-[100px]" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">الفئة المستهدفة</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "all", label: "جميع العملاء" },
                { value: "active", label: "العملاء النشطين" },
                { value: "inactive", label: "غير النشطين" },
                { value: "vip", label: "عملاء VIP" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCampaign({ ...campaign, target: opt.value })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    campaign.target === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  {opt.label} ({targetCounts[opt.value]})
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleLaunch} className="w-full">
            <Send className="h-4 w-4 ml-1" />
            إطلاق الحملة
          </Button>
        </div>

        {/* Templates */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-bold text-foreground">قوالب جاهزة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "عرض خاص", text: "عرض خاص! خصم 20% على جميع خدمات التنظيف. العرض ساري حتى نهاية الأسبوع. مغسلة كلين ستيب" },
              { title: "تذكير بالاستلام", text: "عميلنا العزيز، طلبك جاهز للاستلام. نسعد بخدمتك دائماً - مغسلة كلين ستيب" },
              { title: "ترحيب عميل جديد", text: "أهلاً بك في مغسلة كلين ستيب! احصل على خصم 15% على طلبك الأول. نتطلع لخدمتك" },
              { title: "مناسبة خاصة", text: "كل عام وأنتم بخير! بمناسبة العيد نقدم لكم خصم 25% على جميع الخدمات. مغسلة كلين ستيب" },
            ].map((tmpl, i) => (
              <button
                key={i}
                onClick={() => setCampaign({ ...campaign, title: tmpl.title, message: tmpl.text })}
                className="text-right p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
              >
                <p className="font-medium text-foreground text-sm">{tmpl.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tmpl.text}</p>
              </button>
            ))}
        </div>

        {/* Financial Models */}
        <PromoFinancialModels />
      </div>
    </div>
    </div>
  );
};

export default MarketingTools;
