import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/ExportButtons";
import { exportEmployees } from "@/utils/exportUtils";

const EmployeesList = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [nationalities, setNationalities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", department_id: "", nationality_id: "", salary: "", hire_date: format(new Date(), "yyyy-MM-dd"), notes: "" });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [{ data: emp }, { data: dept }, { data: nat }] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("employee_departments").select("*").order("name"),
      supabase.from("employee_nationalities").select("*").order("name"),
    ]);
    if (emp) setEmployees(emp);
    if (dept) setDepartments(dept);
    if (nat) setNationalities(nat);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", department_id: "", nationality_id: "", salary: "", hire_date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setShowDialog(true);
  };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({ name: e.name, phone: e.phone, email: e.email, department_id: e.department_id || "", nationality_id: e.nationality_id || "", salary: e.salary?.toString() || "", hire_date: e.hire_date, notes: e.notes });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast({ title: "خطأ", description: "اسم الموظف مطلوب", variant: "destructive" });
    const payload = { ...form, salary: Number(form.salary) || 0, department_id: form.department_id || null, nationality_id: form.nationality_id || null };
    if (editing) {
      const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });
      toast({ title: "تم التحديث" });
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });
      toast({ title: "تم الإضافة" });
    }
    setShowDialog(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await supabase.from("employees").delete().eq("id", id);
    toast({ title: "تم الحذف" });
    fetchAll();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("employees").update({ is_active: !current }).eq("id", id);
    fetchAll();
  };

  const filtered = employees.filter((e) => e.name.includes(search) || e.phone?.includes(search));
  const getDeptName = (id: string) => departments.find((d) => d.id === id)?.name || "—";
  const getNatName = (id: string) => nationalities.find((n) => n.id === id)?.name || "—";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">الموظفين</h1>
          <Badge variant="secondary">{employees.length}</Badge>
          <div className="mr-auto flex items-center gap-2">
            <ExportButtons
              onExportPDF={() => exportEmployees(employees.map(e => ({ ...e, department_name: getDeptName(e.department_id) })), "pdf")}
              onExportExcel={() => exportEmployees(employees.map(e => ({ ...e, department_name: getDeptName(e.department_id) })), "excel")}
              disabled={employees.length === 0}
            />
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 ml-1" />إضافة موظف</Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الهاتف</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">القسم</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الجنسية</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الراتب</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">الحالة</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{e.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.phone || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{getDeptName(e.department_id)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{getNatName(e.nationality_id)}</td>
                    <td className="py-3 px-4 font-bold">{Number(e.salary).toLocaleString()} ر.س</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggleActive(e.id, e.is_active)}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.is_active ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                          {e.is_active ? "نشط" : "متوقف"}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Edit2 className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "تعديل موظف" : "إضافة موظف"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="اسم الموظف *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">اختر القسم</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.nationality_id} onChange={(e) => setForm({ ...form, nationality_id: e.target.value })}>
                <option value="">اختر الجنسية</option>
                {nationalities.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <Input type="number" placeholder="الراتب" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              <Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
              <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button className="w-full" onClick={handleSave}>{editing ? "تحديث" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EmployeesList;
