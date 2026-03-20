import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Warehouse, RefreshCw, Package, Phone, Calendar, Clock, ArrowUpDown } from "lucide-react";
import { autoTransitionOrders } from "@/utils/autoTransitionOrders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getOrderStageSettings } from "@/utils/autoTransitionOrders";

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji?: string;
}

interface WarehouseInvoice {
  id: string;
  invoice_number: string;
  created_at: string;
  total: number;
  status: string;
  customer_id: string | null;
  customer_phone: string | null;
  items: InvoiceItem[];
  days_since: number;
}

const WarehouseManagement = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<WarehouseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  const stageSettings = getOrderStageSettings();
  const WAREHOUSE_THRESHOLD_MS = (stageSettings.cleaningDays + stageSettings.readyDays) * 24 * 60 * 60 * 1000;

  const fetchWarehouseItems = async () => {
    setLoading(true);
    try {
      await autoTransitionOrders();
      const twoMonthsAgo = new Date(Date.now() - WAREHOUSE_THRESHOLD_MS).toISOString();

      // Fetch invoices older than 2 months that are NOT delivered/cancelled
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .lt("created_at", twoMonthsAgo)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mapped: WarehouseInvoice[] = (data || []).map((inv) => {
        const daysSince = Math.floor((Date.now() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          created_at: inv.created_at,
          total: inv.total,
          status: inv.status,
          customer_id: inv.customer_id,
          customer_phone: inv.customer_phone,
          items: Array.isArray(inv.items) ? (inv.items as unknown as InvoiceItem[]) : [],
          days_since: daysSince,
        };
      });

      setInvoices(mapped);
    } catch (err) {
      console.error("Error fetching warehouse items:", err);
      toast.error(t("error_loading_data") || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const transferToWarehouse = async () => {
    setTransferring(true);
    try {
      const twoMonthsAgo = new Date(Date.now() - WAREHOUSE_THRESHOLD_MS).toISOString();

      const { error } = await supabase
        .from("invoices")
        .update({ status: "warehouse", status_updated_at: new Date().toISOString() })
        .lt("created_at", twoMonthsAgo)
        .not("status", "in", '("delivered","cancelled","warehouse")');

      if (error) throw error;

      toast.success(t("warehouse_transfer_success") || "تم تحويل الطلبات للمستودع بنجاح");
      fetchWarehouseItems();
    } catch (err) {
      console.error("Error transferring to warehouse:", err);
      toast.error(t("error_occurred") || "حدث خطأ");
    } finally {
      setTransferring(false);
    }
  };

  useEffect(() => {
    fetchWarehouseItems();
  }, []);

  const carpetItems = invoices.filter((inv) =>
    inv.items.some((item) =>
      ["سجاد", "سجادة", "موكيت", "carpet"].some((keyword) =>
        item.name.toLowerCase().includes(keyword)
      )
    )
  );

  const otherItems = invoices.filter((inv) => !carpetItems.includes(inv));

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Warehouse className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {t("warehouse") || "المستودع"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchWarehouseItems} disabled={loading}>
              <RefreshCw className={`h-4 w-4 me-1 ${loading ? "animate-spin" : ""}`} />
              {t("refresh") || "تحديث"}
            </Button>
            <Button size="sm" onClick={transferToWarehouse} disabled={transferring} className="bg-primary">
              <ArrowUpDown className="h-4 w-4 me-1" />
              {t("auto_transfer") || "تحويل تلقائي"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">{t("total_warehouse_items") || "إجمالي في المستودع"}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{invoices.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">{t("carpet_items") || "سجاد في المستودع"}</p>
            <p className="text-3xl font-bold text-primary mt-1">{carpetItems.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">{t("other_items") || "أصناف أخرى"}</p>
            <p className="text-3xl font-bold text-accent-foreground mt-1">{otherItems.length}</p>
          </div>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("loading") || "جاري التحميل..."}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("no_warehouse_items") || "لا توجد أصناف في المستودع"}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("warehouse_desc") || "يتم تحويل الطلبات تلقائياً بعد مرور شهرين من إصدار الفاتورة"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-start p-3 font-bold text-foreground">{t("invoice_number") || "رقم الفاتورة"}</th>
                    <th className="text-start p-3 font-bold text-foreground">{t("items") || "الأصناف"}</th>
                    <th className="text-start p-3 font-bold text-foreground">{t("total") || "الإجمالي"}</th>
                    <th className="text-start p-3 font-bold text-foreground">{t("phone") || "الجوال"}</th>
                    <th className="text-start p-3 font-bold text-foreground">{t("invoice_date") || "تاريخ الفاتورة"}</th>
                    <th className="text-start p-3 font-bold text-foreground">{t("days_passed") || "الأيام"}</th>
                    <th className="text-start p-3 font-bold text-foreground">{t("status") || "الحالة"}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-mono text-primary">{inv.invoice_number}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {inv.items.slice(0, 3).map((item, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {item.emoji} {item.name} x{item.quantity}
                            </Badge>
                          ))}
                          {inv.items.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{inv.items.length - 3}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-bold">{inv.total.toFixed(2)} {t("sar") || "ر.س"}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {inv.customer_phone || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="p-3">
                        <Badge variant={inv.days_since > 90 ? "destructive" : "secondary"}>
                          <Clock className="h-3 w-3 me-1" />
                          {inv.days_since} {t("day") || "يوم"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={inv.status === "warehouse" ? "default" : "outline"}>
                          {inv.status === "warehouse" ? (t("in_warehouse") || "في المستودع") : inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseManagement;
