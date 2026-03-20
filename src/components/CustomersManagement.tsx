import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Check, Users, Phone, Mail, MapPin, Loader2, FileText, Receipt } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { exportCustomers } from "@/utils/exportUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  code: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
}

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: CustomerFormData = { name: "", phone: "", email: "", address: "", notes: "" };

const CustomersManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomerInvoices = useCallback(async (customerId: string) => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCustomerInvoices(data || []);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setCustomerInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const selectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerInvoices(customer.id);
  }, [fetchCustomerInvoices]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setCustomers((data || []).map((c: any) => ({
        id: c.id,
        code: c.code || 0,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        notes: c.notes,
        created_at: c.created_at,
        total_orders: c.total_orders,
        total_spent: Number(c.total_spent),
        loyalty_points: c.loyalty_points || 0,
      })));
    } catch (err) {
      console.error("Error loading customers:", err);
      toast.error("حدث خطأ أثناء تحميل العملاء");
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.includes(searchQuery) || c.phone.includes(searchQuery) || String(c.code).includes(searchQuery)
  );

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, notes: c.notes });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
    if (!form.phone.trim()) { toast.error("يرجى إدخال رقم الجوال"); return; }
    if (form.phone.trim().length < 10) { toast.error("رقم الجوال يجب أن يكون 10 أرقام على الأقل"); return; }

    try {
      if (editingId) {
        const { error } = await supabase.from("customers").update({
          name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
          address: form.address.trim(), notes: form.notes.trim(),
        }).eq("id", editingId);
        if (error) throw error;
        setCustomers((prev) => prev.map((c) => c.id === editingId ? {
          ...c, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
          address: form.address.trim(), notes: form.notes.trim(),
        } : c));
        if (selectedCustomer?.id === editingId) {
          setSelectedCustomer((prev) => prev ? { ...prev, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(), notes: form.notes.trim() } : null);
        }
        toast.success("تم تعديل بيانات العميل بنجاح ✅");
      } else {
        const { data, error } = await supabase.from("customers").insert({
          name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
          address: form.address.trim(), notes: form.notes.trim(),
        }).select().single();
        if (error) throw error;
        setCustomers((prev) => [{
          id: data.id, code: (data as any).code || 0, name: data.name, phone: data.phone, email: data.email,
          address: data.address, notes: data.notes, created_at: data.created_at,
          total_orders: data.total_orders, total_spent: Number(data.total_spent), loyalty_points: 0,
        }, ...prev]);
        toast.success("تم إضافة العميل بنجاح ✅");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving customer:", err);
      toast.error("حدث خطأ أثناء حفظ البيانات");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
      setDeleteConfirm(null);
      toast.success("تم حذف العميل ✅");
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("حدث خطأ أثناء حذف العميل");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-background min-h-0 overflow-hidden">
      {/* Main Table */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">إدارة العملاء</h1>
            </div>
            <div className="flex items-center gap-2">
              <ExportButtons
                onExportPDF={() => exportCustomers(filtered, "pdf")}
                onExportExcel={() => exportCustomers(filtered, "excel")}
                disabled={filtered.length === 0}
              />
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-bold hover:bg-accent/90 transition-colors">
                <Plus className="h-4 w-4" />
                إضافة عميل جديد
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="بحث بالاسم أو الرقم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-border rounded-md pr-10 pl-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} عميل</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 sticky top-0 z-10">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-foreground">كود العميل</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">اسم العميل</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">رقم الجوال</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">المدينة</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">الطلبات</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">إجمالي الإنفاق</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">نقاط الولاء</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer, index) => (
                <tr key={customer.id} onClick={() => selectCustomer(customer)} className={`border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer ${selectedCustomer?.id === customer.id ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-primary font-bold">{customer.code}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{customer.name}</td>
                  <td className="px-4 py-2.5 text-foreground font-mono text-xs" dir="ltr">{customer.phone}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{customer.address.split(" - ")[0]}</td>
                  <td className="px-4 py-2.5"><span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">{customer.total_orders}</span></td>
                  <td className="px-4 py-2.5 font-bold text-price-tag">{customer.total_spent.toFixed(2)} ر.س</td>
                  <td className="px-4 py-2.5"><span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded text-xs font-bold">⭐ {customer.loyalty_points}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(customer); }} className="h-8 w-8 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors" title="تعديل"><Pencil className="h-4 w-4" /></button>
                      {deleteConfirm === customer.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }} className="h-8 w-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors" title="تأكيد الحذف"><Check className="h-4 w-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }} className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors" title="إلغاء"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(customer.id); }} className="h-8 w-8 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors" title="حذف"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>لا يوجد عملاء</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Panel */}
      {selectedCustomer && (
        <div className="w-80 border-s border-border bg-card flex flex-col shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-foreground text-sm">بيانات العميل</h2>
            <button onClick={() => setSelectedCustomer(null)} className="h-7 w-7 rounded flex items-center justify-center hover:bg-secondary transition-colors"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-8 w-8 text-primary" /></div>
              <h3 className="font-bold text-foreground text-lg">{selectedCustomer.name}</h3>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">كود: {selectedCustomer.code}</span>
            </div>
            <div className="space-y-3 bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-primary shrink-0" /><span className="text-foreground font-mono text-xs" dir="ltr">{selectedCustomer.phone}</span></div>
              {selectedCustomer.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-primary shrink-0" /><span className="text-foreground text-xs">{selectedCustomer.email}</span></div>}
              {selectedCustomer.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary shrink-0" /><span className="text-foreground text-xs">{selectedCustomer.address}</span></div>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/30 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-primary">{selectedCustomer.total_orders}</div><div className="text-xs text-muted-foreground">إجمالي الطلبات</div></div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center"><div className="text-lg font-bold text-price-tag">{selectedCustomer.total_spent.toFixed(0)}</div><div className="text-xs text-muted-foreground">إجمالي الإنفاق (ر.س)</div></div>
              <div className="bg-amber-500/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-amber-600">⭐ {selectedCustomer.loyalty_points}</div><div className="text-xs text-muted-foreground">نقاط الولاء</div></div>
            </div>
            {selectedCustomer.notes && <div className="bg-secondary/30 rounded-lg p-3"><div className="text-xs font-semibold text-foreground mb-1">ملاحظات</div><p className="text-xs text-muted-foreground">{selectedCustomer.notes}</p></div>}
            <div className="text-xs text-muted-foreground text-center">تاريخ التسجيل: {new Date(selectedCustomer.created_at).toLocaleDateString("ar-SA")}</div>
            <button onClick={() => openEdit(selectedCustomer)} className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors">تعديل البيانات</button>

            {/* Customer Invoices */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">سجل الفواتير</h3>
                <span className="text-xs text-muted-foreground">({customerInvoices.length})</span>
              </div>
              {loadingInvoices ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : customerInvoices.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">لا توجد فواتير</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {customerInvoices.map((inv) => (
                    <div key={inv.id} className="bg-secondary/30 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-primary font-bold">#{inv.invoice_number}</span>
                        <span className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("ar-SA")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {Array.isArray(inv.items) ? inv.items.length : 0} منتجات
                        </span>
                        <span className="text-sm font-bold text-price-tag">{Number(inv.total).toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.payment_method === 'cash' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {inv.payment_method === 'cash' ? 'نقدي' : inv.payment_method === 'card' ? 'بطاقة' : inv.payment_method}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">{editingId ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</h2>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">اسم العميل *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="مثال: أحمد محمد" maxLength={100} /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">رقم الجوال *</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+]/g, "") })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" dir="ltr" placeholder="05XXXXXXXX" maxLength={15} /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">البريد الإلكتروني</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" placeholder="email@example.com" maxLength={255} /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">العنوان</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="المدينة - الحي" maxLength={200} /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">ملاحظات</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="ملاحظات إضافية..." maxLength={500} /></div>
            </div>
            <div className="flex items-center gap-2 p-4 border-t border-border">
              <button onClick={handleSave} className="flex-1 bg-accent text-accent-foreground py-2.5 rounded-md font-bold text-sm hover:bg-accent/90 transition-colors">{editingId ? "حفظ التعديلات" : "إضافة العميل"}</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;
