import { MessageSquare, Search, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// تجريبي - سيتم ربطه بخدمة SMS حقيقية
const sampleMessages = [
  { id: 1, to: "0501234567", message: "طلبك جاهز للاستلام - مغسلة كلين ستيب", date: "2026-03-06 14:30", status: "delivered" },
  { id: 2, to: "0559876543", message: "شكراً لتعاملكم معنا. خصم 10% على طلبك القادم!", date: "2026-03-05 10:15", status: "delivered" },
  { id: 3, to: "0541112233", message: "تذكير: طلبك رقم #1042 بانتظار الاستلام", date: "2026-03-04 09:00", status: "failed" },
];

const statusLabels: Record<string, string> = { delivered: "تم التسليم", failed: "فشل", pending: "قيد الإرسال" };
const statusColors: Record<string, string> = { delivered: "bg-accent/10 text-accent", failed: "bg-destructive/10 text-destructive", pending: "bg-warning/10 text-warning" };

const MessagesQuery = () => {
  const [search, setSearch] = useState("");
  const filtered = sampleMessages.filter((m) => m.to.includes(search) || m.message.includes(search));

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">إستعلام الرسائل</h1>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث برقم الهاتف أو نص الرسالة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <div key={m.id} className="bg-card rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{m.to}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}>
                    {statusLabels[m.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{m.message}</p>
                <p className="text-xs text-muted-foreground">{m.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesQuery;
