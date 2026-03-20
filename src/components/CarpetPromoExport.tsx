import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const CarpetPromoExport = () => {
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ["نموذج مالي - عرض تنظيف السجاد", ""],
        ["", ""],
        ["المتغيرات الأساسية", ""],
        ["سعر المتر (ريال)", 7],
        ["تكلفة المتر (ريال)", 3],
        ["إجمالي الأمتار المنظفة", 4500],
        ["نوع العرض", "2+1 (اثنان مدفوعة، واحد مجاني)"],
        ["", ""],
        ["المقاييس المحسوبة", ""],
        ["الأمتار المدفوعة", { t: "n", v: 4500 * (2 / 3), f: "B6*(2/3)" }],
        ["الإيرادات (ريال)", { t: "n", v: 4500 * (2 / 3) * 7, f: "B10*B4" }],
        ["إجمالي التكلفة (ريال)", { t: "n", v: 4500 * 3, f: "B6*B5" }],
        ["الربح (ريال)", { t: "n", v: 4500 * (2 / 3) * 7 - 4500 * 3, f: "B11-B12" }],
        ["السعر الفعلي للمتر", { t: "n", v: (4500 * (2 / 3) * 7) / 4500, f: "B11/B6" }],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      ws["!cols"] = [{ wch: 30 }, { wch: 25 }];

      XLSX.utils.book_append_sheet(wb, ws, "النموذج المالي");
      XLSX.writeFile(wb, "carpet_promo_financial_model.xlsx");
      toast.success("تم تصدير النموذج المالي بنجاح 📊");
    } catch {
      toast.error("حدث خطأ أثناء التصدير");
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <FileSpreadsheet className="h-4 w-4" />
      تحميل النموذج المالي للسجاد
    </Button>
  );
};

export default CarpetPromoExport;
