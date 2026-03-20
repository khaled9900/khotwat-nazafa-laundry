import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { languages } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Globe, Palette, Building2, ArrowRight, Sun, Moon, Monitor, Check, Upload,
  Trash2, Loader2, ImageIcon, Plus, Pencil, MapPin, Printer, Gift, Star,
  MapPinned, Clock, Users, History, FileText, Package
} from "lucide-react";
import { toast } from "sonner";
import { getOrderStageSettings, saveOrderStageSettings, type OrderStageSettings } from "@/utils/autoTransitionOrders";
import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  is_active: boolean;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
  description: string;
  item_count: number;
  price: number;
  discount_percent: number;
  is_active: boolean;
}

interface Offer {
  id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface Region {
  id: string;
  name: string;
  delivery_fee: number;
  estimated_time: string;
  is_active: boolean;
}

const emptyBranch = { name: "", address: "", phone: "", manager: "", is_active: true };
const emptyPackage = { name: "", description: "", item_count: 1, price: 0, discount_percent: 0, is_active: true };
const emptyOffer = { name: "", description: "", discount_type: "percentage", discount_value: 0, start_date: "", end_date: "", is_active: true };
const emptyRegion = { name: "", delivery_fee: 0, estimated_time: "", is_active: true };

// Map routes to tab values
function getTabFromPath(path: string): string {
  if (path.includes("/settings/invoice")) return "invoice";
  if (path.includes("/settings/prints")) return "prints";
  if (path.includes("/settings/customers")) return "subscriptions";
  if (path.includes("/settings/packages")) return "packages";
  if (path.includes("/settings/offers")) return "offers";
  if (path.includes("/settings/loyalty")) return "loyalty";
  if (path.includes("/settings/regions")) return "regions";
  if (path.includes("/settings/delivery-times")) return "delivery";
  if (path.includes("/dashboard/company")) return "company";
  if (path.includes("/dashboard/branches")) return "branches";
  if (path.includes("/settings/general")) return "language";
  return "language";
}

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
  });

  // Company data state
  const defaultCompanyData = {
    name: "مغاسل خطوة نظافة - Clean Step Laundry",
    phone: "0569010202 / 0553310077",
    email: "",
    address: "",
    city: "المدينة المنورة",
    country: "المملكة العربية السعودية",
    tax_number: "",
    commercial_reg: "",
  };

  const [companyData, setCompanyData] = useState(defaultCompanyData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Invoice attachment state
  const [invoiceAttachmentUrl, setInvoiceAttachmentUrl] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Branches state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> & typeof emptyBranch>(emptyBranch);
  const [savingBranch, setSavingBranch] = useState(false);

  // Packages state
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<Package> & typeof emptyPackage>(emptyPackage);
  const [savingPackage, setSavingPackage] = useState(false);

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> & typeof emptyOffer>(emptyOffer);
  const [savingOffer, setSavingOffer] = useState(false);

  // Regions state
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Partial<Region> & typeof emptyRegion>(emptyRegion);
  const [savingRegion, setSavingRegion] = useState(false);

  // Settings state
  const [printSettings, setPrintSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("printSettings") || "{}"); } catch { return {}; }
  });
  const [deliverySettings, setDeliverySettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("deliverySettings") || "{}"); } catch { return {}; }
  });

  // Invoice page settings state
  const defaultInvoicePageSettings = {
    prefix: "A",
    maxPerLetter: 99999,
    taxRate: 0,
    defaultService: "غسيل",
    autoChangeLetter: true,
    laundryCycleActive: true,
    normalPrepTime: 96,
    urgentPrepTime: 24,
    pinLeftSide: true,
  };
  const [invoicePageSettings, setInvoicePageSettings] = useState(defaultInvoicePageSettings);

  // Order stage settings
  const [orderStageSettings, setOrderStageSettings] = useState<OrderStageSettings>(getOrderStageSettings);

  // Invoice A4 customization state
  const defaultInvoiceSettings = {
    primaryColor: "#0f766e",
    showLogo: true,
    logoSize: 40,
    showQR: true,
    slogan: "عناية تفوق التنظيف وثقة تُبنى مع كل خدمة",
    sloganSub: "نعتمد تقنيات تنظيف احترافية ومنتجات آمنة طبيعية مناسبة لكل نوع نسيج لتحقيق أفضل نتيجة",
    terms: [
      "** يتم حفظ المفروشات لمدة شهرين من تاريخ إشعار الجاهزية",
      "** قد تبقى بعض الآثار الناتجة عن بقع قديمة أو تلف سابق",
      "** الإبلاغ خلال 24 ساعة لأي ملاحظة",
      "** التوصيل مجاني للطلبات بقيمة 60 ريال فأكثر",
    ],
  };
  const [invoiceSettings, setInvoiceSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("invoiceSettings");
      return saved ? { ...defaultInvoiceSettings, ...JSON.parse(saved) } : defaultInvoiceSettings;
    } catch { return defaultInvoiceSettings; }
  });

  // Audit log state
  const AUDIT_TABLE = "audit_logs" as any;
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const SETTINGS_TABLE = "business_settings" as any;

  const logAudit = async (action: string, entityType: string, entityId?: string, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from(AUDIT_TABLE).insert({
        user_id: user.id,
        user_email: user.email || '',
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {},
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    const { data } = await supabase.from(AUDIT_TABLE).select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setAuditLogs(data as any);
    setAuditLoading(false);
  };

  const upsertBusinessSetting = async (settingKey: string, settingValue: unknown) => {
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(
        { setting_key: settingKey, setting_value: settingValue },
        { onConflict: "setting_key" }
      );

    if (error) throw error;
  };

  const loadPersistedSettings = async () => {
    try {
      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .select("setting_key, setting_value")
        .in("setting_key", ["company_data", "print_settings", "delivery_settings", "company_logo", "invoice_settings", "invoice_attachment", "order_stage_settings", "invoice_page_settings"]);

      if (error) {
        console.error("Settings load error:", error);
        return;
      }

      const settingsMap = new Map((data || []).map((row: any) => [row.setting_key, row.setting_value]));

      const invoiceSetting = settingsMap.get("invoice_settings");
      if (invoiceSetting) {
        const merged = { ...defaultInvoiceSettings, ...(invoiceSetting as any) };
        setInvoiceSettings(merged);
        localStorage.setItem("invoiceSettings", JSON.stringify(merged));
      }

      const companyDataSetting = settingsMap.get("company_data");
      if (companyDataSetting) {
        setCompanyData({ ...defaultCompanyData, ...(companyDataSetting as any) });
      }

      const printSetting = settingsMap.get("print_settings");
      if (printSetting) {
        setPrintSettings(printSetting as any);
      }

      const deliverySetting = settingsMap.get("delivery_settings");
      if (deliverySetting) {
        setDeliverySettings(deliverySetting as any);
      }

      const companyLogoSetting = settingsMap.get("company_logo");
      if (typeof companyLogoSetting === "string" && companyLogoSetting.length > 0) {
        setLogoUrl(companyLogoSetting);
        localStorage.setItem("companyLogo", companyLogoSetting);
      }

      const attachmentSetting = settingsMap.get("invoice_attachment");
      if (typeof attachmentSetting === "string" && attachmentSetting.length > 0) {
        setInvoiceAttachmentUrl(attachmentSetting);
        localStorage.setItem("invoiceAttachment", attachmentSetting);
      }

      const stageSetting = settingsMap.get("order_stage_settings");
      if (stageSetting && typeof stageSetting === "object") {
        const merged = { ...getOrderStageSettings(), ...(stageSetting as any) };
        setOrderStageSettings(merged);
        localStorage.setItem("orderStageSettings", JSON.stringify(merged));
      }

      const invoicePageSetting = settingsMap.get("invoice_page_settings");
      if (invoicePageSetting && typeof invoicePageSetting === "object") {
        const merged = { ...defaultInvoicePageSettings, ...(invoicePageSetting as any) };
        setInvoicePageSettings(merged);
        localStorage.setItem("invoicePageSettings", JSON.stringify(merged));
      }
    } catch (err) {
      console.error("Unexpected settings load error:", err);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("companyData");
    if (saved) {
      try { setCompanyData({ ...defaultCompanyData, ...JSON.parse(saved) }); } catch {}
    }
    const savedLogo = localStorage.getItem("companyLogo");
    if (savedLogo) setLogoUrl(savedLogo);

    fetchBranches();
    fetchPackages();
    fetchOffers();
    fetchRegions();
    loadPersistedSettings();
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "light") root.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLangChange = (code: string) => i18n.changeLanguage(code);

  const handleSaveCompany = async () => {
    try {
      localStorage.setItem("companyData", JSON.stringify(companyData));
      await upsertBusinessSetting("company_data", companyData);
      await logAudit("تحديث", "بيانات الشركة", undefined, companyData);
      toast.success(t("company_data_saved"));
    } catch (err: any) {
      console.error("Save company settings error:", err);
      toast.error("تعذر حفظ البيانات. تأكد من تسجيل الدخول بحساب المدير.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error(t("invalid_image")); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error(t("image_too_large")); return; }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo.${ext}`;
      await supabase.storage.from("company-assets").remove([path]);
      const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setLogoUrl(url);
      localStorage.setItem("companyLogo", url);
      await upsertBusinessSetting("company_logo", url);
      await logAudit("رفع", "شعار الشركة");
      toast.success(t("logo_uploaded"));
    } catch (err) {
      console.error("Logo upload error:", err);
      toast.error(t("logo_upload_error"));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setLogoUrl(null);
      localStorage.removeItem("companyLogo");
      await upsertBusinessSetting("company_logo", "");
      await logAudit("حذف", "شعار الشركة");
      toast.success(t("logo_removed"));
    } catch (err) {
      console.error("Remove logo error:", err);
      toast.error("تعذر إزالة الشعار حالياً");
    }
  };

  // Branches CRUD
  const fetchBranches = async () => {
    setBranchLoading(true);
    const { data } = await supabase.from("branches").select("*").order("created_at", { ascending: true });
    if (data) setBranches(data);
    setBranchLoading(false);
  };

  const openAddBranch = () => { setEditingBranch({ ...emptyBranch }); setBranchDialogOpen(true); };
  const openEditBranch = (branch: Branch) => { setEditingBranch({ ...branch }); setBranchDialogOpen(true); };

  const handleSaveBranch = async () => {
    if (!editingBranch.name.trim()) { toast.error("يرجى إدخال اسم الفرع"); return; }
    setSavingBranch(true);
    try {
      if ((editingBranch as any).id) {
        const { error } = await supabase.from("branches").update({
          name: editingBranch.name, address: editingBranch.address,
          phone: editingBranch.phone, manager: editingBranch.manager, is_active: editingBranch.is_active,
        }).eq("id", (editingBranch as any).id);
        if (error) throw error;
        toast.success("تم تحديث الفرع");
        await logAudit("تحديث", "فرع", (editingBranch as any).id, { name: editingBranch.name });
      } else {
        const { error } = await supabase.from("branches").insert({
          name: editingBranch.name, address: editingBranch.address,
          phone: editingBranch.phone, manager: editingBranch.manager, is_active: editingBranch.is_active,
        });
        if (error) throw error;
        toast.success("تمت إضافة الفرع");
        await logAudit("إضافة", "فرع", undefined, { name: editingBranch.name });
      }
      setBranchDialogOpen(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally { setSavingBranch(false); }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("هل تريد حذف هذا الفرع؟")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) { toast.error("حدث خطأ أثناء الحذف"); return; }
    toast.success("تم حذف الفرع");
    await logAudit("حذف", "فرع", id);
    fetchBranches();
  };

  // Packages CRUD
  const PACKAGES_TABLE = "packages" as any;
  const fetchPackages = async () => {
    setPackageLoading(true);
    const { data } = await supabase.from(PACKAGES_TABLE).select("*").order("created_at", { ascending: true });
    if (data) setPackages(data as any);
    setPackageLoading(false);
  };
  const openAddPackage = () => { setEditingPackage({ ...emptyPackage }); setPackageDialogOpen(true); };
  const openEditPackage = (pkg: Package) => { setEditingPackage({ ...pkg }); setPackageDialogOpen(true); };
  const handleSavePackage = async () => {
    if (!editingPackage.name.trim()) { toast.error("يرجى إدخال اسم الباقة"); return; }
    setSavingPackage(true);
    try {
      const payload = { name: editingPackage.name, description: editingPackage.description, item_count: editingPackage.item_count, price: editingPackage.price, discount_percent: editingPackage.discount_percent, is_active: editingPackage.is_active };
      if ((editingPackage as any).id) {
        const { error } = await supabase.from(PACKAGES_TABLE).update(payload).eq("id", (editingPackage as any).id);
        if (error) throw error;
        toast.success("تم تحديث الباقة");
        await logAudit("تحديث", "باقة", (editingPackage as any).id, { name: editingPackage.name });
      } else {
        const { error } = await supabase.from(PACKAGES_TABLE).insert(payload);
        if (error) throw error;
        toast.success("تمت إضافة الباقة");
        await logAudit("إضافة", "باقة", undefined, { name: editingPackage.name });
      }
      setPackageDialogOpen(false);
      fetchPackages();
    } catch (err) { console.error(err); toast.error("حدث خطأ أثناء الحفظ"); }
    finally { setSavingPackage(false); }
  };
  const handleDeletePackage = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الباقة؟")) return;
    const { error } = await supabase.from(PACKAGES_TABLE).delete().eq("id", id);
    if (error) { toast.error("حدث خطأ أثناء الحذف"); return; }
    toast.success("تم حذف الباقة");
    await logAudit("حذف", "باقة", id);
    fetchPackages();
  };

  // Offers CRUD
  const OFFERS_TABLE = "offers" as any;
  const fetchOffers = async () => {
    setOfferLoading(true);
    const { data } = await supabase.from(OFFERS_TABLE).select("*").order("created_at", { ascending: true });
    if (data) setOffers(data as any);
    setOfferLoading(false);
  };
  const openAddOffer = () => { setEditingOffer({ ...emptyOffer }); setOfferDialogOpen(true); };
  const openEditOffer = (offer: Offer) => { setEditingOffer({ ...offer }); setOfferDialogOpen(true); };
  const handleSaveOffer = async () => {
    if (!editingOffer.name.trim()) { toast.error("يرجى إدخال اسم العرض"); return; }
    setSavingOffer(true);
    try {
      const payload = { name: editingOffer.name, description: editingOffer.description, discount_type: editingOffer.discount_type, discount_value: editingOffer.discount_value, start_date: editingOffer.start_date || null, end_date: editingOffer.end_date || null, is_active: editingOffer.is_active };
      if ((editingOffer as any).id) {
        const { error } = await supabase.from(OFFERS_TABLE).update(payload).eq("id", (editingOffer as any).id);
        if (error) throw error;
        toast.success("تم تحديث العرض");
        await logAudit("تحديث", "عرض", (editingOffer as any).id, { name: editingOffer.name });
      } else {
        const { error } = await supabase.from(OFFERS_TABLE).insert(payload);
        if (error) throw error;
        toast.success("تمت إضافة العرض");
        await logAudit("إضافة", "عرض", undefined, { name: editingOffer.name });
      }
      setOfferDialogOpen(false);
      fetchOffers();
    } catch (err) { console.error(err); toast.error("حدث خطأ أثناء الحفظ"); }
    finally { setSavingOffer(false); }
  };
  const handleDeleteOffer = async (id: string) => {
    if (!confirm("هل تريد حذف هذا العرض؟")) return;
    const { error } = await supabase.from(OFFERS_TABLE).delete().eq("id", id);
    if (error) { toast.error("حدث خطأ أثناء الحذف"); return; }
    toast.success("تم حذف العرض");
    await logAudit("حذف", "عرض", id);
    fetchOffers();
  };

  // Regions CRUD
  const REGIONS_TABLE = "regions" as any;
  const fetchRegions = async () => {
    setRegionLoading(true);
    const { data } = await supabase.from(REGIONS_TABLE).select("*").order("created_at", { ascending: true });
    if (data) setRegions(data as any);
    setRegionLoading(false);
  };
  const openAddRegion = () => { setEditingRegion({ ...emptyRegion }); setRegionDialogOpen(true); };
  const openEditRegion = (region: Region) => { setEditingRegion({ ...region }); setRegionDialogOpen(true); };
  const handleSaveRegion = async () => {
    if (!editingRegion.name.trim()) { toast.error("يرجى إدخال اسم المنطقة"); return; }
    setSavingRegion(true);
    try {
      const payload = { name: editingRegion.name, delivery_fee: editingRegion.delivery_fee, estimated_time: editingRegion.estimated_time, is_active: editingRegion.is_active };
      if ((editingRegion as any).id) {
        const { error } = await supabase.from(REGIONS_TABLE).update(payload).eq("id", (editingRegion as any).id);
        if (error) throw error;
        toast.success("تم تحديث المنطقة");
        await logAudit("تحديث", "منطقة", (editingRegion as any).id, { name: editingRegion.name });
      } else {
        const { error } = await supabase.from(REGIONS_TABLE).insert(payload);
        if (error) throw error;
        toast.success("تمت إضافة المنطقة");
        await logAudit("إضافة", "منطقة", undefined, { name: editingRegion.name });
      }
      setRegionDialogOpen(false);
      fetchRegions();
    } catch (err) { console.error(err); toast.error("حدث خطأ أثناء الحفظ"); }
    finally { setSavingRegion(false); }
  };
  const handleDeleteRegion = async (id: string) => {
    if (!confirm("هل تريد حذف هذه المنطقة؟")) return;
    const { error } = await supabase.from(REGIONS_TABLE).delete().eq("id", id);
    if (error) { toast.error("حدث خطأ أثناء الحذف"); return; }
    toast.success("تم حذف المنطقة");
    await logAudit("حذف", "منطقة", id);
    fetchRegions();
  };

  const savePrintSettings = async () => {
    try {
      localStorage.setItem("printSettings", JSON.stringify(printSettings));
      await upsertBusinessSetting("print_settings", printSettings);
      await logAudit("تحديث", "إعدادات الطباعة", undefined, printSettings);
      toast.success("تم حفظ إعدادات الطباعة");
    } catch (err) {
      console.error("Save print settings error:", err);
      toast.error("تعذر حفظ إعدادات الطباعة");
    }
  };

  const saveDeliverySettings = async () => {
    try {
      localStorage.setItem("deliverySettings", JSON.stringify(deliverySettings));
      await upsertBusinessSetting("delivery_settings", deliverySettings);
      await logAudit("تحديث", "أوقات التوصيل", undefined, deliverySettings);
      toast.success("تم حفظ أوقات التوصيل");
    } catch (err) {
      console.error("Save delivery settings error:", err);
      toast.error("تعذر حفظ أوقات التوصيل");
    }
  };

  const saveInvoiceSettings = async () => {
    try {
      localStorage.setItem("invoiceSettings", JSON.stringify(invoiceSettings));
      await upsertBusinessSetting("invoice_settings", invoiceSettings);
      await logAudit("تحديث", "إعدادات فاتورة A4", undefined, invoiceSettings);
      toast.success("تم حفظ إعدادات الفاتورة");
    } catch (err) {
      console.error("Save invoice settings error:", err);
      toast.error("تعذر حفظ إعدادات الفاتورة");
    }
  };

  const saveInvoicePageSettings = async () => {
    try {
      localStorage.setItem("invoicePageSettings", JSON.stringify(invoicePageSettings));
      await upsertBusinessSetting("invoice_page_settings", invoicePageSettings);
      await logAudit("تحديث", "إعدادات صفحة الفواتير", undefined, invoicePageSettings);
      toast.success("تم حفظ إعدادات صفحة الفواتير ✅");
    } catch (err) {
      console.error("Save invoice page settings error:", err);
      toast.error("تعذر حفظ الإعدادات");
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("يرجى رفع صورة أو ملف PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 5MB");
      return;
    }
    setUploadingAttachment(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `invoice-attachment.${ext}`;
      await supabase.storage.from("company-assets").remove([path]);
      const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setInvoiceAttachmentUrl(url);
      localStorage.setItem("invoiceAttachment", url);
      await upsertBusinessSetting("invoice_attachment", url);
      await logAudit("رفع", "مرفق الفاتورة");
      toast.success("تم رفع المرفق بنجاح");
    } catch (err) {
      console.error("Attachment upload error:", err);
      toast.error("تعذر رفع المرفق");
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async () => {
    try {
      setInvoiceAttachmentUrl(null);
      localStorage.removeItem("invoiceAttachment");
      await upsertBusinessSetting("invoice_attachment", "");
      await logAudit("حذف", "مرفق الفاتورة");
      toast.success("تم إزالة المرفق");
    } catch (err) {
      console.error("Remove attachment error:", err);
      toast.error("تعذر إزالة المرفق");
    }
  };

  const themes = [
    { value: "light" as const, icon: Sun, labelKey: "theme_light" },
    { value: "dark" as const, icon: Moon, labelKey: "theme_dark" },
    { value: "system" as const, icon: Monitor, labelKey: "theme_system" },
  ];

  const tabItems = [
    { value: "language", icon: Globe, label: t("language") },
    { value: "theme", icon: Palette, label: t("theme") },
    { value: "company", icon: Building2, label: t("company_info") },
    { value: "branches", icon: MapPin, label: "الفروع" },
    { value: "invoice", icon: FileText, label: "فاتورة A4" },
    { value: "prints", icon: Printer, label: "الطباعة" },
    { value: "packages", icon: Gift, label: "الباقات" },
    { value: "offers", icon: Star, label: "العروض" },
    { value: "regions", icon: MapPinned, label: "المناطق" },
    { value: "delivery", icon: Clock, label: "التوصيل" },
    { value: "audit", icon: History, label: "سجل التدقيق" },
    { value: "order_stages", icon: Package, label: "مراحل الطلب" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                <ArrowRight className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-foreground">{t("general_settings")}</h1>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "audit") fetchAuditLogs(); }} dir={i18n.dir()}>
              <div className="overflow-x-auto mb-6">
                <TabsList className="inline-flex w-auto min-w-full gap-1">
                  {tabItems.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3">
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Language Tab */}
              <TabsContent value="language">
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t("select_language")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {languages.map((lang) => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                            i18n.language === lang.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/40"
                          }`}>
                          <span className="font-medium text-foreground">{lang.name}</span>
                          {i18n.language === lang.code && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Theme Tab */}
              <TabsContent value="theme">
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t("select_theme")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {themes.map((t_item) => (
                        <button key={t_item.value} onClick={() => setTheme(t_item.value)}
                          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                            theme === t_item.value ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 hover:bg-secondary/40"
                          }`}>
                          <div className={`p-3 rounded-full ${theme === t_item.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                            <t_item.icon className="h-6 w-6" />
                          </div>
                          <span className="font-medium text-foreground">{t(t_item.labelKey)}</span>
                          {theme === t_item.value && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Company Info Tab */}
              <TabsContent value="company">
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t("company_info")}</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">{t("company_logo")}</label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/30 overflow-hidden shrink-0">
                          {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                        </div>
                        <div className="flex flex-col gap-2">
                          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Upload className="h-4 w-4 me-1" />}
                            {t("upload_logo")}
                          </Button>
                          {logoUrl && (
                            <Button variant="outline" size="sm" onClick={handleRemoveLogo} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 me-1" />{t("remove_logo")}
                            </Button>
                          )}
                          <p className="text-[10px] text-muted-foreground">{t("logo_hint")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: "name", label: t("company_name_label") },
                        { key: "phone", label: t("phone"), dir: "ltr" },
                        { key: "email", label: t("email"), dir: "ltr" },
                        { key: "city", label: t("city") },
                        { key: "country", label: t("country") },
                        { key: "address", label: t("address") },
                        { key: "tax_number", label: t("tax_number"), dir: "ltr" },
                        { key: "commercial_reg", label: t("commercial_reg"), dir: "ltr" },
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{field.label}</label>
                          <Input
                            value={(companyData as any)[field.key]}
                            onChange={(e) => setCompanyData({ ...companyData, [field.key]: e.target.value })}
                            placeholder={field.label}
                            dir={field.dir}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button variant="save" onClick={handleSaveCompany} className="min-w-[140px]">{t("save")}</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Branches Tab */}
              <TabsContent value="branches">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">إدارة الفروع</CardTitle>
                    <Button size="sm" onClick={openAddBranch}><Plus className="h-4 w-4 me-1" />إضافة فرع</Button>
                  </CardHeader>
                  <CardContent>
                    {branchLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : branches.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">لا توجد فروع مسجلة</p>
                        <Button variant="outline" onClick={openAddBranch}><Plus className="h-4 w-4 me-1" />إضافة أول فرع</Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">اسم الفرع</TableHead>
                              <TableHead className="text-right">العنوان</TableHead>
                              <TableHead className="text-right">الهاتف</TableHead>
                              <TableHead className="text-right">المدير</TableHead>
                              <TableHead className="text-right">الحالة</TableHead>
                              <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {branches.map((branch) => (
                              <TableRow key={branch.id}>
                                <TableCell className="font-medium">{branch.name}</TableCell>
                                <TableCell>{branch.address || "—"}</TableCell>
                                <TableCell dir="ltr" className="text-right">{branch.phone || "—"}</TableCell>
                                <TableCell>{branch.manager || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={branch.is_active ? "default" : "secondary"}>{branch.is_active ? "نشط" : "متوقف"}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditBranch(branch)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBranch(branch.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Print Settings Tab */}
              <TabsContent value="prints">
                <Card>
                  <CardHeader><CardTitle className="text-lg">إعدادات الطباعة</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">عرض الفاتورة (مم)</label>
                        <Input type="number" value={printSettings.receiptWidth || "80"} onChange={(e) => setPrintSettings({ ...printSettings, receiptWidth: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">حجم الخط</label>
                        <Input type="number" value={printSettings.fontSize || "12"} onChange={(e) => setPrintSettings({ ...printSettings, fontSize: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">نص الترويسة</label>
                      <Textarea value={printSettings.headerText || ""} onChange={(e) => setPrintSettings({ ...printSettings, headerText: e.target.value })} placeholder="نص يظهر أعلى الفاتورة" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">نص التذييل</label>
                      <Textarea value={printSettings.footerText || ""} onChange={(e) => setPrintSettings({ ...printSettings, footerText: e.target.value })} placeholder="نص يظهر أسفل الفاتورة (شكراً لزيارتكم)" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-sm text-foreground">إظهار الشعار في الفاتورة</span>
                      <Switch checked={printSettings.showLogo ?? true} onCheckedChange={(v) => setPrintSettings({ ...printSettings, showLogo: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-sm text-foreground">إظهار QR Code</span>
                      <Switch checked={printSettings.showQR ?? true} onCheckedChange={(v) => setPrintSettings({ ...printSettings, showQR: v })} />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button variant="save" onClick={savePrintSettings} className="min-w-[140px]">حفظ</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoice Page Settings */}
              <TabsContent value="invoice">
                <Card className="mb-6">
                  <CardHeader><CardTitle className="text-lg">إعدادات صفحة الفواتير</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Row 1: Prefix + Max per letter */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">بداية حرف الفاتورة</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={invoicePageSettings.prefix}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
                              setInvoicePageSettings({ ...invoicePageSettings, prefix: val });
                            }}
                            className="w-20 text-center font-bold text-lg"
                            dir="ltr"
                            maxLength={2}
                          />
                          <span className="text-xs text-muted-foreground">A-Z</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">الحد الأقصى لكل حرف</label>
                        <Input
                          type="number"
                          value={invoicePageSettings.maxPerLetter}
                          onChange={(e) => setInvoicePageSettings({ ...invoicePageSettings, maxPerLetter: Number(e.target.value) || 99999 })}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Row 2: Tax + Default Service */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">الضريبة %</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={invoicePageSettings.taxRate}
                            onChange={(e) => setInvoicePageSettings({ ...invoicePageSettings, taxRate: Number(e.target.value) || 0 })}
                            className="w-28"
                            dir="ltr"
                            step="0.01"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-muted-foreground font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">الضبط الافتراضي للخدمة</label>
                        <Input
                          value={invoicePageSettings.defaultService}
                          onChange={(e) => setInvoicePageSettings({ ...invoicePageSettings, defaultService: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <span className="text-sm text-foreground">تثبيت الجانب الأيسر (إجمالي الفاتورة)</span>
                        <Switch checked={invoicePageSettings.pinLeftSide} onCheckedChange={(v) => setInvoicePageSettings({ ...invoicePageSettings, pinLeftSide: v })} />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <span className="text-sm text-foreground">تغيير الحرف تلقائياً بعد وصول رقم الفاتورة للحد الأقصى</span>
                        <Switch checked={invoicePageSettings.autoChangeLetter} onCheckedChange={(v) => setInvoicePageSettings({ ...invoicePageSettings, autoChangeLetter: v })} />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <span className="text-sm text-foreground">تنشيط دورة عمل الغسيل (قيد التنفيذ - فواتير جاهزة)</span>
                        <Switch checked={invoicePageSettings.laundryCycleActive} onCheckedChange={(v) => setInvoicePageSettings({ ...invoicePageSettings, laundryCycleActive: v })} />
                      </div>
                    </div>

                    {/* Prep times */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground">وقت تجهيز الفاتورة</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">الوقت العادي للتجهيز</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={invoicePageSettings.normalPrepTime}
                              onChange={(e) => setInvoicePageSettings({ ...invoicePageSettings, normalPrepTime: Number(e.target.value) || 96 })}
                              className="w-28"
                              dir="ltr"
                              min="1"
                            />
                            <span className="text-xs text-muted-foreground">ساعة من تاريخ الفاتورة</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">الوقت السريع للتجهيز</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={invoicePageSettings.urgentPrepTime}
                              onChange={(e) => setInvoicePageSettings({ ...invoicePageSettings, urgentPrepTime: Number(e.target.value) || 24 })}
                              className="w-28"
                              dir="ltr"
                              min="1"
                            />
                            <span className="text-xs text-muted-foreground">ساعة من تاريخ الفاتورة</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button variant="save" onClick={saveInvoicePageSettings} className="min-w-[140px]">حفظ</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">تخصيص فاتورة A4</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Color Picker */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">اللون الرئيسي للفاتورة</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={invoiceSettings.primaryColor}
                          onChange={(e) => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                          className="h-10 w-14 rounded border border-input cursor-pointer"
                        />
                        <Input
                          value={invoiceSettings.primaryColor}
                          onChange={(e) => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                          className="w-32 font-mono"
                          dir="ltr"
                          placeholder="#0f766e"
                        />
                        <div className="flex gap-2">
                          {["#0f766e", "#1e40af", "#7c3aed", "#b91c1c", "#ca8a04", "#0891b2"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setInvoiceSettings({ ...invoiceSettings, primaryColor: c })}
                              className={`h-8 w-8 rounded-full border-2 transition-all ${invoiceSettings.primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preview stripe */}
                    <div className="p-4 rounded-lg text-white text-center font-bold" style={{ background: invoiceSettings.primaryColor }}>
                      معاينة اللون - فاتورة مبيعات / Sales Invoice
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <span className="text-sm text-foreground">إظهار الشعار في فاتورة A4</span>
                        <Switch checked={invoiceSettings.showLogo} onCheckedChange={(v) => setInvoiceSettings({ ...invoiceSettings, showLogo: v })} />
                      </div>
                      {invoiceSettings.showLogo && (
                        <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">حجم الشعار</span>
                            <span className="text-xs text-muted-foreground">{invoiceSettings.logoSize || 40}px</span>
                          </div>
                          <Slider
                            value={[invoiceSettings.logoSize || 40]}
                            onValueChange={([v]) => setInvoiceSettings({ ...invoiceSettings, logoSize: v })}
                            min={20}
                            max={120}
                            step={4}
                            className="w-full"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <span className="text-sm text-foreground">إظهار QR Code في فاتورة A4</span>
                        <Switch checked={invoiceSettings.showQR} onCheckedChange={(v) => setInvoiceSettings({ ...invoiceSettings, showQR: v })} />
                      </div>
                    </div>

                    {/* Slogan */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">شعار الفاتورة (Slogan)</label>
                      <Input
                        value={invoiceSettings.slogan}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, slogan: e.target.value })}
                        placeholder="عناية تفوق التنظيف وثقة تُبنى مع كل خدمة"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">النص الفرعي</label>
                      <Textarea
                        value={invoiceSettings.sloganSub}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, sloganSub: e.target.value })}
                        placeholder="نعتمد تقنيات تنظيف احترافية..."
                      />
                    </div>

                    {/* Terms */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">الشروط والأحكام</label>
                      {invoiceSettings.terms.map((term: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={term}
                            onChange={(e) => {
                              const newTerms = [...invoiceSettings.terms];
                              newTerms[idx] = e.target.value;
                              setInvoiceSettings({ ...invoiceSettings, terms: newTerms });
                            }}
                            placeholder={`الشرط ${idx + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newTerms = invoiceSettings.terms.filter((_: string, i: number) => i !== idx);
                              setInvoiceSettings({ ...invoiceSettings, terms: newTerms });
                            }}
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInvoiceSettings({ ...invoiceSettings, terms: [...invoiceSettings.terms, ""] })}
                      >
                        <Plus className="h-4 w-4 me-1" />إضافة شرط
                      </Button>
                    </div>

                    {/* Invoice Attachment */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        مرفق الفاتورة (صورة أو PDF)
                      </label>
                      <p className="text-xs text-muted-foreground">يظهر في أسفل الفاتورة عند الطباعة (مثل: ختم، توقيع، إعلان، شروط إضافية)</p>
                      {invoiceAttachmentUrl ? (
                        <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                          {invoiceAttachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                            <img src={invoiceAttachmentUrl} alt="مرفق الفاتورة" className="h-20 rounded border border-border object-contain" />
                          ) : (
                            <div className="h-20 w-20 rounded border border-border bg-muted flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()}>
                              <Upload className="h-4 w-4 me-1" />تغيير المرفق
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemoveAttachment}>
                              <Trash2 className="h-4 w-4 me-1" />إزالة المرفق
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingAttachment}>
                          {uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Upload className="h-4 w-4 me-1" />}
                          رفع مرفق
                        </Button>
                      )}
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleAttachmentUpload}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button variant="save" onClick={saveInvoiceSettings} className="min-w-[140px]">حفظ</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Packages Tab */}
              <TabsContent value="packages">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">إدارة الباقات</CardTitle>
                    <Button size="sm" onClick={openAddPackage}><Plus className="h-4 w-4 me-1" />إضافة باقة</Button>
                  </CardHeader>
                  <CardContent>
                    {packageLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : packages.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <Gift className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">لا توجد باقات مسجلة</p>
                        <Button variant="outline" onClick={openAddPackage}><Plus className="h-4 w-4 me-1" />إضافة أول باقة</Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">اسم الباقة</TableHead>
                              <TableHead className="text-right">الوصف</TableHead>
                              <TableHead className="text-right">عدد القطع</TableHead>
                              <TableHead className="text-right">السعر</TableHead>
                              <TableHead className="text-right">الخصم %</TableHead>
                              <TableHead className="text-right">الحالة</TableHead>
                              <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {packages.map((pkg) => (
                              <TableRow key={pkg.id}>
                                <TableCell className="font-medium">{pkg.name}</TableCell>
                                <TableCell>{pkg.description || "—"}</TableCell>
                                <TableCell>{pkg.item_count}</TableCell>
                                <TableCell>{pkg.price} ر.س</TableCell>
                                <TableCell>{pkg.discount_percent}%</TableCell>
                                <TableCell><Badge variant={pkg.is_active ? "default" : "secondary"}>{pkg.is_active ? "نشط" : "متوقف"}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditPackage(pkg)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Offers Tab */}
              <TabsContent value="offers">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">إدارة العروض</CardTitle>
                    <Button size="sm" onClick={openAddOffer}><Plus className="h-4 w-4 me-1" />إضافة عرض</Button>
                  </CardHeader>
                  <CardContent>
                    {offerLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : offers.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">لا توجد عروض مسجلة</p>
                        <Button variant="outline" onClick={openAddOffer}><Plus className="h-4 w-4 me-1" />إضافة أول عرض</Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">اسم العرض</TableHead>
                              <TableHead className="text-right">الوصف</TableHead>
                              <TableHead className="text-right">نوع الخصم</TableHead>
                              <TableHead className="text-right">القيمة</TableHead>
                              <TableHead className="text-right">من</TableHead>
                              <TableHead className="text-right">إلى</TableHead>
                              <TableHead className="text-right">الحالة</TableHead>
                              <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {offers.map((offer) => (
                              <TableRow key={offer.id}>
                                <TableCell className="font-medium">{offer.name}</TableCell>
                                <TableCell>{offer.description || "—"}</TableCell>
                                <TableCell>{offer.discount_type === "percentage" ? "نسبة %" : "مبلغ ثابت"}</TableCell>
                                <TableCell>{offer.discount_value}{offer.discount_type === "percentage" ? "%" : " ر.س"}</TableCell>
                                <TableCell>{offer.start_date || "—"}</TableCell>
                                <TableCell>{offer.end_date || "—"}</TableCell>
                                <TableCell><Badge variant={offer.is_active ? "default" : "secondary"}>{offer.is_active ? "نشط" : "متوقف"}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditOffer(offer)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteOffer(offer.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Regions Tab */}
              <TabsContent value="regions">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">إدارة المناطق</CardTitle>
                    <Button size="sm" onClick={openAddRegion}><Plus className="h-4 w-4 me-1" />إضافة منطقة</Button>
                  </CardHeader>
                  <CardContent>
                    {regionLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : regions.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <MapPinned className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">لا توجد مناطق مسجلة</p>
                        <Button variant="outline" onClick={openAddRegion}><Plus className="h-4 w-4 me-1" />إضافة أول منطقة</Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">اسم المنطقة</TableHead>
                              <TableHead className="text-right">رسوم التوصيل</TableHead>
                              <TableHead className="text-right">الوقت المتوقع</TableHead>
                              <TableHead className="text-right">الحالة</TableHead>
                              <TableHead className="text-right">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {regions.map((region) => (
                              <TableRow key={region.id}>
                                <TableCell className="font-medium">{region.name}</TableCell>
                                <TableCell>{region.delivery_fee} ر.س</TableCell>
                                <TableCell>{region.estimated_time || "—"}</TableCell>
                                <TableCell><Badge variant={region.is_active ? "default" : "secondary"}>{region.is_active ? "نشط" : "متوقف"}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditRegion(region)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRegion(region.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Delivery Times Tab */}
              <TabsContent value="delivery">
                <Card>
                  <CardHeader><CardTitle className="text-lg">أوقات التوصيل</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day, i) => (
                      <div key={day} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <span className="text-sm font-medium text-foreground">{day}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            className="w-28"
                            value={deliverySettings[`from_${i}`] || "08:00"}
                            onChange={(e) => setDeliverySettings({ ...deliverySettings, [`from_${i}`]: e.target.value })}
                          />
                          <span className="text-muted-foreground">—</span>
                          <Input
                            type="time"
                            className="w-28"
                            value={deliverySettings[`to_${i}`] || "22:00"}
                            onChange={(e) => setDeliverySettings({ ...deliverySettings, [`to_${i}`]: e.target.value })}
                          />
                          <Switch
                            checked={deliverySettings[`active_${i}`] ?? true}
                            onCheckedChange={(v) => setDeliverySettings({ ...deliverySettings, [`active_${i}`]: v })}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4">
                      <Button variant="save" onClick={saveDeliverySettings} className="min-w-[140px]">حفظ</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions">
                <Card>
                  <CardHeader><CardTitle className="text-lg">اشتراكات العملاء</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center py-12 space-y-3">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">إدارة اشتراكات العملاء الشهرية والسنوية</p>
                      <p className="text-xs text-muted-foreground">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Loyalty Tab */}
              <TabsContent value="loyalty">
                <Card>
                  <CardHeader><CardTitle className="text-lg">نقاط الولاء</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center py-12 space-y-3">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">نظام نقاط الولاء لمكافأة العملاء المتكررين</p>
                      <p className="text-xs text-muted-foreground">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Log Tab */}
              <TabsContent value="audit">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">سجل التدقيق</CardTitle>
                    <Button size="sm" variant="outline" onClick={fetchAuditLogs}>
                      <History className="h-4 w-4 me-1" />تحديث
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {auditLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <History className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">لا توجد سجلات حتى الآن</p>
                        <p className="text-xs text-muted-foreground">ستظهر هنا جميع التعديلات التي تتم على الإعدادات</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">التاريخ والوقت</TableHead>
                              <TableHead className="text-right">المستخدم</TableHead>
                              <TableHead className="text-right">الإجراء</TableHead>
                              <TableHead className="text-right">النوع</TableHead>
                              <TableHead className="text-right">التفاصيل</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.map((log: any) => (
                              <TableRow key={log.id}>
                                <TableCell className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString("ar-SA")}</TableCell>
                                <TableCell className="text-xs">{log.user_email || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={log.action === "حذف" ? "destructive" : log.action === "إضافة" ? "default" : "secondary"}>
                                    {log.action}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{log.entity_type}</TableCell>
                                <TableCell className="text-xs max-w-[200px] truncate">
                                  {log.details?.name || (Object.keys(log.details || {}).length > 0 ? JSON.stringify(log.details).slice(0, 60) : "—")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Order Stages Tab */}
              <TabsContent value="order_stages">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      إعدادات مراحل الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      حدد المدة الزمنية لكل مرحلة من مراحل الطلب. يتم تحويل الطلبات تلقائياً بين المراحل بناءً على هذه الإعدادات.
                    </p>

                    {/* Stage 1: Cleaning */}
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🟡</span>
                        <h3 className="font-bold text-foreground">قيد التنفيذ</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">المدة من تاريخ إصدار الفاتورة حتى تحويلها لـ "جاهزة للتسليم"</p>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={orderStageSettings.cleaningDays}
                          onChange={(e) => setOrderStageSettings(prev => ({ ...prev, cleaningDays: Number(e.target.value) || 1 }))}
                          className="w-24 text-center"
                        />
                        <span className="text-sm text-muted-foreground">يوم</span>
                      </div>
                    </div>

                    {/* Stage 2: Ready */}
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔵</span>
                        <h3 className="font-bold text-foreground">جاهزة للتسليم</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">المدة بعد انتهاء مرحلة التنفيذ حتى تحويلها لـ "المستودع"</p>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={orderStageSettings.readyDays}
                          onChange={(e) => setOrderStageSettings(prev => ({ ...prev, readyDays: Number(e.target.value) || 1 }))}
                          className="w-24 text-center"
                        />
                        <span className="text-sm text-muted-foreground">يوم</span>
                      </div>
                    </div>

                    {/* Stage 3: Warehouse */}
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📦</span>
                        <h3 className="font-bold text-foreground">في المستودع</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        تنتقل الطلبات تلقائياً للمستودع بعد {orderStageSettings.cleaningDays + orderStageSettings.readyDays} يوم من تاريخ الفاتورة
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <h4 className="font-bold text-foreground mb-2">ملخص المراحل:</h4>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>🟡 قيد التنفيذ: من اليوم 1 إلى اليوم {orderStageSettings.cleaningDays}</p>
                        <p>🔵 جاهزة للتسليم: من اليوم {orderStageSettings.cleaningDays + 1} إلى اليوم {orderStageSettings.cleaningDays + orderStageSettings.readyDays}</p>
                        <p>📦 المستودع: بعد اليوم {orderStageSettings.cleaningDays + orderStageSettings.readyDays}</p>
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        await saveOrderStageSettings(orderStageSettings);
                        toast.success("تم حفظ إعدادات مراحل الطلب");
                      }}
                      className="w-full"
                    >
                      حفظ الإعدادات
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{(editingBranch as any).id ? "تعديل الفرع" : "إضافة فرع جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">اسم الفرع *</label>
              <Input value={editingBranch.name} onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })} placeholder="مثال: الفرع الرئيسي" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">العنوان</label>
              <Input value={editingBranch.address} onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })} placeholder="عنوان الفرع" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">رقم الهاتف</label>
              <Input value={editingBranch.phone} onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })} placeholder="05xxxxxxxx" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">المدير المسؤول</label>
              <Input value={editingBranch.manager} onChange={(e) => setEditingBranch({ ...editingBranch, manager: e.target.value })} placeholder="اسم المدير" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">الفرع نشط</label>
              <Switch checked={editingBranch.is_active} onCheckedChange={(checked) => setEditingBranch({ ...editingBranch, is_active: checked })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveBranch} disabled={savingBranch}>
              {savingBranch && <Loader2 className="h-4 w-4 animate-spin me-1" />}حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{(editingPackage as any).id ? "تعديل الباقة" : "إضافة باقة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">اسم الباقة *</label>
              <Input value={editingPackage.name} onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })} placeholder="مثال: باقة 10 غسلات" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">الوصف</label>
              <Textarea value={editingPackage.description} onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })} placeholder="وصف الباقة" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">عدد القطع</label>
                <Input type="number" value={editingPackage.item_count} onChange={(e) => setEditingPackage({ ...editingPackage, item_count: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">السعر</label>
                <Input type="number" value={editingPackage.price} onChange={(e) => setEditingPackage({ ...editingPackage, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">الخصم %</label>
                <Input type="number" value={editingPackage.discount_percent} onChange={(e) => setEditingPackage({ ...editingPackage, discount_percent: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">نشط</label>
              <Switch checked={editingPackage.is_active} onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, is_active: checked })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSavePackage} disabled={savingPackage}>
              {savingPackage && <Loader2 className="h-4 w-4 animate-spin me-1" />}حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{(editingOffer as any).id ? "تعديل العرض" : "إضافة عرض جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">اسم العرض *</label>
              <Input value={editingOffer.name} onChange={(e) => setEditingOffer({ ...editingOffer, name: e.target.value })} placeholder="مثال: خصم الصيف" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">الوصف</label>
              <Textarea value={editingOffer.description} onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })} placeholder="وصف العرض" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">نوع الخصم</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingOffer.discount_type} onChange={(e) => setEditingOffer({ ...editingOffer, discount_type: e.target.value })}>
                  <option value="percentage">نسبة مئوية %</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">القيمة</label>
                <Input type="number" value={editingOffer.discount_value} onChange={(e) => setEditingOffer({ ...editingOffer, discount_value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تاريخ البداية</label>
                <Input type="date" value={editingOffer.start_date || ""} onChange={(e) => setEditingOffer({ ...editingOffer, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تاريخ النهاية</label>
                <Input type="date" value={editingOffer.end_date || ""} onChange={(e) => setEditingOffer({ ...editingOffer, end_date: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">نشط</label>
              <Switch checked={editingOffer.is_active} onCheckedChange={(checked) => setEditingOffer({ ...editingOffer, is_active: checked })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveOffer} disabled={savingOffer}>
              {savingOffer && <Loader2 className="h-4 w-4 animate-spin me-1" />}حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Region Dialog */}
      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{(editingRegion as any).id ? "تعديل المنطقة" : "إضافة منطقة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">اسم المنطقة *</label>
              <Input value={editingRegion.name} onChange={(e) => setEditingRegion({ ...editingRegion, name: e.target.value })} placeholder="مثال: حي السلام" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">رسوم التوصيل (ر.س)</label>
                <Input type="number" value={editingRegion.delivery_fee} onChange={(e) => setEditingRegion({ ...editingRegion, delivery_fee: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">الوقت المتوقع</label>
                <Input value={editingRegion.estimated_time} onChange={(e) => setEditingRegion({ ...editingRegion, estimated_time: e.target.value })} placeholder="مثال: 30-45 دقيقة" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">نشط</label>
              <Switch checked={editingRegion.is_active} onCheckedChange={(checked) => setEditingRegion({ ...editingRegion, is_active: checked })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRegionDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveRegion} disabled={savingRegion}>
              {savingRegion && <Loader2 className="h-4 w-4 animate-spin me-1" />}حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
