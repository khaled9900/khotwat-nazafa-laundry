import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, FileDown, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ArabicReshaper from "arabic-reshaper";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const reshapeArabic = (text: string): string => {
  if (!text) return "";
  try {
    const reshaped = ArabicReshaper.convertArabic(text);
    return reshaped.split("").reverse().join("");
  } catch {
    return text;
  }
};

const paymentMethodLabel = (method: string) => {
  switch (method) {
    case "cash": return "نقدي";
    case "card": return "شبكة";
    case "transfer": return "حوالة";
    case "credit": return "آجل";
    default: return method;
  }
};

const PaidInvoicesReport = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  });
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [filterPayment, setFilterPayment] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("id, name, code, phone");
      if (data) setCustomers(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      const toStr = format(toDate, "yyyy-MM-dd");

      const { data } = await supabase
        .from("invoices")
        .select("*")
        .in("status", ["completed", "delivered"])
        .gte("created_at", fromStr)
        .lt("created_at", toStr)
        .order("created_at", { ascending: true });

      if (data) setInvoices(data);
      setLoading(false);
    })();
  }, [dateFrom, dateTo]);

  const filteredInvoices = useMemo(() => {
    if (filterPayment === "all") return invoices;
    return invoices.filter((inv) => inv.payment_method === filterPayment);
  }, [invoices, filterPayment]);

  const getCustomer = (id: string | null) => {
    if (!id) return null;
    return customers.find((c) => c.id === id);
  };

  const getItemCount = (items: any) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
  };

  // Summary calculations
  const summary = useMemo(() => {
    const subtotalAll = filteredInvoices.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const taxAll = filteredInvoices.reduce((s, i) => s + Number(i.tax || 0), 0);
    const totalAll = filteredInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const itemsAll = filteredInvoices.reduce((s, i) => s + getItemCount(i.items), 0);

    const cashTotal = filteredInvoices.filter(i => i.payment_method === "cash").reduce((s, i) => s + Number(i.total), 0);
    const cardTotal = filteredInvoices.filter(i => i.payment_method === "card").reduce((s, i) => s + Number(i.total), 0);
    const transferTotal = filteredInvoices.filter(i => i.payment_method === "transfer").reduce((s, i) => s + Number(i.total), 0);
    const creditTotal = filteredInvoices.filter(i => i.payment_method === "credit").reduce((s, i) => s + Number(i.total), 0);

    return { subtotalAll, taxAll, totalAll, itemsAll, cashTotal, cardTotal, transferTotal, creditTotal };
  }, [filteredInvoices]);

  const company = useMemo(() => {
    try {
      const saved = localStorage.getItem("companyData");
      if (saved) return { ...JSON.parse(saved) };
    } catch {}
    return {
      name: "مغاسل خطوة نظافة - Clean Step Laundry",
      phone: "0569010202 / 0553310077",
      city: "المدينة المنورة",
    };
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 12;

    // Load Amiri font
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(reshapeArabic(company.name || "مغاسل خطوة نظافة"), pageW / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (company.city) {
      doc.text(reshapeArabic(company.city), pageW / 2, y, { align: "center" });
      y += 5;
    }
    if (company.phone) {
      doc.text(company.phone, pageW / 2, y, { align: "center" });
      y += 5;
    }

    // Report title
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(reshapeArabic("تقرير عن الفواتير المدفوعة خلال فترة"), pageW / 2, y, { align: "center" });
    y += 6;

    // Filters info
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dateRange = `${format(dateFrom, "yyyy-MM-dd")} → ${format(dateTo, "yyyy-MM-dd")}`;
    doc.text(dateRange, pageW / 2, y, { align: "center" });
    y += 6;

    // Table
    const tableBody = filteredInvoices.map((inv) => {
      const customer = getCustomer(inv.customer_id);
      const items = Array.isArray(inv.items) ? inv.items : [];
      const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);

      return [
        inv.payment_method ? paymentMethodLabel(inv.payment_method) : "",
        Number(inv.total).toFixed(2),
        Number(inv.tax).toFixed(2),
        "0.00", // discount placeholder
        "0.00", // delivery placeholder
        Number(inv.subtotal).toFixed(2),
        inv.status === "completed" ? reshapeArabic("مكتملة") : reshapeArabic("مسلمة"),
        String(itemCount),
        customer ? `${customer.code} / ${customer.name}` : "-",
        inv.delivery_date ? format(new Date(inv.delivery_date), "yyyy/MM/dd") : "-",
        format(new Date(inv.created_at), "yyyy/MM/dd"),
        inv.invoice_number,
      ];
    });

    doc.autoTable({
      head: [[
        reshapeArabic("طريقة الدفع"),
        reshapeArabic("إجمالي"),
        reshapeArabic("الضريبة"),
        reshapeArabic("الخصم"),
        reshapeArabic("التوصيل"),
        reshapeArabic("المبلغ"),
        reshapeArabic("حالة الفاتورة"),
        reshapeArabic("القطع"),
        reshapeArabic("رقم / اسم العميل"),
        reshapeArabic("تاريخ التسليم"),
        reshapeArabic("تاريخ الفاتورة"),
        reshapeArabic("رقم الفاتورة"),
      ]],
      body: tableBody,
      startY: y,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, halign: "center", lineWidth: 0.1 },
      headStyles: {
        fillColor: [200, 215, 235],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 8, right: 8 },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Summary section
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const col1X = pageW - 15;
    const col2X = pageW * 0.55;
    const col3X = 15;

    const summaryRight = [
      [reshapeArabic("إجمالي الفواتير بدون ضريبة:"), summary.subtotalAll.toFixed(2)],
      [reshapeArabic("إجمالي الخصومات:"), "0.00"],
      [reshapeArabic("إجمالي التوصيل:"), "0.00"],
      [reshapeArabic("إجمالي الضريبة:"), summary.taxAll.toFixed(2)],
      [reshapeArabic("إجمالي الفواتير بالضريبة:"), summary.totalAll.toFixed(2)],
    ];

    const summaryMiddle = [
      [reshapeArabic("الفواتير المدفوعة من أرصدة العملاء:"), "0.00"],
      [reshapeArabic("إجمالي الفواتير من غير الاشتراكات:"), summary.totalAll.toFixed(2)],
      [reshapeArabic("إجمالي القطع:"), String(summary.itemsAll)],
    ];

    const summaryLeft = [
      [reshapeArabic("إجمالي الفواتير الكاش المدفوعة:"), summary.cashTotal.toFixed(2)],
      [reshapeArabic("إجمالي فواتير البطاقة المدفوعة:"), summary.cardTotal.toFixed(2)],
      [reshapeArabic("إجمالي فواتير الشبكة:"), summary.cardTotal.toFixed(2)],
      [reshapeArabic("إجمالي فواتير حوالة/شيك:"), summary.transferTotal.toFixed(2)],
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    let sy = y;
    summaryRight.forEach(([label, val]) => {
      doc.text(label, col1X, sy, { align: "right" });
      doc.text(val, col1X - 55, sy, { align: "left" });
      sy += 4;
    });

    sy = y;
    summaryMiddle.forEach(([label, val]) => {
      doc.text(label, col2X + 30, sy, { align: "right" });
      doc.text(val, col2X - 25, sy, { align: "left" });
      sy += 4;
    });

    sy = y;
    summaryLeft.forEach(([label, val]) => {
      doc.text(label, col3X + 70, sy, { align: "right" });
      doc.text(val, col3X, sy, { align: "left" });
      sy += 4;
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.text(`${reshapeArabic("تاريخ الطباعة:")} ${format(new Date(), "yyyy/MM/dd")}`, 15, footerY);
    doc.text(`Page 1 of 1 : ${reshapeArabic("رقم الصفحة")}`, pageW - 15, footerY, { align: "right" });

    doc.save(`paid-invoices-report-${format(dateFrom, "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-full mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-center space-y-1 mb-4">
            <h1 className="text-lg font-bold text-foreground">{company.name || "مغاسل خطوة نظافة"}</h1>
            {company.city && <p className="text-sm text-muted-foreground">{company.city}</p>}
            {company.phone && <p className="text-xs text-muted-foreground">ت: {company.phone}</p>}
            <h2 className="text-base font-bold text-primary mt-2">تقرير عن الفواتير المدفوعة لمستخدم خلال فترة</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 justify-between bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">الفترة:</span>
              <span className="text-xs text-muted-foreground">من</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {format(dateFrom, "yyyy-MM-dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">إلى</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {format(dateTo, "yyyy-MM-dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">طريقة الدفع:</span>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="card">شبكة</SelectItem>
                  <SelectItem value="transfer">حوالة</SelectItem>
                  <SelectItem value="credit">آجل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExportPDF} size="sm" variant="destructive" className="h-8 text-xs gap-1">
              <FileDown className="h-3.5 w-3.5" />
              تصدير PDF
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>عدد الفواتير: {filteredInvoices.length} | الإجمالي: {summary.totalAll.toLocaleString()} ر.س</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد فواتير مدفوعة في هذه الفترة</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-primary/10">
                  <th className="text-right py-2.5 px-3 font-bold text-foreground">رقم الفاتورة</th>
                  <th className="text-right py-2.5 px-3 font-bold text-foreground">تاريخ الفاتورة</th>
                  <th className="text-right py-2.5 px-3 font-bold text-foreground">تاريخ التسليم</th>
                  <th className="text-right py-2.5 px-3 font-bold text-foreground">رقم / اسم العميل</th>
                  <th className="text-center py-2.5 px-3 font-bold text-foreground">القطع</th>
                  <th className="text-center py-2.5 px-3 font-bold text-foreground">حالة الفاتورة</th>
                  <th className="text-left py-2.5 px-3 font-bold text-foreground">المبلغ</th>
                  <th className="text-left py-2.5 px-3 font-bold text-foreground">الخصم</th>
                  <th className="text-left py-2.5 px-3 font-bold text-foreground">الضريبة</th>
                  <th className="text-left py-2.5 px-3 font-bold text-foreground">إجمالي</th>
                  <th className="text-center py-2.5 px-3 font-bold text-foreground">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const customer = getCustomer(inv.customer_id);
                  const items = Array.isArray(inv.items) ? inv.items : [];
                  const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);

                  return (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 font-mono text-primary font-bold">{inv.invoice_number}</td>
                      <td className="py-2 px-3 text-muted-foreground">{format(new Date(inv.created_at), "yyyy/MM/dd")}</td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {inv.delivery_date ? format(new Date(inv.delivery_date), "yyyy/MM/dd") : "-"}
                      </td>
                      <td className="py-2 px-3">
                        {customer ? (
                          <span>{customer.code} / {customer.name}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">{itemCount}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-accent-foreground">
                          {inv.status === "completed" ? "مكتملة" : "مسلمة"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-left">{Number(inv.subtotal).toFixed(2)}</td>
                      <td className="py-2 px-3 text-left text-destructive">0.00</td>
                      <td className="py-2 px-3 text-left">{Number(inv.tax).toFixed(2)}</td>
                      <td className="py-2 px-3 text-left font-bold">{Number(inv.total).toFixed(2)}</td>
                      <td className="py-2 px-3 text-center">{paymentMethodLabel(inv.payment_method)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Section - matching the PDF design */}
        {filteredInvoices.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Right column */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold">{summary.subtotalAll.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي الفواتير بدون ضريبة:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">0.00</span>
                  <span className="text-muted-foreground">إجمالي الخصومات:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">0.00</span>
                  <span className="text-muted-foreground">إجمالي التوصيل:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{summary.taxAll.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي الضريبة:</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-extrabold text-primary text-sm">{summary.totalAll.toFixed(2)}</span>
                  <span className="font-bold text-foreground">إجمالي الفواتير بالضريبة:</span>
                </div>
              </div>

              {/* Middle column */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold">0.00</span>
                  <span className="text-muted-foreground">الفواتير المدفوعة من أرصدة العملاء:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{summary.totalAll.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي الفواتير من غير الاشتراكات:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{summary.itemsAll}</span>
                  <span className="text-muted-foreground">إجمالي القطع:</span>
                </div>
              </div>

              {/* Left column */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold">{summary.cashTotal.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي الفواتير الكاش المدفوعة:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{summary.cardTotal.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي فواتير البطاقة المدفوعة:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{summary.cardTotal.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي فواتير الشبكة:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{summary.transferTotal.toFixed(2)}</span>
                  <span className="text-muted-foreground">إجمالي فواتير حوالة/شيك:</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaidInvoicesReport;
