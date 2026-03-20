import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/ExportButtons";
import { exportBankTransactions } from "@/utils/exportUtils";

const BankTransactions = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ bank_id: "", transaction_type: "deposit", amount: "", description: "", transaction_date: format(new Date(), "yyyy-MM-dd") });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: b }, { data: t }] = await Promise.all([
      supabase.from("banks").select("*").order("name"),
      supabase.from("bank_transactions").select("*, banks(name)").order("transaction_date", { ascending: false }).limit(50),
    ]);
    if (b) setBanks(b);
    if (t) setTransactions(t);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.bank_id || !form.amount) return toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
    const amount = Number(form.amount);
    const { error } = await supabase.from("bank_transactions").insert({ ...form, amount });
    if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });

    const bank = banks.find((b) => b.id === form.bank_id);
    if (bank) {
      const newBalance = form.transaction_type === "deposit" ? Number(bank.balance) + amount : Number(bank.balance) - amount;
      await supabase.from("banks").update({ balance: newBalance }).eq("id", form.bank_id);
    }

    toast({ title: "تم الإضافة" });
    setForm({ ...form, amount: "", description: "" });
    fetchAll();
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">حركات البنوك</h1>
          </div>
          <ExportButtons
            onExportPDF={() => exportBankTransactions(transactions, "pdf")}
            onExportExcel={() => exportBankTransactions(transactions, "excel")}
            disabled={transactions.length === 0}
          />
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-bold text-foreground">إضافة حركة جديدة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.bank_id} onChange={(e) => setForm({ ...form, bank_id: e.target.value })}>
              <option value="">اختر البنك</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
              <option value="deposit">إيداع</option>
              <option value="withdrawal">سحب</option>
            </select>
            <Input type="number" placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
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
                  <th className="text-right py-3 px-4 font-semibold text-foreground">البنك</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">النوع</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الوصف</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-medium text-foreground">{(t.banks as any)?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.transaction_type === "deposit" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                        {t.transaction_type === "deposit" ? "إيداع" : "سحب"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{Number(t.amount).toLocaleString()} ر.س</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.description || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(t.transaction_date), "dd MMM yyyy", { locale: ar })}</td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد حركات</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankTransactions;