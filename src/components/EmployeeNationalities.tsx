import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Plus, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const EmployeeNationalities = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("employee_nationalities").select("*").order("name");
    if (data) setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editId) {
      await supabase.from("employee_nationalities").update({ name }).eq("id", editId);
      toast({ title: "تم التحديث" });
    } else {
      await supabase.from("employee_nationalities").insert({ name });
      toast({ title: "تم الإضافة" });
    }
    setName(""); setEditId(null); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    await supabase.from("employee_nationalities").delete().eq("id", id);
    toast({ title: "تم الحذف" }); fetch();
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">جنسيات الموظفين</h1>
        </div>
        <div className="flex gap-2">
          <Input placeholder="اسم الجنسية..." value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button onClick={handleSave}>{editId ? "تحديث" : <><Plus className="h-4 w-4 ml-1" />إضافة</>}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setName(""); }}>إلغاء</Button>}
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
                <span className="font-medium text-foreground">{item.name}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditId(item.id); setName(item.name); }}><Edit2 className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-center py-8 text-muted-foreground">لا توجد جنسيات</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeNationalities;
