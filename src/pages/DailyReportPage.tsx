import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, FileText, DollarSign, ShoppingCart, CreditCard, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: any;
  customer_id: string | null;
}

const DailyReportPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyInvoices();
  }, [selectedDate]);

  const fetchDailyInvoices = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("invoices")
      .select("*, customers(name)")
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInvoices(data as any);
    }
    setLoading(false);
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.tax), 0);
  const cashInvoices = invoices.filter((inv) => inv.payment_method === "cash");
  const cashTotal = cashInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const cardTotal = totalRevenue - cashTotal;

  const totalItems = invoices.reduce((sum, inv) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    return sum + items.reduce((s: number, item: any) => s + (item.quantity || 1), 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header with date picker */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              التقرير اليومي
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[220px] justify-start text-right font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {format(selectedDate, "dd MMMM yyyy", { locale: ar })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">عدد الفواتير</p>
                <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
              </CardContent>
            </Card>
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-accent-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-foreground">{totalRevenue.toFixed(2)} ر.س</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 text-center">
                <Banknote className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">نقدي</p>
                <p className="text-2xl font-bold text-foreground">{cashTotal.toFixed(2)} ر.س</p>
              </CardContent>
            </Card>
            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 text-secondary-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">شبكة</p>
                <p className="text-2xl font-bold text-foreground">{cardTotal.toFixed(2)} ر.س</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">عدد الأصناف المباعة</p>
                <p className="text-xl font-bold text-foreground">{totalItems}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">إجمالي الضريبة</p>
                <p className="text-xl font-bold text-foreground">{totalTax.toFixed(2)} ر.س</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">متوسط الفاتورة</p>
                <p className="text-xl font-bold text-foreground">
                  {invoices.length > 0 ? (totalRevenue / invoices.length).toFixed(2) : "0.00"} ر.س
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                فواتير يوم {format(selectedDate, "dd MMMM yyyy", { locale: ar })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
              ) : invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد فواتير في هذا اليوم</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">الأصناف</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الضريبة</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-right">الدفع</TableHead>
                        <TableHead className="text-right">الوقت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => {
                        const items = Array.isArray(inv.items) ? inv.items : [];
                        const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                            <TableCell>{(inv as any).customers?.name || "—"}</TableCell>
                            <TableCell>{itemCount}</TableCell>
                            <TableCell>{Number(inv.subtotal).toFixed(2)}</TableCell>
                            <TableCell>{Number(inv.tax).toFixed(2)}</TableCell>
                            <TableCell className="font-bold">{Number(inv.total).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={inv.payment_method === "cash" ? "default" : "secondary"}>
                                {inv.payment_method === "cash" ? "نقدي" : "شبكة"}
                              </Badge>
                            </TableCell>
                            <TableCell dir="ltr" className="text-right">
                              {format(new Date(inv.created_at), "hh:mm a")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default DailyReportPage;
