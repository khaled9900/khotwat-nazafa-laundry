import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Search, ChevronDown, Clock, Sparkles, CheckCircle2, Truck, Package, Eye, X } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { exportInvoices } from "@/utils/exportUtils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  items: any;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  delivery_date: string | null;
  created_at: string;
  status_updated_at: string | null;
  customer_phone: string | null;
}

const ORDER_STATUSES = ["new", "cleaning", "ready", "delivered"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string; bg: string; borderColor: string }> = {
  new: { label: "جديد", icon: Sparkles, color: "text-amber-600", bg: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  cleaning: { label: "قيد التنظيف", icon: Clock, color: "text-primary", bg: "bg-primary/10", borderColor: "border-primary/30" },
  ready: { label: "جاهز", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  delivered: { label: "مُسلَّم", icon: Truck, color: "text-muted-foreground", bg: "bg-secondary", borderColor: "border-border" },
};

// Keep old statuses mapped
const legacyStatusMap: Record<string, OrderStatus> = {
  completed: "delivered",
  pending: "new",
  processing: "cleaning",
  cancelled: "delivered",
};

const paymentLabels: Record<string, string> = {
  cash: "نقدي",
  نقدي: "نقدي",
  card: "شبكة",
  بطاقة: "شبكة",
  transfer: "تحويل",
  تحويل: "تحويل",
};

const PosOrders = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvoices(data as any);
    setLoading(false);
  };

  const normalizeStatus = (status: string): OrderStatus => {
    if (ORDER_STATUSES.includes(status as OrderStatus)) return status as OrderStatus;
    return legacyStatusMap[status] || "new";
  };

  const updateOrderStatus = async (invoiceId: string, newStatus: OrderStatus) => {
    setUpdatingId(invoiceId);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus, status_updated_at: new Date().toISOString() } as any)
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: newStatus, status_updated_at: new Date().toISOString() } : inv
        )
      );

      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice((prev) => prev ? { ...prev, status: newStatus, status_updated_at: new Date().toISOString() } : null);
      }

      const statusLabel = statusConfig[newStatus].label;
      toast.success(`تم تحديث الحالة إلى "${statusLabel}" ✅`);

      // Notify customer if status is "ready"
      if (newStatus === "ready") {
        const inv = invoices.find((i) => i.id === invoiceId);
        if (inv?.customer_phone || inv?.customer_id) {
          toast.info("💬 يمكنك إرسال إشعار للعميل بأن طلبه جاهز", { duration: 5000 });
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("حدث خطأ في تحديث الحالة");
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = ORDER_STATUSES.indexOf(current);
    if (idx < ORDER_STATUSES.length - 1) return ORDER_STATUSES[idx + 1];
    return null;
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.total.toString().includes(search);
    const normalized = normalizeStatus(inv.status);
    const matchStatus = statusFilter === "all" || normalized === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = invoices.reduce((acc, inv) => {
    const s = normalizeStatus(inv.status);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">الطلبات</h1>
          <Badge variant="secondary" className="mr-auto">{invoices.length} طلب</Badge>
          <ExportButtons
            onExportPDF={() => exportInvoices(filtered, "pdf")}
            onExportExcel={() => exportInvoices(filtered, "excel")}
            disabled={filtered.length === 0}
          />
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ORDER_STATUSES.map((s) => {
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            const count = statusCounts[s] || 0;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  statusFilter === s
                    ? `${cfg.bg} ${cfg.borderColor} border-2 shadow-sm`
                    : "bg-card border-border hover:bg-secondary/30"
                }`}
              >
                <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                  <Icon className={`h-4.5 w-4.5 ${cfg.color}`} />
                </div>
                <div className="text-start">
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الفاتورة أو المبلغ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            الكل ({invoices.length})
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {statusConfig[s].label} ({statusCounts[s] || 0})
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => {
              const status = normalizeStatus(inv.status);
              const cfg = statusConfig[status];
              const Icon = cfg.icon;
              const nextStatus = getNextStatus(status);
              const isUpdating = updatingId === inv.id;

              return (
                <div
                  key={inv.id}
                  className={`bg-card border rounded-xl p-4 transition-all hover:shadow-md ${cfg.borderColor}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono font-bold text-primary text-sm">{inv.invoice_number}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.borderColor}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{format(new Date(inv.created_at), "dd MMM yyyy - hh:mm a", { locale: ar })}</span>
                        <span>{paymentLabels[inv.payment_method] || inv.payment_method}</span>
                        {inv.delivery_date && (
                          <span>التسليم: {format(new Date(inv.delivery_date), "dd MMM", { locale: ar })}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: total + actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-foreground">{Number(inv.total).toLocaleString()} ر.س</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                          title="تفاصيل"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        {nextStatus && (
                          <button
                            onClick={() => updateOrderStatus(inv.id, nextStatus)}
                            disabled={isUpdating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              statusConfig[nextStatus].bg
                            } ${statusConfig[nextStatus].color} hover:opacity-80 disabled:opacity-50`}
                          >
                            {isUpdating ? (
                              <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <>
                                {(() => { const NIcon = statusConfig[nextStatus].icon; return <NIcon className="h-3 w-3" />; })()}
                                {statusConfig[nextStatus].label}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status timeline */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                    {ORDER_STATUSES.map((s, i) => {
                      const stepCfg = statusConfig[s];
                      const StepIcon = stepCfg.icon;
                      const currentIdx = ORDER_STATUSES.indexOf(status);
                      const isActive = i <= currentIdx;
                      const isCurrent = i === currentIdx;
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <button
                            onClick={() => {
                              if (s !== status) updateOrderStatus(inv.id, s);
                            }}
                            disabled={isUpdating}
                            className={`flex items-center gap-1 text-[10px] font-medium transition-all rounded-md px-1.5 py-1 ${
                              isCurrent
                                ? `${stepCfg.color} ${stepCfg.bg} font-bold`
                                : isActive
                                ? "text-muted-foreground"
                                : "text-muted-foreground/40"
                            } hover:opacity-70 disabled:opacity-50`}
                            title={`تغيير إلى ${stepCfg.label}`}
                          >
                            <StepIcon className={`h-3 w-3 ${isActive ? stepCfg.color : "text-muted-foreground/30"}`} />
                            <span className="hidden sm:inline">{stepCfg.label}</span>
                          </button>
                          {i < ORDER_STATUSES.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 rounded ${isActive && i < currentIdx ? "bg-emerald-400" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              تفاصيل الطلب {selectedInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (() => {
            const status = normalizeStatus(selectedInvoice.status);
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            const items = Array.isArray(selectedInvoice.items) ? selectedInvoice.items : [];
            return (
              <div className="space-y-4">
                {/* Current status */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${cfg.bg} ${cfg.borderColor} border`}>
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                  <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                  {selectedInvoice.status_updated_at && (
                    <span className="text-xs text-muted-foreground mr-auto">
                      {format(new Date(selectedInvoice.status_updated_at), "dd MMM hh:mm a", { locale: ar })}
                    </span>
                  )}
                </div>

                {/* Status change buttons */}
                <div className="flex gap-2 flex-wrap">
                  {ORDER_STATUSES.map((s) => {
                    const sCfg = statusConfig[s];
                    const SIcon = sCfg.icon;
                    return (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus(selectedInvoice.id, s)}
                        disabled={s === status || updatingId === selectedInvoice.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                          s === status
                            ? `${sCfg.bg} ${sCfg.color} ${sCfg.borderColor} opacity-50 cursor-default`
                            : `bg-card border-border hover:${sCfg.bg} hover:${sCfg.borderColor} text-foreground`
                        } disabled:opacity-40`}
                      >
                        <SIcon className="h-3.5 w-3.5" />
                        {sCfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2">الأصناف</h4>
                  <div className="space-y-1.5">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2">
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-muted-foreground">{item.quantity} × {Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المجموع</span>
                    <span>{Number(selectedInvoice.subtotal).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>{Number(selectedInvoice.tax).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span>الإجمالي</span>
                    <span className="text-primary">{Number(selectedInvoice.total).toFixed(2)} ر.س</span>
                  </div>
                </div>

                {/* Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>طريقة الدفع: {paymentLabels[selectedInvoice.payment_method] || selectedInvoice.payment_method}</p>
                  <p>تاريخ الإنشاء: {format(new Date(selectedInvoice.created_at), "dd MMM yyyy hh:mm a", { locale: ar })}</p>
                  {selectedInvoice.delivery_date && (
                    <p>تاريخ التسليم: {format(new Date(selectedInvoice.delivery_date), "dd MMM yyyy", { locale: ar })}</p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PosOrders;
