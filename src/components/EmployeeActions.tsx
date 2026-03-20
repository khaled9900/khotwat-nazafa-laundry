import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const EmployeeActions = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: emp }, { data: acts }] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("employee_actions").select("*, employees(name)").order("action_date", { ascending: false }),
    ]);
    if (emp) setEmployees(emp);
    if (acts) setActions(acts);
    setLoading(false);
  };

  const filtered = selectedEmp ? actions.filter((a) => a.employee_id === selectedEmp) : actions;
  const totalDed = filtered.filter((a) => a.action_type === "deduction").reduce((s, a) => s + Number(a.amount), 0);
  const totalAdd = filtered.filter((a) => a.action_type === "addition").reduce((s, a) => s + Number(a.amount), 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">كشف إجراءات الموظف</h1>
        </div>

        <select className="border border-border rounded-md px-3 py-2 text-sm bg-background w-64" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
          <option value="">جميع الموظفين</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
            <p className="text-xl font-extrabold text-destructive">{totalDed.toLocaleString()} ر.س</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الإضافات</p>
            <p className="text-xl font-extrabold text-accent">{totalAdd.toLocaleString()} ر.س</p>
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
                {filtered.map((a) => (
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
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد إجراءات</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeActions;
