import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InvoiceHeaderProps {
  invoiceNumber?: string;
}

const InvoiceHeader = ({ invoiceNumber }: InvoiceHeaderProps) => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const locale = i18n.language === "ar" ? "ar-SA" : i18n.language === "bn" ? "bn-BD" : i18n.language === "id" ? "id-ID" : i18n.language === "ur" ? "ur-PK" : "en-US";
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "numeric", day: "numeric" });
  const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex items-center justify-between bg-secondary/50 border-b border-border px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("edit_invoice_number")}</span>
        <input className="border border-border rounded px-2 py-0.5 text-sm bg-background w-32 text-center" placeholder="" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>{dateStr} {timeStr}</span>
      </div>
    </div>
  );
};

export default InvoiceHeader;
