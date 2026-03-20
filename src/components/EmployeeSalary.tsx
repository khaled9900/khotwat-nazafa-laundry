import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { exportSalaryReport } from "@/utils/exportUtils";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const EmployeeSalary = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [month]);

  const fetchAll = async () => {
    setLoading(true);
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    const [{ data: emp }, { data: acts }] = await Promise.all([
      supabase.from("employees").select("*").eq("is_active", true).order("name"),
      supabase.from("employee_actions").select("*").gte("action_date", startDate).lte("action_date", endDate),
    ]);
    if (emp) setEmployees(emp);
    if (acts) setActions(acts);
    setLoading(false);
  };

  const getEmpActions = (empId: string) => actions.filter((a) => a.employee_id === empId);
  const getDeductions = (empId: string) => getEmpActions(empId).filter((a) => a.action_type === "deduction").reduce((s, a) => s + Number(a.amount), 0);
  const getAdditions = (empId: string) => getEmpActions(empId).filter((a) => a.action_type === "addition").reduce((s, a) => s + Number(a.amount), 0);

  const totalSalaries = employees.reduce((s, e) => s + Number(e.salary), 0);
  const totalDeductions = employees.reduce((s, e) => s + getDeductions(e.id), 0);
  const totalAdditions = employees.reduce((s, e) => s + getAdditions(e.id), 0);
  const totalNet = totalSalaries - totalDeductions + totalAdditions;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">إعداد الراتب الشهري</h1>
          <div className="mr-auto">
            <ExportButtons
              onExportPDF={() => exportSalaryReport(employees, getDeductions, getAdditions, month, "pdf")}
              onExportExcel={() => exportSalaryReport(employees, getDeductions, getAdditions, month, "excel")}
              disabled={employees.length === 0}
            />
          </div>
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
            <p className="text-xl font-extrabold text-foreground">{totalSalaries.toLocaleString()} ر.س</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">الخصومات</p>
            <p className="text-xl font-extrabold text-destructive">{totalDeductions.toLocaleString()} ر.س</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">الإضافات</p>
            <p className="text-xl font-extrabold text-accent">{totalAdditions.toLocaleString()} ر.س</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center border-primary/50">
            <p className="text-sm text-muted-foreground">صافي المستحق</p>
            <p className="text-xl font-extrabold text-primary">{totalNet.toLocaleString()} ر.س</p>
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
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الراتب الأساسي</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الخصومات</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الإضافات</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">صافي الراتب</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const ded = getDeductions(e.id);
                  const add = getAdditions(e.id);
                  const net = Number(e.salary) - ded + add;
                  return (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-3 px-4 font-medium text-foreground">{e.name}</td>
                      <td className="py-3 px-4">{Number(e.salary).toLocaleString()} ر.س</td>
                      <td className="py-3 px-4 text-destructive font-bold">{ded > 0 ? `-${ded.toLocaleString()}` : "0"} ر.س</td>
                      <td className="py-3 px-4 text-accent font-bold">{add > 0 ? `+${add.toLocaleString()}` : "0"} ر.س</td>
                      <td className="py-3 px-4 font-extrabold text-primary">{net.toLocaleString()} ر.س</td>
                    </tr>
                  );
                })}
                {employees.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSalary;
