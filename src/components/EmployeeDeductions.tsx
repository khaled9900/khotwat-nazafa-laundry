import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const EmployeeDeductions = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ employee_id: "", action_type: "deduction", amount: "", reason: "", action_date: format(new Date(), "yyyy-MM-dd") });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: emp }, { data: acts }] = await Promise.all([
      supabase.from("employees").select("*").eq("is_active", true).order("name"),
      supabase.from("employee_actions").select("*, employees(name)").order("action_date", { ascending: false }).limit(50),
    ]);
    if (emp) setEmployees(emp);
    if (acts) setActions(acts);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.employee_id || !form.amount) return toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
    const { error } = await supabase.from("employee_actions").insert({ ...form, amount: Number(form.amount) });
    if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });
    toast({ title: "تم الإضافة" });
    setForm({ ...form, amount: "", reason: "" });
    fetchAll();
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">إجراء الخصم والإضافة</h1>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-bold text-foreground">إضافة إجراء جديد</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">اختر الموظف</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className="border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })}>
              <option value="deduction">خصم</option>
              <option value="addition">إضافة</option>
            </select>
            <Input type="number" placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input placeholder="السبب" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <Input type="date" value={form.action_date} onChange={(e) => setForm({ ...form, action_date: e.target.value })} />
            <Button onClick={handleAdd}><Plus className="h-4 w-4 ml-1" />إضافة</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الموظف</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">النوع</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">السبب</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-medium text-foreground">{(a.employees as any)?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.action_type === "deduction" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                        {a.action_type === "deduction" ? "خصم" : "إضافة"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{Number(a.amount).toLocaleString()} ر.س</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.reason || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(a.action_date), "dd MMM yyyy", { locale: ar })}</td>
                  </tr>
                ))}
                {actions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد إجراءات</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDeductions;
