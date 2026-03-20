import { useState } from "react";
import { FileSpreadsheet, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PromoModelConfig {
  key: string;
  name: string;
  fileName: string;
  icon: string;
  sheetTitle: string;
  fields: { label: string; key: string; default: number }[];
  promoType: string;
  buildSheet: (vals: Record<string, number>, promoType: string) => (string | number | { t: string; v: number; f: string })[][];
}

const models: PromoModelConfig[] = [
  {
    key: "carpet",
    name: "عرض تنظيف السجاد",
    fileName: "carpet_promo_model.xlsx",
    icon: "🧹",
    sheetTitle: "السجاد",
    promoType: "2+1 (اثنان مدفوعة، واحد مجاني)",
    fields: [
      { label: "سعر المتر (ريال)", key: "price", default: 7 },
      { label: "تكلفة المتر (ريال)", key: "cost", default: 3 },
      { label: "إجمالي الأمتار", key: "total", default: 4500 },
    ],
    buildSheet: (v, pt) => [
      ["نموذج مالي - عرض تنظيف السجاد", ""],
      ["", ""],
      ["المتغيرات الأساسية", ""],
      ["سعر المتر (ريال)", v.price],
      ["تكلفة المتر (ريال)", v.cost],
      ["إجمالي الأمتار المنظفة", v.total],
      ["نوع العرض", pt],
      ["", ""],
      ["المقاييس المحسوبة", ""],
      ["الأمتار المدفوعة", { t: "n", v: Math.round(v.total * (2 / 3)), f: "B6*(2/3)" }],
      ["الإيرادات (ريال)", { t: "n", v: Math.round(v.total * (2 / 3)) * v.price, f: "B10*B4" }],
      ["إجمالي التكلفة (ريال)", { t: "n", v: v.total * v.cost, f: "B6*B5" }],
      ["الربح (ريال)", { t: "n", v: Math.round(v.total * (2 / 3)) * v.price - v.total * v.cost, f: "B11-B12" }],
      ["السعر الفعلي للمتر", { t: "n", v: +(Math.round(v.total * (2 / 3)) * v.price / v.total).toFixed(2), f: "B11/B6" }],
    ],
  },
  {
    key: "blanket",
    name: "عرض غسيل البطانيات",
    fileName: "blanket_promo_model.xlsx",
    icon: "🛏️",
    sheetTitle: "البطانيات",
    promoType: "خصم 30% على القطعة الثانية",
    fields: [
      { label: "سعر القطعة (ريال)", key: "price", default: 25 },
      { label: "تكلفة القطعة (ريال)", key: "cost", default: 10 },
      { label: "إجمالي القطع", key: "total", default: 600 },
    ],
    buildSheet: (v, pt) => {
      const half = v.total / 2;
      const fullRev = half * v.price;
      const discRev = half * (v.price * 0.7);
      const totalRev = fullRev + discRev;
      const totalCost = v.total * v.cost;
      return [
        ["نموذج مالي - عرض غسيل البطانيات", ""],
        ["", ""],
        ["المتغيرات الأساسية", ""],
        ["سعر القطعة (ريال)", v.price],
        ["تكلفة القطعة (ريال)", v.cost],
        ["إجمالي القطع", v.total],
        ["نوع العرض", pt],
        ["", ""],
        ["المقاييس المحسوبة", ""],
        ["قطع بسعر كامل", { t: "n", v: half, f: "B6/2" }],
        ["قطع بخصم 30%", { t: "n", v: half, f: "B6/2" }],
        ["إيرادات السعر الكامل", { t: "n", v: fullRev, f: "B10*B4" }],
        ["إيرادات المخفضة", { t: "n", v: discRev, f: "B11*(B4*0.7)" }],
        ["إجمالي الإيرادات", { t: "n", v: totalRev, f: "B12+B13" }],
        ["إجمالي التكلفة", { t: "n", v: totalCost, f: "B6*B5" }],
        ["الربح (ريال)", { t: "n", v: totalRev - totalCost, f: "B14-B15" }],
        ["هامش الربح %", { t: "n", v: +((totalRev - totalCost) / totalRev * 100).toFixed(2), f: "B16/B14*100" }],
      ];
    },
  },
  {
    key: "curtains",
    name: "عرض غسيل الستائر",
    fileName: "curtains_promo_model.xlsx",
    icon: "🪟",
    sheetTitle: "الستائر",
    promoType: "خصم 25% على أكثر من 10 أمتار",
    fields: [
      { label: "سعر المتر (ريال)", key: "price", default: 12 },
      { label: "تكلفة المتر (ريال)", key: "cost", default: 5 },
      { label: "إجمالي الأمتار", key: "total", default: 3000 },
      { label: "نسبة العملاء فوق 10 أمتار %", key: "pct", default: 60 },
    ],
    buildSheet: (v, pt) => {
      const full = v.total * (1 - v.pct / 100);
      const disc = v.total * (v.pct / 100);
      const fullRev = full * v.price;
      const discRev = disc * (v.price * 0.75);
      const totalRev = fullRev + discRev;
      const totalCost = v.total * v.cost;
      return [
        ["نموذج مالي - عرض غسيل الستائر", ""],
        ["", ""],
        ["المتغيرات الأساسية", ""],
        ["سعر المتر (ريال)", v.price],
        ["تكلفة المتر (ريال)", v.cost],
        ["إجمالي الأمتار", v.total],
        ["نوع العرض", pt],
        ["نسبة العملاء فوق 10 أمتار %", v.pct],
        ["", ""],
        ["المقاييس المحسوبة", ""],
        ["أمتار بسعر كامل", { t: "n", v: full, f: "B6*(1-B8/100)" }],
        ["أمتار بخصم", { t: "n", v: disc, f: "B6*(B8/100)" }],
        ["إيرادات السعر الكامل", { t: "n", v: fullRev, f: "B11*B4" }],
        ["إيرادات المخفضة", { t: "n", v: discRev, f: "B12*(B4*0.75)" }],
        ["إجمالي الإيرادات", { t: "n", v: totalRev, f: "B13+B14" }],
        ["إجمالي التكلفة", { t: "n", v: totalCost, f: "B6*B5" }],
        ["الربح (ريال)", { t: "n", v: totalRev - totalCost, f: "B15-B16" }],
        ["هامش الربح %", { t: "n", v: +((totalRev - totalCost) / totalRev * 100).toFixed(2), f: "B17/B15*100" }],
      ];
    },
  },
  {
    key: "sofa",
    name: "عرض غسيل الكنب",
    fileName: "sofa_promo_model.xlsx",
    icon: "🛋️",
    sheetTitle: "الكنب",
    promoType: "طقم 7 مقاعد بسعر 5",
    fields: [
      { label: "سعر المقعد (ريال)", key: "price", default: 35 },
      { label: "تكلفة المقعد (ريال)", key: "cost", default: 15 },
      { label: "إجمالي المقاعد", key: "total", default: 800 },
    ],
    buildSheet: (v, pt) => {
      const sets = Math.floor(v.total / 7);
      const paid = sets * 5;
      const rev = paid * v.price;
      const cost = sets * 7 * v.cost;
      return [
        ["نموذج مالي - عرض غسيل الكنب", ""],
        ["", ""],
        ["المتغيرات الأساسية", ""],
        ["سعر المقعد (ريال)", v.price],
        ["تكلفة المقعد (ريال)", v.cost],
        ["إجمالي المقاعد", v.total],
        ["نوع العرض", pt],
        ["", ""],
        ["المقاييس المحسوبة", ""],
        ["عدد الأطقم (7 مقاعد)", { t: "n", v: sets, f: "INT(B6/7)" }],
        ["مقاعد مدفوعة لكل طقم", 5],
        ["إجمالي المقاعد المدفوعة", { t: "n", v: paid, f: "B10*B11" }],
        ["الإيرادات (ريال)", { t: "n", v: rev, f: "B12*B4" }],
        ["إجمالي التكلفة (ريال)", { t: "n", v: cost, f: "B10*7*B5" }],
        ["الربح (ريال)", { t: "n", v: rev - cost, f: "B13-B14" }],
        ["السعر الفعلي للمقعد", { t: "n", v: +(rev / (sets * 7)).toFixed(2), f: "B13/(B10*7)" }],
        ["هامش الربح %", { t: "n", v: +((rev - cost) / rev * 100).toFixed(2), f: "B15/B13*100" }],
      ];
    },
  },
  {
    key: "jacket",
    name: "عرض غسيل الجواكت والملابس",
    fileName: "jacket_promo_model.xlsx",
    icon: "🧥",
    sheetTitle: "الجواكت",
    promoType: "3 قطع بسعر قطعتين",
    fields: [
      { label: "سعر القطعة (ريال)", key: "price", default: 20 },
      { label: "تكلفة القطعة (ريال)", key: "cost", default: 8 },
      { label: "إجمالي القطع", key: "total", default: 1000 },
    ],
    buildSheet: (v, pt) => {
      const groups = Math.floor(v.total / 3);
      const paid = groups * 2;
      const rev = paid * v.price;
      const cost = groups * 3 * v.cost;
      return [
        ["نموذج مالي - عرض غسيل الجواكت", ""],
        ["", ""],
        ["المتغيرات الأساسية", ""],
        ["سعر القطعة (ريال)", v.price],
        ["تكلفة القطعة (ريال)", v.cost],
        ["إجمالي القطع", v.total],
        ["نوع العرض", pt],
        ["", ""],
        ["المقاييس المحسوبة", ""],
        ["مجموعات (3 قطع)", { t: "n", v: groups, f: "INT(B6/3)" }],
        ["القطع المدفوعة", { t: "n", v: paid, f: "B10*2" }],
        ["الإيرادات (ريال)", { t: "n", v: rev, f: "B11*B4" }],
        ["إجمالي التكلفة (ريال)", { t: "n", v: cost, f: "B10*3*B5" }],
        ["الربح (ريال)", { t: "n", v: rev - cost, f: "B12-B13" }],
        ["السعر الفعلي للقطعة", { t: "n", v: +(rev / (groups * 3)).toFixed(2), f: "B12/(B10*3)" }],
        ["هامش الربح %", { t: "n", v: +((rev - cost) / rev * 100).toFixed(2), f: "B14/B12*100" }],
      ];
    },
  },
];

const brandHeader = (): (string | number)[][] => [
  ["مغاسل خطوة نظافة - Clean Step Laundry", ""],
  ["المدينة المنورة - Saudia", ""],
  ["ت: 0553310077 / 0569010202", ""],
  ["", ""],
];

const termsFooter = (): (string | number)[][] => [
  ["", ""],
  ["الشروط والأحكام", ""],
  ["** يتم حفظ المفروشات لمدة شهرين من تاريخ إشعار الجاهزية", ""],
  ["** قد تبقى بعض الآثار الناتجة عن بقع قديمة أو تلف سابق", ""],
  ["** الإبلاغ خلال 24 ساعة لأي ملاحظة", ""],
  ["** التوصيل مجاني للطلبات بقيمة 60 ريال فأكثر", ""],
  ["", ""],
  ["عناية تفوق التنظيف وثقة تُبنى مع كل خدمة", ""],
];

const buildFullSheet = (model: PromoModelConfig, vals: Record<string, number>): any[][] => {
  const header = brandHeader();
  const body = model.buildSheet(vals, model.promoType);
  const footer = termsFooter();
  return [...header, ...body, ...footer];
};

const exportSheet = (data: any[][], sheetTitle: string, fileName: string) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 40 }, { wch: 30 }];
  // Merge header row
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
  XLSX.writeFile(wb, fileName);
};

