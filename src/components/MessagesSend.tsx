import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const MessagesSend = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("*").neq("phone", "").order("name");
      if (data) setCustomers(data);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter((c) => c.name.includes(search) || c.phone?.includes(search));

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((c) => c.id));
  };

  const handleSend = () => {
    if (!message.trim()) return toast({ title: "خطأ", description: "يرجى كتابة الرسالة", variant: "destructive" });
    if (selected.length === 0) return toast({ title: "خطأ", description: "يرجى اختيار مستلم واحد على الأقل", variant: "destructive" });
    
    const selectedCustomers = customers.filter((c) => selected.includes(c.id));
    toast({ 
      title: "تم الإرسال", 
      description: `تم إرسال الرسالة إلى ${selectedCustomers.length} عميل بنجاح (تجريبي)` 
    });
    setMessage("");
    setSelected([]);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">إرسال الرسائل النصية</h1>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <h2 className="font-bold text-foreground">نص الرسالة</h2>
          <Textarea
            placeholder="اكتب رسالتك هنا..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{message.length} حرف | {selected.length} مستلم</span>
            <Button onClick={handleSend} disabled={!message.trim() || selected.length === 0}>
              <Send className="h-4 w-4 ml-1" />
              إرسال ({selected.length})
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              اختيار المستلمين
            </h2>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selected.length === filtered.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {filtered.map((c) => (
                <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/30 cursor-pointer transition-colors">
                  <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                  <span className="font-medium text-foreground text-sm flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                </label>
              ))}
              {filtered.length === 0 && <div className="text-center py-4 text-muted-foreground">لا توجد نتائج</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesSend;
