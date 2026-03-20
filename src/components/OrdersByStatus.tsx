import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, Package, RefreshCw, User, Phone, MapPin, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { autoTransitionOrders } from "@/utils/autoTransitionOrders";

interface OrdersByStatusProps {
  status: "cleaning" | "ready";
  title: string;
  icon: React.ReactNode;
}

const OrdersByStatus = ({ status, title, icon }: OrdersByStatusProps) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverNames, setDriverNames] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [drivers, setDrivers] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [showDriverDropdown, setShowDriverDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
    supabase.from("drivers").select("id, name, phone").eq("is_active", true).order("name").then(({ data }) => {
      if (data) setDrivers(data);
    });
  }, [status]);

  const fetchInvoices = async () => {
    setLoading(true);
    await autoTransitionOrders();
    const { data } = await supabase
      .from("invoices")
      .select("*, customers(name, phone, address)")
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (data) {
      setInvoices(data);
      const drivers: Record<string, string> = {};
      const payments: Record<string, string> = {};
      data.forEach((inv: any) => {
        drivers[inv.id] = inv.driver_name || "";
        payments[inv.id] = inv.payment_method || "الدفع عند الإستلام";
      });
      setDriverNames(drivers);
      setPaymentMethods(payments);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const driver = driverNames[id] || "";
    const payment = paymentMethods[id] || "الدفع عند الإستلام";
    const { error } = await supabase
      .from("invoices")
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString(),
        driver_name: driver,
        payment_method: payment,
      } as any)
      .eq("id", id);
    if (!error) {
      toast({ title: "تم", description: "تم تحديث حالة الطلب بنجاح" });
      fetchInvoices();
    }
  };

  const getItems = (inv: any) => {
    try {
      const items = Array.isArray(inv.items) ? inv.items : [];
      return items.map((i: any) => `${i.name} x${i.quantity}`).join("، ");
    } catch {
      return "";
    }
  };

  const getCustomer = (inv: any) => {
    return inv.customers as any;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <Badge variant="secondary" className="mr-auto">{invoices.length}</Badge>
          <Button size="sm" variant="outline" onClick={fetchInvoices}>
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد طلبات بهذه الحالة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((inv) => {
              const customer = getCustomer(inv);
              return (
                <div key={inv.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">#{inv.invoice_number}</span>
                    <Badge variant={status === "cleaning" ? "default" : "secondary"}>
                      {status === "cleaning" ? "قيد التنفيذ" : "جاهزة للتسليم"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inv.created_at), "dd MMM yyyy HH:mm", { locale: ar })}
                  </p>

                  {/* Customer Info */}
                  <div className="space-y-1.5 bg-secondary/30 rounded-md p-2.5">
                    {customer?.name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-medium">{customer.name}</span>
                      </div>
                    )}
                    {(customer?.phone || inv.customer_phone) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-muted-foreground" dir="ltr">{customer?.phone || inv.customer_phone}</span>
                      </div>
                    )}
                    {customer?.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Driver Name - autocomplete */}
                  <div className="flex items-center gap-2 relative">
                    <Truck className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 relative">
                      <Input
                        placeholder="اسم السائق..."
                        value={driverNames[inv.id] || ""}
                        onChange={(e) => {
                          setDriverNames(prev => ({ ...prev, [inv.id]: e.target.value }));
                          setShowDriverDropdown(inv.id);
                        }}
                        onFocus={() => setShowDriverDropdown(inv.id)}
                        onBlur={() => setTimeout(() => setShowDriverDropdown(null), 200)}
                        className="h-8 text-sm"
                      />
                      {showDriverDropdown === inv.id && drivers.filter(d => !driverNames[inv.id] || d.name.toLowerCase().includes((driverNames[inv.id] || "").toLowerCase())).length > 0 && (
                        <div className="absolute top-full mt-1 start-0 end-0 bg-card border border-border rounded-md shadow-lg z-50 max-h-28 overflow-y-auto">
                          {drivers
                            .filter(d => !driverNames[inv.id] || d.name.toLowerCase().includes((driverNames[inv.id] || "").toLowerCase()))
                            .map((d) => (
                              <button
                                key={d.id}
                                onMouseDown={() => {
                                  setDriverNames(prev => ({ ...prev, [inv.id]: d.name }));
                                  setShowDriverDropdown(null);
                                }}
                                className="w-full text-start px-3 py-1.5 text-xs hover:bg-secondary/60 transition-colors border-b border-border last:border-0"
                              >
                                {d.name} {d.phone && <span className="text-muted-foreground" dir="ltr">({d.phone})</span>}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* العنوان */}
                  {inv.delivery_address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{inv.delivery_address}</span>
                    </div>
                  )}

                  {/* Payment Method - only for ready orders */}
                  {status === "ready" && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      <select
                        value={paymentMethods[inv.id] || "الدفع عند الإستلام"}
                        onChange={(e) => setPaymentMethods(prev => ({ ...prev, [inv.id]: e.target.value }))}
                        className="flex-1 h-8 text-sm border border-border rounded-md px-2 bg-background"
                      >
                        <option value="الدفع عند الإستلام">الدفع عند الإستلام</option>
                        <option value="كاش">كاش</option>
                        <option value="شبكة">شبكة</option>
                        <option value="تحويل">تحويل</option>
                      </select>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground line-clamp-2">{getItems(inv)}</p>
                  <p className="font-bold text-primary">{inv.total?.toLocaleString()} ر.س</p>
                  <div className="flex gap-2">
                    {status === "cleaning" && (
                      <Button size="sm" onClick={() => updateStatus(inv.id, "ready")} className="flex-1">
                        <Package className="h-4 w-4 ml-1" />
                        جاهز للتسليم
                      </Button>
                    )}
                    {status === "ready" && (
                      <Button size="sm" onClick={() => updateStatus(inv.id, "delivered")} className="flex-1">
                        <CheckCircle2 className="h-4 w-4 ml-1" />
                        تم التسليم
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersByStatus;
