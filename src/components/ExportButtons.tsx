import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonsProps {
  onExportPDF: () => void | Promise<void>;
  onExportExcel: () => void;
  disabled?: boolean;
}

const ExportButtons = ({ onExportPDF, onExportExcel, disabled }: ExportButtonsProps) => {
  const handlePDF = async () => {
    try {
      await onExportPDF();
      toast.success("تم تصدير PDF بنجاح 📄");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ في تصدير PDF");
    }
  };

  const handleExcel = () => {
    try {
      onExportExcel();
      toast.success("تم تصدير Excel بنجاح 📊");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ في تصدير Excel");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handlePDF}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
        title="تصدير PDF"
      >
        <FileDown className="h-3.5 w-3.5" />
        PDF
      </button>
      <button
        onClick={handleExcel}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        title="تصدير Excel"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </button>
    </div>
  );
};

export default ExportButtons;
