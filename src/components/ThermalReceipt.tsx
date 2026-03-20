import { useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { CartItem } from "@/data/products";
import { X, Printer, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface ThermalReceiptProps {
  cart: CartItem[];
  invoiceNumber: string;
  customerName: string;
  customerCode?: number | null;
  subtotal: number;
  discount: number;
  discountPercent: number;
  vat: number;
  total: number;
  paymentMethod: string;
  deliveryDate?: string;
  onClose: () => void;
  onSwitchToA4?: () => void;
}

const ThermalReceipt = ({
  cart,
  invoiceNumber,
  customerName,
  customerCode,
  subtotal,
  discount,
  discountPercent,
  vat,
  total,
  paymentMethod,
  deliveryDate,
  onClose,
  onSwitchToA4,
}: ThermalReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA");
  const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  const company = useMemo(() => {
    const defaults = {
      name: "مغاسل خطوة نظافة - Clean Step Laundry",
      phone: "0569010202 / 0553310077",
      email: "",
      address: "",
      city: "المدينة المنورة",
      country: "المملكة العربية السعودية",
      tax_number: "",
      commercial_reg: "",
    };
    try {
      const saved = localStorage.getItem("companyData");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      }
    } catch {}
    return defaults;
  }, []);

  const qrData = JSON.stringify({
    invoice: invoiceNumber,
    total,
    vat,
    date: now.toISOString(),
    seller: company.name,
    taxNumber: company.tax_number,
  });

  const logoUrl = useMemo(() => {
    try {
      const saved = localStorage.getItem("companyLogo");
      if (saved) return saved;
    } catch {}
    // Fallback to cloud storage logo
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/company-assets/logo.jpeg`;
  }, []);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة ${invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', monospace, sans-serif;
            width: 80mm;
            margin: 0 auto;
            padding: 4mm;
            font-size: 11px;
            color: #000;
            direction: rtl;
          }
          .center { text-align: center; }
          .bold { font-weight: 700; }
          .separator {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-weight: 700;
            font-size: 14px;
          }
          .qr-container {
            display: flex;
            justify-content: center;
            margin: 8px 0;
          }
          h2 { font-size: 16px; margin: 4px 0; }
          h3 { font-size: 12px; margin: 2px 0; font-weight: 600; }
          .small { font-size: 9px; color: #666; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    const pageW = 80; // 80mm thermal width
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageW, 200] });
    let y = 6;
    const cx = pageW / 2;
    const mx = 4; // margin

    // Company header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(company.name, cx, y, { align: "center" });
    y += 5;

    if (company.city || company.country) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text([company.city, company.country].filter(Boolean).join(" - "), cx, y, { align: "center" });
      y += 3;
    }
    if (company.tax_number) {
      doc.setFontSize(7);
      doc.text(`Tax: ${company.tax_number}`, cx, y, { align: "center" });
      y += 3;
    }
    if (company.phone) {
      doc.setFontSize(7);
      doc.text(company.phone, cx, y, { align: "center" });
      y += 3;
    }

    // Dashed separator
    doc.setLineDashPattern([1, 1], 0);
    doc.setLineWidth(0.2);
    y += 1;
    doc.line(mx, y, pageW - mx, y);
    y += 4;

    // Invoice info
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`#${invoiceNumber}`, pageW - mx, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`${dateStr} ${timeStr}`, mx, y);
    y += 4;

    if (customerName) {
      doc.text(`Customer: ${customerName}`, pageW - mx, y, { align: "right" });
      y += 4;
    }

    doc.text(`Payment: ${paymentMethod}`, pageW - mx, y, { align: "right" });
    y += 3;

    if (deliveryDate) {
      doc.text(`Delivery: ${deliveryDate}`, pageW - mx, y, { align: "right" });
      y += 3;
    }

    // Separator
    y += 1;
    doc.line(mx, y, pageW - mx, y);
    y += 3;

    // Items table
    const tableBody = cart.map((item) => [
      (item.price * item.quantity).toFixed(2),
      String(item.quantity),
      item.price.toFixed(2),
      item.name,
    ]);

    doc.autoTable({
      head: [["Total", "Qty", "Price", "Item"]],
      body: tableBody,
      startY: y,
      theme: "plain",
      styles: { fontSize: 7, cellPadding: 1.2, halign: "center", lineWidth: 0 },
      headStyles: { fontStyle: "bold", fontSize: 7, halign: "center" },
      columnStyles: {
        0: { cellWidth: 14, halign: "left" },
        1: { cellWidth: 10 },
        2: { cellWidth: 14 },
        3: { cellWidth: pageW - mx * 2 - 38, halign: "right" },
      },
      margin: { left: mx, right: mx },
    });

    y = doc.lastAutoTable.finalY + 3;

    // Separator
    doc.line(mx, y, pageW - mx, y);
    y += 4;

    // Totals
    doc.setFontSize(8);
    const addRow = (label: string, value: string, bold = false) => {
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(value, mx, y);
      doc.text(label, pageW - mx, y, { align: "right" });
      y += 4;
    };

    addRow(`Items (${itemCount})`, subtotal.toFixed(2));
    if (discount > 0) addRow(`Discount (${discountPercent}%)`, `-${discount.toFixed(2)}`);
    addRow("VAT (15%)", vat.toFixed(2));

    doc.line(mx, y - 1, pageW - mx, y - 1);
    y += 2;

    doc.setFontSize(10);
    addRow("TOTAL", `${total.toFixed(2)} SAR`, true);

    // QR placeholder text
    y += 2;
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("Scan QR on printed receipt for details", cx, y, { align: "center" });
    y += 5;

    // Footer
    doc.setFontSize(7);
    doc.text("Thank you for your business", cx, y, { align: "center" });
    y += 3;
    doc.text("--- End of Invoice ---", cx, y, { align: "center" });

    // Resize page to content
    const finalHeight = y + 6;
    (doc.internal.pageSize as any).height = finalHeight;

    doc.save(`invoice-${invoiceNumber}.pdf`);
  };

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-foreground text-sm">معاينة الفاتورة</h2>
            {onSwitchToA4 && (
              <button onClick={onSwitchToA4} className="text-xs text-primary hover:underline">
                التبديل لـ A4
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 bg-destructive/10 text-destructive px-3 py-1.5 rounded text-xs font-bold hover:bg-destructive/20 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1.5 rounded text-xs font-bold hover:bg-accent/90 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة
            </button>
            <button onClick={onClose} className="h-7 w-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 bg-background">
          <div
            ref={receiptRef}
            className="bg-card mx-auto p-5 shadow-md"
            style={{ width: "300px", fontFamily: "'Cairo', monospace, sans-serif" }}
          >
            {/* Header */}
            <div className="text-center mb-3">
              {logoUrl && (
                <div className="flex justify-center mb-2">
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: "60px", maxWidth: "150px", objectFit: "contain" }} />
                </div>
              )}
              <h2 className="text-lg font-extrabold text-foreground">{company.name}</h2>
              {(company.city || company.country) && (
                <p className="text-[10px] text-muted-foreground">
                  {[company.city, company.country].filter(Boolean).join(" - ")}
                </p>
              )}
              {company.tax_number && (
                <p className="text-[10px] text-muted-foreground">الرقم الضريبي: {company.tax_number}</p>
              )}
              {company.commercial_reg && (
                <p className="text-[10px] text-muted-foreground">السجل التجاري: {company.commercial_reg}</p>
              )}
              {company.phone && (
                <p className="text-[10px] text-muted-foreground">هاتف: {company.phone}</p>
              )}
              {company.address && (
                <p className="text-[10px] text-muted-foreground">{company.address}</p>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-foreground/30 my-2" />

            {/* Invoice info */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dateStr} {timeStr}</span>
                <span className="font-bold text-foreground">فاتورة رقم: {invoiceNumber}</span>
              </div>
              {customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{customerCode ? `كود: ${customerCode}` : ''}</span>
                  <span className="text-foreground">العميل: {customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span />
                <span className="text-muted-foreground">طريقة الدفع: {paymentMethod}</span>
              </div>
              {deliveryDate && (
                <div className="flex justify-between">
                  <span />
                  <span className="text-muted-foreground">تاريخ التسليم: {deliveryDate}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-foreground/30 my-2" />

            {/* Items header */}
            <div className="flex justify-between text-[10px] font-bold text-foreground mb-1 px-0.5">
              <span className="w-16 text-left">المبلغ</span>
              <span className="w-8 text-center">عدد</span>
              <span className="w-14 text-center">السعر</span>
              <span className="flex-1 text-right">الصنف</span>
            </div>

            <div className="border-t border-dotted border-foreground/20 mb-1" />

            {/* Items */}
            {cart.map((item) => (
              <div key={item.id} className="py-0.5 border-b border-dotted border-foreground/10">
                <div className="flex justify-between text-[11px]">
                  <span className="w-16 text-left font-semibold">{(item.price * item.quantity).toFixed(2)}</span>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="w-14 text-center">{item.price.toFixed(2)}</span>
                  <span className="flex-1 text-right text-foreground">{item.name}</span>
                </div>
                {((item.itemLength && item.itemLength > 0) || (item.itemWidth && item.itemWidth > 0) || (item.meters && item.meters > 0)) && (
                  <div className="text-[9px] text-muted-foreground text-right mt-0.5">
                    {item.itemLength && item.itemWidth ? (
                      <span>المقاس: {item.itemLength} × {item.itemWidth} م</span>
                    ) : null}
                    {item.meters && item.meters > 0 ? (
                      <span className="ms-2">الأمتار: {item.meters} م²</span>
                    ) : null}
                  </div>
                )}
                {item.notes && (
                  <div className="text-[9px] text-muted-foreground text-right mt-0.5">
                    📝 {item.notes}
                  </div>
                )}
              </div>
            ))}

            {/* Separator */}
            <div className="border-t border-dashed border-foreground/30 my-2" />

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold">{subtotal.toFixed(2)}</span>
                <span className="text-muted-foreground">إجمالي الأصناف ({itemCount})</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold text-destructive">-{discount.toFixed(2)}</span>
                  <span className="text-muted-foreground">خصم ({discountPercent}%)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold">{vat.toFixed(2)}</span>
                <span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
              </div>

              <div className="border-t border-dashed border-foreground/30 my-1" />

              <div className="flex justify-between text-sm">
                <span className="font-extrabold text-foreground">{total.toFixed(2)} ر.س</span>
                <span className="font-extrabold text-foreground">الإجمالي</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center my-3">
              <QRCodeSVG value={qrData} size={100} level="M" />
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-muted-foreground space-y-0.5">
              <p>شكراً لتعاملكم معنا</p>
              <p>نسعد بخدمتكم دائماً</p>
              <p className="mt-1">--- نهاية الفاتورة ---</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceipt;
