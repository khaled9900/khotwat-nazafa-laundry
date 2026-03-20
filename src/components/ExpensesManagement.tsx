import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, X, Check, Wallet, FileText, Loader2, Calendar, Tag, FolderOpen } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { exportExpenses } from "@/utils/exportUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ExpenseCategory {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  voucher_number: string;
  description: string;
  amount: number;
  category_id: string | null;
  category_name?: string;
  payment_method: string;
  notes: string;
  expense_date: string;
  created_at: string;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category_id: string;
  payment_method: string;
  notes: string;
  expense_date: string;
}

const emptyForm: ExpenseFormData = {
  description: "", amount: "", category_id: "", payment_method: "cash",
  notes: "", expense_date: new Date().toISOString().split("T")[0],
};

type TabType = "expenses" | "categories";

const ExpensesManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showVoucher, setShowVoucher] = useState<Expense | null>(null);

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

  const paymentMethods = [
    { value: "cash", label: t("cash") },
    { value: "bank", label: t("bank_transfer") },
    { value: "card", label: t("network") },
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        supabase.from("expenses").select("*").order("created_at", { ascending: false }),
        supabase.from("expense_categories").select("*").order("name"),
      ]);
      if (expRes.error) throw expRes.error;
      if (catRes.error) throw catRes.error;

      const cats = catRes.data || [];
      setCategories(cats);
      setExpenses((expRes.data || []).map((e) => ({
        id: e.id, voucher_number: e.voucher_number, description: e.description,
        amount: Number(e.amount), category_id: e.category_id,
        category_name: cats.find((c) => c.id === e.category_id)?.name || "—",
        payment_method: e.payment_method, notes: e.notes,
        expense_date: e.expense_date, created_at: e.created_at,
      })));
    } catch (err) {
      console.error("Error loading expenses:", err);
      toast.error(t("loading") + " ❌");
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchSearch = e.description.includes(searchQuery) || e.voucher_number.includes(searchQuery);
    const matchCat = filterCategory === "all" || e.category_name === filterCategory;
    return matchSearch && matchCat;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  const openAdd = () => {
    setForm({ ...emptyForm, category_id: categories[0]?.id || "" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (e: Expense) => {
    setForm({
      description: e.description, amount: String(e.amount), category_id: e.category_id || "",
      payment_method: e.payment_method, notes: e.notes, expense_date: e.expense_date,
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error(t("expense_description") + " ⚠️"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error(t("amount") + " ⚠️"); return; }

    try {
      if (editingId) {
        const { error } = await supabase.from("expenses").update({
          description: form.description.trim(), amount: Number(form.amount),
          category_id: form.category_id || null, payment_method: form.payment_method,
          notes: form.notes.trim(), expense_date: form.expense_date,
        }).eq("id", editingId);
        if (error) throw error;
        toast.success("✅");
      } else {
        const voucherNum = `EXP-${Date.now().toString().slice(-6)}`;
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("expenses").insert({
          voucher_number: voucherNum, description: form.description.trim(),
          amount: Number(form.amount), category_id: form.category_id || null,
          payment_method: form.payment_method, notes: form.notes.trim(),
          expense_date: form.expense_date,
          created_by: user?.id || null,
        } as any);
        if (error) throw error;
        toast.success("✅");
      }
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error("Error saving expense:", err);
      toast.error("❌");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirm(null);
      toast.success("✅");
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast.error("❌");
    }
  };

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const { error } = await supabase.from("expense_categories").insert({ name: newCategoryName.trim() });
      if (error) throw error;
      setNewCategoryName("");
      fetchData();
      toast.success("✅");
    } catch { toast.error("❌"); }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      const { error } = await supabase.from("expense_categories").update({ name: editingCatName.trim() }).eq("id", id);
      if (error) throw error;
      setEditingCatId(null);
      fetchData();
      toast.success("✅");
    } catch { toast.error("❌"); }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
      setDeleteCatConfirm(null);
      fetchData();
      toast.success("✅");
    } catch { toast.error("❌"); }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t("expenses_management")}</h1>
          </div>
          {activeTab === "expenses" && (
            <div className="flex items-center gap-2">
              <ExportButtons
                onExportPDF={() => exportExpenses(expenses, "pdf")}
                onExportExcel={() => exportExpenses(expenses, "excel")}
                disabled={expenses.length === 0}
              />
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-bold hover:bg-accent/90 transition-colors">
                <Plus className="h-4 w-4" />
                {t("add_expense")}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "expenses" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <FileText className="h-4 w-4" />
            {t("expense_list")}
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "categories" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            {t("expense_groups")}
          </button>
        </div>

        {activeTab === "expenses" && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder={t("search") + "..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-border rounded-md ps-10 pe-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">{t("all_categories")}</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filtered.length} {t("voucher")}</span>
              <span className="text-foreground font-bold">| {t("total")}: {totalFiltered.toFixed(2)} {t("sar")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === "expenses" ? (
        /* Expenses Table */
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 sticky top-0 z-10">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-foreground">#</th>
                <th className="text-start px-4 py-3 font-semibold text-foreground">{t("voucher_number")}</th>
                <th className="text-start px-4 py-3 font-semibold text-foreground">{t("description")}</th>
                <th className="text-start px-4 py-3 font-semibold text-foreground">{t("category")}</th>
                <th className="text-start px-4 py-3 font-semibold text-foreground">{t("amount")}</th>
                <th className="text-start px-4 py-3 font-semibold text-foreground">{t("payment_method")}</th>
                <th className="text-start px-4 py-3 font-semibold text-foreground">{t("date")}</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense, index) => (
                <tr key={expense.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary cursor-pointer hover:underline" onClick={() => setShowVoucher(expense)}>{expense.voucher_number}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{expense.description}</td>
                  <td className="px-4 py-2.5"><span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">{expense.category_name}</span></td>
                  <td className="px-4 py-2.5 font-bold text-destructive">{expense.amount.toFixed(2)} {t("sar")}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{paymentMethods.find((p) => p.value === expense.payment_method)?.label || expense.payment_method}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{expense.expense_date}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setShowVoucher(expense)} className="h-8 w-8 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors" title={t("view_voucher")}><FileText className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(expense)} className="h-8 w-8 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors" title={t("edit")}><Pencil className="h-4 w-4" /></button>
                      {deleteConfirm === expense.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(expense.id)} className="h-8 w-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteConfirm(null)} className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(expense.id)} className="h-8 w-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors" title={t("delete")}><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground"><Wallet className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>{t("no_expenses")}</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Categories Management */
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {/* Add category */}
          <div className="flex items-center gap-2 mb-6 max-w-lg">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder={t("add") + " " + t("category") + "..."}
              className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t("add")}
            </button>
          </div>

          {/* Categories list */}
          <div className="space-y-2 max-w-lg">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>{t("no_data")}</p>
              </div>
            ) : (
              categories.map((cat) => {
                const expCount = expenses.filter((e) => e.category_id === cat.id).length;
                const expTotal = expenses.filter((e) => e.category_id === cat.id).reduce((s, e) => s + e.amount, 0);

                return (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/20 transition-colors">
                    <Tag className="h-4 w-4 text-primary shrink-0" />
                    {editingCatId === cat.id ? (
                      <input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateCategory(cat.id)}
                        className="flex-1 border border-primary rounded px-2 py-1 text-sm bg-background focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 font-medium text-foreground text-sm">{cat.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{expCount} {t("voucher")}</span>
                    <span className="text-xs font-bold text-destructive">{expTotal.toFixed(2)} {t("sar")}</span>
                    <div className="flex items-center gap-1">
                      {editingCatId === cat.id ? (
                        <>
                          <button onClick={() => handleUpdateCategory(cat.id)} className="h-7 w-7 rounded flex items-center justify-center text-accent hover:bg-accent/10 transition-colors"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditingCatId(null)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="h-7 w-7 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                          {deleteCatConfirm === cat.id ? (
                            <>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="h-7 w-7 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setDeleteCatConfirm(null)} className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"><X className="h-3.5 w-3.5" /></button>
                            </>
                          ) : (
                            <button onClick={() => setDeleteCatConfirm(cat.id)} className="h-7 w-7 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">{editingId ? t("edit_expense") : t("add_new_expense")}</h2>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("expense_description")} *</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" maxLength={200} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("amount")} ({t("sar")}) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("date")}</label>
                  <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("category")}</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("payment_method")}</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {paymentMethods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("notes")}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" maxLength={500} />
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 border-t border-border">
              <button onClick={handleSave} className="flex-1 bg-accent text-accent-foreground py-2.5 rounded-md font-bold text-sm hover:bg-accent/90 transition-colors">{editingId ? t("save_changes") : t("add_expense")}</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Preview Modal */}
      {showVoucher && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowVoucher(null)}>
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center border-b border-border">
              <Wallet className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="font-bold text-foreground text-lg">{t("expense_voucher")}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t("voucher_number")}: {showVoucher.voucher_number}</p>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("description")}:</span><span className="font-medium text-foreground">{showVoucher.description}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("amount")}:</span><span className="font-bold text-destructive">{showVoucher.amount.toFixed(2)} {t("sar")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("category")}:</span><span className="text-foreground">{showVoucher.category_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("payment_method")}:</span><span className="text-foreground">{paymentMethods.find((p) => p.value === showVoucher.payment_method)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("date")}:</span><span className="text-foreground">{showVoucher.expense_date}</span></div>
              {showVoucher.notes && <div className="flex justify-between"><span className="text-muted-foreground">{t("notes")}:</span><span className="text-foreground">{showVoucher.notes}</span></div>}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={() => { window.print(); }} className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors">{t("print_voucher")}</button>
              <button onClick={() => setShowVoucher(null)} className="px-6 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">{t("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManagement;
