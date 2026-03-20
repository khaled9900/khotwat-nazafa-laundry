import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const SystemLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      if (data) setLogs(data);
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter((l) =>
    l.action?.includes(search) || l.entity_type?.includes(search) || l.user_email?.includes(search)
  );

  const actionColors: Record<string, string> = {
    إضافة: "bg-accent/10 text-accent",
    تعديل: "bg-primary/10 text-primary",
    حذف: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">سجل النظام</h1>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالإجراء أو المستخدم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد سجلات</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">المستخدم</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الإجراء</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">النوع</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: ar })}</td>
                    <td className="py-3 px-4 text-foreground">{log.user_email || "—"}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-secondary text-foreground"}`}>{log.action}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{log.entity_type}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(log.details).substring(0, 80)}</td>
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

export default SystemLogs;