const PromoFinancialModels = () => {
  const [editModel, setEditModel] = useState<PromoModelConfig | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});

  const openEditor = (model: PromoModelConfig) => {
    const defaults: Record<string, number> = {};
    model.fields.forEach((f) => (defaults[f.key] = f.default));
    setValues(defaults);
    setEditModel(model);
  };

  const handleExport = () => {
    if (!editModel) return;
    try {
      const data = buildFullSheet(editModel, values);
      exportSheet(data, editModel.sheetTitle, editModel.fileName);
      toast.success(`تم تصدير "${editModel.name}" بنجاح 📊`);
      setEditModel(null);
    } catch {
      toast.error("حدث خطأ أثناء التصدير");
    }
  };

  const exportAll = () => {
    try {
      const wb = XLSX.utils.book_new();
      for (const model of models) {
        const defaults: Record<string, number> = {};
        model.fields.forEach((f) => (defaults[f.key] = f.default));
        const data = buildFullSheet(model, defaults);
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws["!cols"] = [{ wch: 40 }, { wch: 30 }];
        ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
        XLSX.utils.book_append_sheet(wb, ws, model.sheetTitle);
      }
      XLSX.writeFile(wb, "all_promo_models.xlsx");
      toast.success("تم تصدير جميع النماذج المالية بنجاح 📊");
    } catch {
      toast.error("حدث خطأ أثناء التصدير");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">النماذج المالية للعروض</h2>
        <Button onClick={exportAll} variant="default" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          تحميل الكل
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => (
          <button
            key={model.key}
            onClick={() => openEditor(model)}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/40 transition-colors text-right"
          >
            <span className="text-2xl">{model.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{model.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">تعديل وتحميل Excel</p>
            </div>
            <Settings2 className="h-4 w-4 text-primary shrink-0" />
          </button>
        ))}
      </div>

      <Dialog open={!!editModel} onOpenChange={(o) => !o && setEditModel(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <span className="text-xl">{editModel?.icon}</span>
              {editModel?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">عدّل القيم ثم اضغط تحميل لتصدير النموذج المالي</p>
            {editModel?.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <Input
                  type="number"
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [field.key]: Number(e.target.value) })}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground border border-border rounded-lg p-2 bg-secondary/30">
              نوع العرض: {editModel?.promoType}
            </p>
            <Button onClick={handleExport} className="w-full gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              تحميل Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoFinancialModels;
