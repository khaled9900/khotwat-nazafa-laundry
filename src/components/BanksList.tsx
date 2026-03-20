import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const BanksList = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", account_number: "", balance: "", notes: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("banks").select("*").order("name");
    if (data) setBanks(data);
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ name: "", account_number: "", balance: "", notes: "" }); setShowDialog(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ name: b.name, account_number: b.account_number, balance: b.balance?.toString(), notes: b.notes }); setShowDialog(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast({ title: "خطأ", description: "اسم البنك مطلوب", variant: "destructive" });
    const payload = { ...form, balance: Number(form.balance) || 0 };
    if (editing) {
      await supabase.from("banks").update(payload).eq("id", editing.id);
      toast({ title: "تم التحديث" });
    } else {
      await supabase.from("banks").insert(payload);
      toast({ title: "تم الإضافة" });
    }
    setShowDialog(false); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    await supabase.from("banks").delete().eq("id", id);
    toast({ title: "تم الحذف" }); fetch();
  };

  const totalBalance = banks.reduce((s, b) => s + Number(b.balance), 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">بيانات البنوك</h1>
          <Badge variant="secondary">{banks.length} بنك</Badge>
          <Button size="sm" onClick={openAdd} className="mr-auto"><Plus className="h-4 w-4 ml-1" />إضافة بنك</Button>
        </div>

        <div className="bg-card rounded-lg border border-primary/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
          <p className="text-2xl font-extrabold text-primary">{totalBalance.toLocaleString()} ر.س</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banks.map((b) => (
              <div key={b.id} className="bg-card rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{b.name}</h3>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}><Edit2 className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">رقم الحساب: {b.account_number || "—"}</p>
                <p className="text-lg font-extrabold text-primary">{Number(b.balance).toLocaleString()} ر.س</p>
                {b.notes && <p className="text-xs text-muted-foreground">{b.notes}</p>}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.is_active ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                  {b.is_active ? "نشط" : "متوقف"}
                </span>
              </div>
            ))}
            {banks.length === 0 && <div className="col-span-2 text-center py-8 text-muted-foreground">لا توجد بنوك</div>}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "تعديل بنك" : "إضافة بنك"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="اسم البنك *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="رقم الحساب" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
              <Input type="number" placeholder="الرصيد" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
              <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button className="w-full" onClick={handleSave}>{editing ? "تحديث" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BanksList;
