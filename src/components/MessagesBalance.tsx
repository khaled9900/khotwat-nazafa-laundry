import { Wallet, CreditCard, TrendingDown } from "lucide-react";

const MessagesBalance = () => {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">رصيدي</h1>
        </div>

        <div className="bg-card rounded-lg border border-primary/50 p-6 text-center space-y-3">
          <CreditCard className="h-12 w-12 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">رصيد الرسائل المتبقي</p>
          <p className="text-4xl font-extrabold text-primary">500</p>
          <p className="text-sm text-muted-foreground">رسالة نصية</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي المرسلة</p>
            <p className="text-2xl font-extrabold text-foreground">1,250</p>
            <p className="text-xs text-muted-foreground">رسالة</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">تم التسليم</p>
            <p className="text-2xl font-extrabold text-accent">1,180</p>
            <p className="text-xs text-accent">94.4%</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">فشل الإرسال</p>
            <p className="text-2xl font-extrabold text-destructive">70</p>
            <p className="text-xs text-destructive">5.6%</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-bold text-foreground">سجل الاستهلاك الأخير</h2>
          <div className="space-y-2">
            {[
              { date: "مارس 2026", count: 85, type: "رسائل فواتير" },
              { date: "فبراير 2026", count: 120, type: "رسائل تسويقية" },
              { date: "يناير 2026", count: 95, type: "رسائل فواتير" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.date}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-sm font-bold text-foreground">{item.count} رسالة</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesBalance;
