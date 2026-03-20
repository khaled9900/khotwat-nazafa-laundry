import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ExportButtons from "@/components/ExportButtons";
import { exportBankStatement } from "@/utils/exportUtils";

const BankStatement = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("banks").select("*").order("name");
      if (data) setBanks(data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedBank) fetchTransactions();
  }, [selectedBank]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase.from("bank_transactions").select("*").eq("bank_id", selectedBank).order("transaction_date", { ascending: true });
    if (data) setTransactions(data);
    setLoading(false);
  };

  const bank = banks.find((b) => b.id === selectedBank);
  let runningBalance = 0;
  const statementsWithBalance = transactions.map((t) => {
    if (t.transaction_type === "deposit") runningBalance += Number(t.amount);
    else runningBalance -= Number(t.amount);
    return { ...t, running_balance: runningBalance };
  });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">كشف حساب بنك</h1>
          </div>
          {bank && (
            <ExportButtons
              onExportPDF={() => exportBankStatement(bank, transactions, "pdf")}
              onExportExcel={() => exportBankStatement(bank, transactions, "excel")}
              disabled={transactions.length === 0}
            />
          )}
        </div>

        <select className="border border-border rounded-md px-3 py-2 text-sm bg-background w-64" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
          <option value="">اختر البنك</option>
          {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {bank && (
          <div className="bg-card rounded-lg border border-primary/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">{bank.name} - الرصيد الحالي</p>
            <p className="text-2xl font-extrabold text-primary">{Number(bank.balance).toLocaleString()} ر.س</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : selectedBank && (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الوصف</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">إيداع</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">سحب</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {statementsWithBalance.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(t.transaction_date), "dd MMM yyyy", { locale: ar })}</td>
                    <td className="py-3 px-4 text-foreground">{t.description || "—"}</td>
                    <td className="py-3 px-4 text-accent font-bold">{t.transaction_type === "deposit" ? `${Number(t.amount).toLocaleString()} ر.س` : ""}</td>
                    <td className="py-3 px-4 text-destructive font-bold">{t.transaction_type === "withdrawal" ? `${Number(t.amount).toLocaleString()} ر.س` : ""}</td>
                    <td className={`py-3 px-4 font-extrabold ${t.running_balance >= 0 ? "text-primary" : "text-destructive"}`}>{t.running_balance.toLocaleString()} ر.س</td>
                  </tr>
                ))}
                {statementsWithBalance.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد حركات</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankStatement;