import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ArabicReshaper from "arabic-reshaper";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  fileName: string;
  companyName?: string;
  summaryRows?: { label: string; value: string }[];
}

const getCompanyInfo = () => {
  try {
    const saved = localStorage.getItem("companyData");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: parsed.name || "مغاسل خطوة نظافة",
        phone: parsed.phone || "",
        city: parsed.city || "",
        tax_number: parsed.tax_number || "",
      };
    }
  } catch {}
  return { name: "مغاسل خطوة نظافة", phone: "", city: "", tax_number: "" };
};

// ==================== Arabic Text Reshaping ====================
const reshapeArabic = (text: string): string => {
  if (!text) return text;
  try {
    const reshaped = ArabicReshaper.convertArabic(text);
    return reshaped.split("").reverse().join("");
  } catch {
    return text;
  }
};

const hasArabic = (text: string): boolean => {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

const processText = (text: string): string => {
  if (!text || typeof text !== "string") return text;
  if (!hasArabic(text)) return text;
  
  // Split into segments: Arabic words and non-Arabic tokens
  const tokens = text.split(/(\s+)/);
  const processed = tokens.map((token) => {
    if (token.trim() === "") return token;
    if (hasArabic(token)) {
      // Reshape and reverse each Arabic word individually
      return reshapeArabic(token);
    }
    return token;
  });
  
  // Reverse the order of all tokens for RTL layout
  return processed.reverse().join("");
};

// ==================== Font Loading ====================
let arabicFontBase64: string | null = null;
let fontLoadPromise: Promise<string> | null = null;

const loadArabicFont = (): Promise<string> => {
  if (arabicFontBase64) return Promise.resolve(arabicFontBase64);
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = fetch("/fonts/Amiri-Regular.ttf")
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const binary = Array.from(new Uint8Array(buffer))
        .map((b) => String.fromCharCode(b))
        .join("");
      arabicFontBase64 = btoa(binary);
      return arabicFontBase64;
    });

  return fontLoadPromise;
};

const registerArabicFont = (doc: jsPDF, fontBase64: string) => {
  doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  // Register same font as bold to prevent fallback to default font
  doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
  doc.setFont("Amiri");
};

// ==================== PDF Export ====================
export const exportToPDF = async (options: ExportOptions) => {
  const { title, subtitle, columns, data, fileName, summaryRows } = options;
  const company = getCompanyInfo();

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Load and register Arabic font
  let fontLoaded = false;
  try {
    const fontBase64 = await loadArabicFont();
    registerArabicFont(doc, fontBase64);
    fontLoaded = true;
  } catch (e) {
    console.warn("Could not load Arabic font, falling back to default", e);
  }

  const pText = fontLoaded ? processText : (t: string) => t;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header background
  doc.setFillColor(23, 63, 95);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Company name & title (right-aligned for RTL)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(pText(company.name), pageWidth - 10, 12, { align: "right" });
  doc.setFontSize(11);
  doc.text(pText(title), pageWidth - 10, 20, { align: "right" });

  // Date on the left
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(pText(dateStr), 10, 12);
  if (subtitle) {
    doc.text(pText(subtitle), 10, 18);
  }
  if (company.tax_number) {
    doc.text(`Tax: ${company.tax_number}`, 10, 24);
  }

  // Table headers and body - reshape Arabic text
  const headers = columns.map((c) => pText(c.header));
  const body = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val === null || val === undefined) return "";
      if (typeof val === "number")
        return val.toLocaleString("ar-SA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      return pText(String(val));
    })
  );

  // Add summary rows if provided
  if (summaryRows && summaryRows.length > 0) {
    body.push([]); // empty separator
    summaryRows.forEach((sr) => {
      const row = new Array(columns.length).fill("");
      row[0] = pText(sr.label);
      row[columns.length - 1] = sr.value;
      body.push(row);
    });
  }

  autoTable(doc, {
    head: [headers],
    body,
    startY: 32,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: "center",
      valign: "middle",
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      font: fontLoaded ? "Amiri" : "helvetica",
    },
    headStyles: {
      fillColor: [23, 63, 95],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      font: fontLoaded ? "Amiri" : "helvetica",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: columns.reduce(
      (acc, col, i) => {
        if (col.width) acc[i] = { cellWidth: col.width };
        return acc;
      },
      {} as Record<number, any>
    ),
    didDrawPage: (pageData: any) => {
      if (fontLoaded) doc.setFont("Amiri");
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `${pageData.pageNumber} / ${pageNum}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      doc.text(pText(company.name), pageWidth - 10, pageHeight - 8, {
        align: "right",
      });
    },
  });

  try {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${fileName}.pdf`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  } catch {
    doc.save(`${fileName}.pdf`);
  }
};

// ==================== Excel Export ====================
export const exportToExcel = (options: ExportOptions) => {
  const { title, columns, data, fileName, summaryRows } = options;
  const company = getCompanyInfo();

  const wsData: any[][] = [
    [company.name],
    [title],
    [
      new Date().toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
    [],
    columns.map((c) => c.header),
  ];

  data.forEach((row) => {
    wsData.push(
      columns.map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return "";
        return val;
      })
    );
  });

  if (summaryRows && summaryRows.length > 0) {
    wsData.push([]);
    summaryRows.forEach((sr) => {
      const row = new Array(columns.length).fill("");
      row[0] = sr.label;
      row[columns.length - 1] = sr.value;
      wsData.push(row);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = columns.map((c) => ({ wch: c.width ? c.width / 3 : 18 }));
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ==================== Quick Export Helpers (all async for PDF) ====================

export const exportInvoices = async (invoices: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "رقم الفاتورة", key: "invoice_number", width: 40 },
    { header: "التاريخ", key: "date", width: 35 },
    { header: "المبلغ الفرعي", key: "subtotal", width: 30 },
    { header: "الضريبة", key: "tax", width: 25 },
    { header: "الإجمالي", key: "total", width: 30 },
    { header: "طريقة الدفع", key: "payment_method", width: 30 },
    { header: "الحالة", key: "status", width: 25 },
  ];

  const statusLabels: Record<string, string> = {
    new: "جديد",
    cleaning: "قيد التنظيف",
    ready: "جاهز",
    delivered: "مُسلَّم",
    completed: "مكتمل",
    pending: "معلّق",
  };

  const data = invoices.map((inv) => ({
    invoice_number: inv.invoice_number,
    date: new Date(inv.created_at).toLocaleDateString("ar-SA"),
    subtotal: Number(inv.subtotal),
    tax: Number(inv.tax),
    total: Number(inv.total),
    payment_method: inv.payment_method,
    status: statusLabels[inv.status] || inv.status,
  }));

  const totalRevenue = data.reduce((s, d) => s + d.total, 0);
  const totalTax = data.reduce((s, d) => s + d.tax, 0);

  const options: ExportOptions = {
    title: "تقرير الفواتير",
    subtitle: `عدد الفواتير: ${data.length}`,
    columns,
    data,
    fileName: `invoices-${new Date().toISOString().slice(0, 10)}`,
    summaryRows: [
      { label: "إجمالي الإيرادات", value: totalRevenue.toFixed(2) },
      { label: "إجمالي الضريبة", value: totalTax.toFixed(2) },
    ],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportExpenses = async (expenses: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "رقم السند", key: "voucher_number", width: 35 },
    { header: "التاريخ", key: "date", width: 30 },
    { header: "الوصف", key: "description", width: 50 },
    { header: "المبلغ", key: "amount", width: 30 },
    { header: "طريقة الدفع", key: "payment_method", width: 30 },
  ];

  const data = expenses.map((exp) => ({
    voucher_number: exp.voucher_number,
    date: new Date(exp.expense_date || exp.created_at).toLocaleDateString("ar-SA"),
    description: exp.description,
    amount: Number(exp.amount),
    payment_method: exp.payment_method,
  }));

  const totalAmount = data.reduce((s, d) => s + d.amount, 0);

  const options: ExportOptions = {
    title: "تقرير المصروفات",
    subtitle: `عدد السندات: ${data.length}`,
    columns,
    data,
    fileName: `expenses-${new Date().toISOString().slice(0, 10)}`,
    summaryRows: [{ label: "إجمالي المصروفات", value: totalAmount.toFixed(2) }],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportCustomers = async (customers: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "كود العميل", key: "code", width: 25 },
    { header: "الاسم", key: "name", width: 45 },
    { header: "الجوال", key: "phone", width: 35 },
    { header: "المدينة", key: "city", width: 30 },
    { header: "عدد الطلبات", key: "total_orders", width: 25 },
    { header: "إجمالي الإنفاق", key: "total_spent", width: 30 },
    { header: "نقاط الولاء", key: "loyalty_points", width: 25 },
  ];

  const data = customers.map((c) => ({
    code: c.code,
    name: c.name,
    phone: c.phone,
    city: (c.address || "").split(" - ")[0],
    total_orders: c.total_orders,
    total_spent: Number(c.total_spent),
    loyalty_points: c.loyalty_points || 0,
  }));

  const options: ExportOptions = {
    title: "تقرير العملاء",
    subtitle: `عدد العملاء: ${data.length}`,
    columns,
    data,
    fileName: `customers-${new Date().toISOString().slice(0, 10)}`,
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportSalaryReport = async (
  employees: any[],
  getDeductions: (id: string) => number,
  getAdditions: (id: string) => number,
  month: string,
  format: "pdf" | "excel"
) => {
  const columns: ExportColumn[] = [
    { header: "الموظف", key: "name", width: 40 },
    { header: "الراتب الأساسي", key: "salary", width: 30 },
    { header: "الخصومات", key: "deductions", width: 30 },
    { header: "الإضافات", key: "additions", width: 30 },
    { header: "صافي الراتب", key: "net", width: 30 },
  ];

  const data = employees.map((e) => {
    const ded = getDeductions(e.id);
    const add = getAdditions(e.id);
    return {
      name: e.name,
      salary: Number(e.salary),
      deductions: ded,
      additions: add,
      net: Number(e.salary) - ded + add,
    };
  });

  const totalSalaries = data.reduce((s, d) => s + d.salary, 0);
  const totalDed = data.reduce((s, d) => s + d.deductions, 0);
  const totalAdd = data.reduce((s, d) => s + d.additions, 0);
  const totalNet = data.reduce((s, d) => s + d.net, 0);

  const options: ExportOptions = {
    title: `تقرير الرواتب - ${month}`,
    subtitle: `عدد الموظفين: ${data.length}`,
    columns,
    data,
    fileName: `salary-report-${month}`,
    summaryRows: [
      { label: "إجمالي الرواتب", value: totalSalaries.toFixed(2) },
      { label: "إجمالي الخصومات", value: totalDed.toFixed(2) },
      { label: "إجمالي الإضافات", value: totalAdd.toFixed(2) },
      { label: "صافي المستحق", value: totalNet.toFixed(2) },
    ],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportEmployees = async (employees: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "الاسم", key: "name", width: 40 },
    { header: "الجوال", key: "phone", width: 35 },
    { header: "القسم", key: "department", width: 30 },
    { header: "الراتب", key: "salary", width: 30 },
    { header: "تاريخ التعيين", key: "hire_date", width: 30 },
    { header: "الحالة", key: "status", width: 20 },
  ];

  const data = employees.map((e) => ({
    name: e.name,
    phone: e.phone,
    department: e.department_name || "—",
    salary: Number(e.salary),
    hire_date: new Date(e.hire_date).toLocaleDateString("ar-SA"),
    status: e.is_active ? "نشط" : "غير نشط",
  }));

  const options: ExportOptions = {
    title: "تقرير الموظفين",
    subtitle: `عدد الموظفين: ${data.length}`,
    columns,
    data,
    fileName: `employees-${new Date().toISOString().slice(0, 10)}`,
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportCustomerBalances = async (customers: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "العميل", key: "name", width: 45 },
    { header: "الجوال", key: "phone", width: 35 },
    { header: "عدد الطلبات", key: "total_orders", width: 25 },
    { header: "إجمالي الإنفاق", key: "total_spent", width: 30 },
  ];

  const data = customers.map((c) => ({
    name: c.name,
    phone: c.phone || "—",
    total_orders: c.total_orders,
    total_spent: Number(c.total_spent),
  }));

  const totalSpent = data.reduce((s, d) => s + d.total_spent, 0);

  const options: ExportOptions = {
    title: "تقرير أرصدة العملاء",
    subtitle: `عدد العملاء: ${data.length}`,
    columns,
    data,
    fileName: `customer-balances-${new Date().toISOString().slice(0, 10)}`,
    summaryRows: [{ label: "إجمالي الإنفاق", value: totalSpent.toFixed(2) }],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportCashboxReport = async (dailyData: any[], month: string, format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "التاريخ", key: "date", width: 35 },
    { header: "المبيعات", key: "sales", width: 30 },
    { header: "المصروفات", key: "expenses", width: 30 },
    { header: "الصافي", key: "net", width: 30 },
  ];

  const data = dailyData.map((d) => ({
    date: d.dateStr,
    sales: Number(d.sales),
    expenses: Number(d.expenses),
    net: Number(d.net),
  }));

  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const totalExp = data.reduce((s, d) => s + d.expenses, 0);

  const options: ExportOptions = {
    title: `تقرير حسابات الصندوق - ${month}`,
    subtitle: `عدد الأيام: ${data.length}`,
    columns,
    data,
    fileName: `cashbox-report-${month}`,
    summaryRows: [
      { label: "إجمالي المبيعات", value: totalSales.toFixed(2) },
      { label: "إجمالي المصروفات", value: totalExp.toFixed(2) },
      { label: "الصافي", value: (totalSales - totalExp).toFixed(2) },
    ],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportPaidOrders = async (invoices: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "رقم الفاتورة", key: "invoice_number", width: 40 },
    { header: "التاريخ", key: "date", width: 35 },
    { header: "المبلغ", key: "total", width: 30 },
    { header: "طريقة الدفع", key: "payment_method", width: 30 },
  ];

  const data = invoices.map((inv) => ({
    invoice_number: inv.invoice_number,
    date: new Date(inv.created_at).toLocaleDateString("ar-SA"),
    total: Number(inv.total),
    payment_method:
      inv.payment_method === "cash"
        ? "نقدي"
        : inv.payment_method === "card"
          ? "شبكة"
          : inv.payment_method,
  }));

  const total = data.reduce((s, d) => s + d.total, 0);

  const options: ExportOptions = {
    title: "تقرير الطلبات المدفوعة",
    subtitle: `عدد الطلبات: ${data.length}`,
    columns,
    data,
    fileName: `paid-orders-${new Date().toISOString().slice(0, 10)}`,
    summaryRows: [{ label: "الإجمالي", value: total.toFixed(2) }],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportUserSales = async (invoices: any[], month: string, format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "طريقة الدفع", key: "method", width: 40 },
    { header: "عدد الفواتير", key: "count", width: 30 },
    { header: "الإجمالي", key: "total", width: 30 },
  ];

  const byMethod: Record<string, { count: number; total: number }> = {};
  invoices.forEach((inv) => {
    const method =
      inv.payment_method === "cash"
        ? "نقدي"
        : inv.payment_method === "card"
          ? "شبكة"
          : inv.payment_method;
    if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
    byMethod[method].count++;
    byMethod[method].total += Number(inv.total);
  });

  const data = Object.entries(byMethod).map(([method, v]) => ({
    method,
    count: v.count,
    total: v.total,
  }));
  const totalSales = data.reduce((s, d) => s + d.total, 0);

  const options: ExportOptions = {
    title: `تقرير مبيعات المستخدم - ${month}`,
    subtitle: `عدد الفواتير: ${invoices.length}`,
    columns,
    data,
    fileName: `user-sales-${month}`,
    summaryRows: [{ label: "إجمالي المبيعات", value: totalSales.toFixed(2) }],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportBankStatement = async (bank: any, transactions: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "التاريخ", key: "date", width: 35 },
    { header: "الوصف", key: "description", width: 50 },
    { header: "إيداع", key: "deposit", width: 25 },
    { header: "سحب", key: "withdrawal", width: 25 },
    { header: "الرصيد", key: "balance", width: 30 },
  ];

  let runningBalance = 0;
  const data = transactions.map((t) => {
    if (t.transaction_type === "deposit") runningBalance += Number(t.amount);
    else runningBalance -= Number(t.amount);
    return {
      date: new Date(t.transaction_date).toLocaleDateString("ar-SA"),
      description: t.description || "—",
      deposit: t.transaction_type === "deposit" ? Number(t.amount) : "",
      withdrawal: t.transaction_type === "withdrawal" ? Number(t.amount) : "",
      balance: runningBalance,
    };
  });

  const options: ExportOptions = {
    title: `كشف حساب بنك - ${bank?.name || ""}`,
    subtitle: `الرصيد الحالي: ${Number(bank?.balance || 0).toLocaleString()} ر.س`,
    columns,
    data,
    fileName: `bank-statement-${bank?.name || "bank"}-${new Date().toISOString().slice(0, 10)}`,
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportBankTransactions = async (transactions: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "البنك", key: "bank_name", width: 35 },
    { header: "النوع", key: "type", width: 25 },
    { header: "المبلغ", key: "amount", width: 30 },
    { header: "الوصف", key: "description", width: 45 },
    { header: "التاريخ", key: "date", width: 30 },
  ];

  const data = transactions.map((t) => ({
    bank_name: (t.banks as any)?.name || "—",
    type: t.transaction_type === "deposit" ? "إيداع" : "سحب",
    amount: Number(t.amount),
    description: t.description || "—",
    date: new Date(t.transaction_date).toLocaleDateString("ar-SA"),
  }));

  const totalDeposits = transactions
    .filter((t) => t.transaction_type === "deposit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawals = transactions
    .filter((t) => t.transaction_type === "withdrawal")
    .reduce((s, t) => s + Number(t.amount), 0);

  const options: ExportOptions = {
    title: "تقرير حركات البنوك",
    subtitle: `عدد الحركات: ${data.length}`,
    columns,
    data,
    fileName: `bank-transactions-${new Date().toISOString().slice(0, 10)}`,
    summaryRows: [
      { label: "إجمالي الإيداعات", value: totalDeposits.toFixed(2) },
      { label: "إجمالي السحوبات", value: totalWithdrawals.toFixed(2) },
    ],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};

export const exportSearchInvoices = async (invoices: any[], format: "pdf" | "excel") => {
  const columns: ExportColumn[] = [
    { header: "رقم الفاتورة", key: "invoice_number", width: 35 },
    { header: "العميل", key: "customer", width: 40 },
    { header: "التاريخ", key: "date", width: 35 },
    { header: "المبلغ", key: "total", width: 30 },
    { header: "الحالة", key: "status", width: 25 },
    { header: "طريقة الدفع", key: "payment_method", width: 30 },
  ];

  const statusLabels: Record<string, string> = {
    completed: "مكتمل",
    pending: "قيد الانتظار",
    cancelled: "ملغي",
    processing: "قيد المعالجة",
  };

  const data = invoices.map((inv) => ({
    invoice_number: inv.invoice_number,
    customer: (inv.customers as any)?.name || "—",
    date: new Date(inv.created_at).toLocaleDateString("ar-SA"),
    total: Number(inv.total),
    status: statusLabels[inv.status] || inv.status,
    payment_method:
      inv.payment_method === "cash"
        ? "نقدي"
        : inv.payment_method === "card"
          ? "شبكة"
          : inv.payment_method,
  }));

  const total = data.reduce((s, d) => s + d.total, 0);

  const options: ExportOptions = {
    title: "تقرير بحث الفواتير",
    subtitle: `عدد النتائج: ${data.length}`,
    columns,
    data,
    fileName: `invoices-search-${new Date().toISOString().slice(0, 10)}`,
    summaryRows: [{ label: "الإجمالي", value: total.toFixed(2) }],
  };

  if (format === "pdf") await exportToPDF(options);
  else exportToExcel(options);
};
