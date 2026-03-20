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

interface A4InvoiceProps {
  cart: CartItem[];
  invoiceNumber: string;
  customerName: string;
  customerCode?: number | null;
  customerPhone?: string;
  customerAddress?: string;
  customerRegion?: string;
  customerTaxNumber?: string;
  customerBalance?: number;
  subtotal: number;
  discount: number;
  discountPercent: number;
  vat: number;
  total: number;
  paymentMethod: string;
  deliveryDate?: string;
  invoiceType?: string;
  invoiceStatus?: string;
  onClose: () => void;
  onSwitchToThermal?: () => void;
}

const A4Invoice = ({
  cart,
  invoiceNumber,
  customerName,
  customerCode,
  customerPhone,
  customerAddress,
  customerRegion,
  customerTaxNumber,
  customerBalance = 0,
  subtotal,
  discount,
  discountPercent,
  vat,
  total,
  paymentMethod,
  deliveryDate,
  invoiceType = "عادي",
  invoiceStatus = "مسلمة",
  onClose,
  onSwitchToThermal,
}: A4InvoiceProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const dateTimeStr = `${now.toLocaleDateString("en-CA")} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

  const invoiceStyle = useMemo(() => {
    const defaults = {
      primaryColor: "#1a6b5a",
      showLogo: true,
      logoSize: 70,
      showQR: true,
      slogan: "عناية تفوق التنظيف وثقة تُبنى مع كل خدمة",
      sloganSub: "نعتمد تقنيات تنظيف احترافية ومنتجات آمنة طبيعية مناسبة لكل نوع نسيج لتحقيق أفضل نتيجة ممكنة.",
      terms: [
        "**يتم حفظ المفروشات لمدة شهرين من تاريخ إشعار الجاهزية، وبعدها يُعد الطلب مكتمل الخدمة وتُخلى مسؤولية المنشأة عن التخزين اللاحق.",
        "**قد تبقى بعض الآثار الناتجة عن بقع قديمة أو تلف سابق أو تغيرات لونية بطبيعتها، ويُقيّم كل طلب مهنياً قبل التنفيذ",
        "**الإبلاغ خلال 24 ساعة لأي ملاحظة.",
        "** التوصيل مجاني للطلبات بقيمة 60 ريال فأكثر .",
      ],
    };
    try {
      const saved = localStorage.getItem("invoiceSettings");
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  }, []);

  const company = useMemo(() => {
    const defaults = {
      name_ar: "مغاسل خطوة نظافة",
      name_en: "Clean Step Laundry",
      name_ar_sub: "مغسلة خطوة نظافة لغسيل السجاد",
      phone: "0569010202///0553310077",
      city: "المدينة المنورة",
      country: "Saudia",
      tax_number: "",
      commercial_reg: "",
      branch: "",
    };
    try {
      const saved = localStorage.getItem("companyData");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          name_ar: parsed.name_ar || parsed.name?.split("-")[0]?.trim() || defaults.name_ar,
          name_en: parsed.name_en || parsed.name?.split("-")[1]?.trim() || defaults.name_en,
        };
      }
    } catch {}
    return defaults;
  }, []);

  const logoUrl = useMemo(() => {
    try {
      const saved = localStorage.getItem("companyLogo");
      if (saved) return saved;
    } catch {}
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/company-assets/logo.jpeg`;
  }, []);

  const attachmentUrl = useMemo(() => {
    try {
      const saved = localStorage.getItem("invoiceAttachment");
      if (saved && saved.length > 0) return saved;
    } catch {}
    return null;
  }, []);

  const qrData = JSON.stringify({
    invoice: invoiceNumber,
    total,
    vat,
    date: now.toISOString(),
    seller: company.name_ar,
    taxNumber: company.tax_number,
  });

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const totalMeters = cart.reduce((s, i) => {
    const m = (i.itemLength || 0) * (i.itemWidth || 0);
    return s + (m > 0 ? m * i.quantity : 0);
  }, 0);

  const paymentLabel = (m: string) => {
    switch (m) {
      case "cash": return "Cash";
      case "card": return "Card";
      case "transfer": return "Transfer";
      default: return m;
    }
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة ${invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', sans-serif;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 8mm 12mm;
            font-size: 11px;
            color: #1a1a1a;
            direction: rtl;
            background: #fff;
          }
          @media print {
            @page { size: A4; margin: 8mm; }
            body { width: 100%; padding: 0; }
          }
          table { width: 100%; border-collapse: collapse; }
          .inv-table th { background: #c8d7eb; color: #1a1a1a; font-weight: 700; font-size: 10px; padding: 6px 8px; border: 1px solid #999; }
          .inv-table td { border: 1px solid #ccc; font-size: 10px; padding: 5px 8px; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const mx = 12;
    let y = 12;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Clean Step Laundry", mx, y);
    doc.text(company.name_ar || "", pageW - mx, y, { align: "right" });
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Tel: ${company.phone}`, mx, y);
    doc.text(`${company.phone?.split("///").reverse().join("///") || ""}`, pageW - mx, y, { align: "right" });
    y += 8;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Invoice", mx, y);
    doc.text("فاتورة مبيعات", pageW - mx, y, { align: "right" });
    y += 8;

    // Invoice meta
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const meta = [
      ["Type", invoiceType, "نوع الفاتورة"],
      ["Datetime", dateTimeStr, "التاريخ والوقت"],
      ["Status", invoiceStatus, "حالة الفاتورة"],
      ["Payment", paymentLabel(paymentMethod), "نوع الدفع"],
    ];
    if (deliveryDate) meta.push(["Delivery", deliveryDate, "تاريخ التسليم"]);

    meta.forEach(([en, val, ar]) => {
      doc.text(`${en}: ${val}`, mx, y);
      doc.text(`${ar}`, pageW - mx, y, { align: "right" });
      y += 5;
    });
    y += 2;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Ref: ${invoiceNumber}`, mx, y);
    y += 8;

    // Items table
    const tableBody = cart.map((item, idx) => {
      const m = (item.itemLength || 0) * (item.itemWidth || 0);
      const unitPrice = m > 0 && item.price_per_meter ? item.price_per_meter : item.price;
      const totalPrice = m > 0 ? unitPrice * m * item.quantity : unitPrice * item.quantity;
      const sizeInfo = item.itemLength && item.itemWidth ? `H ${item.itemLength} x W ${item.itemWidth}` : "";
      return [
        totalPrice.toFixed(2),
        unitPrice.toFixed(2),
        String(item.quantity),
        sizeInfo,
        item.name,
        String(idx + 1),
      ];
    });

    doc.autoTable({
      head: [["Total", "Price", "Qnt", "Service", "Item Name", "#"]],
      body: tableBody,
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, halign: "center", lineColor: [150, 150, 150], lineWidth: 0.2 },
      headStyles: { fillColor: [200, 215, 235], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: mx, right: mx },
    });

    y = doc.lastAutoTable.finalY + 4;

    // Summary rows
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const summaryRows = [
      [`Pieces / عدد القطع`, String(itemCount)],
      [`Meters / عدد الامتار`, totalMeters > 0 ? totalMeters.toFixed(2) : "0.00"],
      [`Total Items / إجمالي الأصناف`, subtotal.toFixed(2)],
    ];
    if (discount > 0) summaryRows.push([`${discountPercent}% Disc / الخصم`, discount.toFixed(2)]);
    summaryRows.push([`Total / إجمالي`, `${total.toFixed(2)} ﷼`]);

    summaryRows.forEach(([label, val]) => {
      doc.text(label, pageW - mx - 60, y);
      doc.text(val, pageW - mx, y, { align: "right" });
      y += 5;
    });

    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Clean Step", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceStyle.slogan, pageW / 2, y, { align: "center" });
    y += 5;
    doc.text(invoiceStyle.sloganSub, pageW / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    invoiceStyle.terms.forEach((t: string) => {
      doc.text(t, pageW - mx, y, { align: "right", maxWidth: pageW - mx * 2 });
      y += 4;
    });

    doc.save(`invoice-${invoiceNumber}-A4.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-foreground text-sm">فاتورة A4</h2>
            {onSwitchToThermal && (
              <button onClick={onSwitchToThermal} className="text-xs text-primary hover:underline">
                التبديل للحراري
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 bg-destructive/10 text-destructive px-3 py-1.5 rounded text-xs font-bold hover:bg-destructive/20 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF A4
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

        {/* A4 Preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 bg-muted/30">
          <div
            ref={receiptRef}
            className="bg-white mx-auto shadow-lg border border-border"
            style={{ width: "210mm", minHeight: "297mm", fontFamily: "'Cairo', sans-serif", color: "#1a1a1a", padding: "8mm 12mm" }}
          >
            {/* ===== HEADER ===== */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              {/* Left - English */}
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>Clean Step Laundry</div>
                <div style={{ fontSize: "11px", color: "#555" }}>Clean Step Laundry</div>
                <div style={{ fontSize: "11px", color: "#555" }}>{company.country || "Saudia"}</div>
                <div style={{ fontSize: "11px", color: "#555" }}>Tel: {company.phone}</div>
              </div>

              {/* Center - Logo */}
              <div style={{ textAlign: "center", flex: "0 0 auto", padding: "0 16px" }}>
                {invoiceStyle.showLogo && logoUrl && (
                  <img src={logoUrl} alt="Logo" style={{ height: "70px", width: "70px", objectFit: "contain" }} />
                )}
              </div>

              {/* Right - Arabic */}
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>{company.name_ar}</div>
                <div style={{ fontSize: "11px", color: "#555" }}>{company.name_ar_sub || "مغسلة خطوة نظافة لغسيل السجاد"}</div>
                <div style={{ fontSize: "11px", color: "#555" }}>{company.city}</div>
                <div style={{ fontSize: "11px", color: "#555" }}>ت: {company.phone?.split("///").reverse().join("///")}</div>
              </div>
            </div>

            {/* ===== TITLE BAR ===== */}
            <div style={{
              background: "#c8d7eb",
              padding: "6px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              borderRadius: "2px",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 800 }}>Sales Invoice / فاتورة مبيعات</div>
            </div>

            {/* ===== INVOICE META + BARCODE ===== */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              {/* Meta info */}
              <div style={{ flex: 1 }}>
                <table style={{ borderCollapse: "collapse", fontSize: "11px", width: "auto" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 8px", fontWeight: 600, color: "#555" }}>Type / نوع الفاتورة</td>
                      <td style={{ padding: "3px 8px", fontWeight: 700 }}>{invoiceType}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px", fontWeight: 600, color: "#555" }}>Datetime / التاريخ والوقت</td>
                      <td style={{ padding: "3px 8px", fontWeight: 700 }}>{dateTimeStr}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px", fontWeight: 600, color: "#555" }}>Status / حالة الفاتورة</td>
                      <td style={{ padding: "3px 8px", fontWeight: 700 }}>{invoiceStatus}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px", fontWeight: 600, color: "#555" }}>Payment / نوع الدفع</td>
                      <td style={{ padding: "3px 8px", fontWeight: 700 }}>{paymentLabel(paymentMethod)}</td>
                    </tr>
                    {deliveryDate && (
                      <tr>
                        <td style={{ padding: "3px 8px", fontWeight: 600, color: "#555" }}>Delivery / تاريخ التسليم</td>
                        <td style={{ padding: "3px 8px", fontWeight: 700 }}>{deliveryDate}</td>
                      </tr>
                    )}
                    {company.branch && (
                      <tr>
                        <td style={{ padding: "3px 8px", fontWeight: 600, color: "#555" }}>U/م:</td>
                        <td style={{ padding: "3px 8px", fontWeight: 700 }}>{company.branch}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Barcode / QR */}
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {invoiceStyle.showQR && <QRCodeSVG value={qrData} size={90} level="M" />}
                <div style={{ fontSize: "13px", fontWeight: 800, marginTop: "4px", letterSpacing: "1px" }}>{invoiceNumber}</div>
              </div>
            </div>

            {/* ===== REF ===== */}
            <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "10px" }}>
              Ref: {invoiceNumber}
            </div>

            {/* ===== CUSTOMER INFO ===== */}
            <div style={{ display: "flex", gap: "0", marginBottom: "10px", border: "1px solid #ccc", borderRadius: "2px", fontSize: "11px" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555", width: "25%" }}>رقم العميل:</td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 700, width: "25%" }}>{customerCode || "-"}</td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555", width: "25%" }}>إسم العميل:</td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", fontWeight: 700, width: "25%" }}>{customerName || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555" }}>رقم الجوال:</td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 700 }}>{customerPhone || "-"}</td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555" }}>الرقم الضريبي:</td>
                    <td style={{ padding: "4px 10px", borderBottom: "1px solid #eee", fontWeight: 700 }}>{customerTaxNumber || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 10px", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555" }}>العنوان:</td>
                    <td style={{ padding: "4px 10px", borderLeft: "1px solid #eee", fontWeight: 700 }}>{customerAddress || "-"}</td>
                    <td style={{ padding: "4px 10px", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555" }}>منطقة:</td>
                    <td style={{ padding: "4px 10px", fontWeight: 700 }}>{customerRegion || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 10px", borderTop: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555" }}>معلومات اخرى:</td>
                    <td style={{ padding: "4px 10px", borderTop: "1px solid #eee", borderLeft: "1px solid #eee" }}></td>
                    <td style={{ padding: "4px 10px", borderTop: "1px solid #eee", borderLeft: "1px solid #eee", fontWeight: 600, color: "#555" }}>رصيد العميل:</td>
                    <td style={{ padding: "4px 10px", borderTop: "1px solid #eee", fontWeight: 700 }}>{customerBalance} ﷼</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ===== ITEMS TABLE ===== */}
            <table className="inv-table" style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px", marginBottom: "4px" }}>
              <thead>
                <tr style={{ background: "#c8d7eb" }}>
                  <th style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, textAlign: "center", width: "30px" }}>#</th>
                  <th style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, textAlign: "right" }}>اسم الصنف/Item Name</th>
                  <th style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, textAlign: "center" }}>اسم الخدمة/Service</th>
                  <th style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, textAlign: "center" }}>كمية/Qnt</th>
                  <th style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, textAlign: "center" }}>سعر/Price</th>
                  <th style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, textAlign: "center" }}>إجمالي الأصناف/Total Items</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => {
                  const m = (item.itemLength || 0) * (item.itemWidth || 0);
                  const unitPrice = m > 0 && item.price_per_meter ? item.price_per_meter : item.price;
                  const totalPrice = m > 0 ? unitPrice * m * item.quantity : unitPrice * item.quantity;
                  const sizeInfo = item.itemLength && item.itemWidth
                    ? `H ${item.itemLength.toFixed(2)} x W ${item.itemWidth.toFixed(2)}`
                    : "";
                  const serviceName = item.name ? `غسيل (WA)` : "";

                  return (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>
                        {item.name} / Carpets
                        {item.notes && <div style={{ fontSize: "9px", color: "#888" }}>📝 {item.notes}</div>}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center", fontSize: "10px" }}>
                        {serviceName}
                        {sizeInfo && <div style={{ fontSize: "10px" }}>{sizeInfo}</div>}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{unitPrice.toFixed(2)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center", fontWeight: 700 }}>{totalPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ===== SUMMARY ROWS ===== */}
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px", marginBottom: "16px" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700, width: "75%" }}>عدد القطع/Pieces</td>
                  <td style={{ padding: "3px 8px", fontWeight: 700 }}>{itemCount}</td>
                  <td style={{ padding: "3px 8px", textAlign: "left", fontWeight: 700 }}></td>
                </tr>
                {totalMeters > 0 && (
                  <tr>
                    <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700 }}>عدد الامتار/Meters</td>
                    <td style={{ padding: "3px 8px", fontWeight: 700 }}>{totalMeters.toFixed(2)}</td>
                    <td />
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700 }}>إجمالي الأصناف/Total Items</td>
                  <td />
                  <td style={{ padding: "3px 8px", fontWeight: 700, textAlign: "left" }}>{subtotal.toFixed(2)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700 }}>{discountPercent}% Disc/الخصم</td>
                    <td />
                    <td style={{ padding: "3px 8px", fontWeight: 700, textAlign: "left", color: "#dc2626" }}>{discount.toFixed(2)}</td>
                  </tr>
                )}
                <tr style={{ borderTop: "2px solid #333" }}>
                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 800, fontSize: "13px" }}>إجمالي/Total</td>
                  <td />
                  <td style={{ padding: "5px 8px", fontWeight: 800, fontSize: "13px", textAlign: "left" }}>{total.toFixed(2)} ﷼</td>
                </tr>
              </tbody>
            </table>

            {/* ===== CLEAN STEP BRANDING ===== */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a6b5a", marginBottom: "6px" }}>Clean Step</div>
              <p style={{ fontSize: "11px", color: "#333", lineHeight: 1.8 }}>
                {invoiceStyle.slogan}
              </p>
              <p style={{ fontSize: "10px", color: "#555", lineHeight: 1.8, maxWidth: "500px", margin: "0 auto" }}>
                {invoiceStyle.sloganSub}
              </p>
            </div>

            {/* ===== TERMS ===== */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>الشروط والاحكام</div>
              <div style={{ fontSize: "10px", color: "#444", lineHeight: 2 }}>
                {invoiceStyle.terms.map((term: string, idx: number) => (
                  <div key={idx}>{term}</div>
                ))}
              </div>
            </div>

            {/* ===== ATTACHMENT ===== */}
            {attachmentUrl && attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) && (
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <img
                  src={attachmentUrl}
                  alt="مرفق الفاتورة"
                  style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", margin: "0 auto", borderRadius: "4px" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default A4Invoice;
