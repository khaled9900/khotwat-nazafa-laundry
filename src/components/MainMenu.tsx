import {
  Package, ShoppingCart, Users, Wallet, Building2,
  Search, FileText, BarChart3, Mail, Megaphone, Settings,
  LayoutDashboard, Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MenuSection {
  title: string;
  icon: React.ElementType;
  items: { label: string; route: string }[];
}

const sections: MenuSection[] = [
  {
    title: "الاصناف والخدمات",
    icon: Package,
    items: [
      { label: "مجموعات الاصناف", route: "/products/groups" },
      { label: "الأصناف", route: "/products/items" },
      { label: "قوائم الأسعار", route: "/products/prices" },
      { label: "الخدمات", route: "/products/services" },
      { label: "إضافات الأصناف", route: "/products/additions" },
      { label: "طباعة الأسعار", route: "/products/print-prices" },
    ],
  },
  {
    title: "نقاط البيع",
    icon: ShoppingCart,
    items: [
      { label: "الطلبات", route: "/pos/orders" },
      { label: "إلغاء الطلب", route: "/pos/cancel" },
      { label: "إدارة العملاء", route: "/pos/customers" },
      { label: "جرد الملابس", route: "/pos/inventory" },
      { label: "تنظيف الطلبات", route: "/pos/clean" },
      { label: "الجمعية", route: "/pos/association" },
      { label: "تسليم الصندوق", route: "/pos/cashbox" },
    ],
  },
  {
    title: "المصروفات",
    icon: Wallet,
    items: [
      { label: "المصروفات", route: "/expenses/list" },
      { label: "مجموعات المصروفات", route: "/expenses/groups" },
      { label: "سندات الصرف", route: "/expenses/vouchers" },
      { label: "المصروفات الشهرية", route: "/expenses/monthly" },
      { label: "كشف حساب المصروفات", route: "/expenses/statement" },
    ],
  },
  {
    title: "البنوك",
    icon: Building2,
    items: [
      { label: "بيانات البنوك", route: "/banks/list" },
      { label: "حركات البنوك", route: "/banks/transactions" },
      { label: "كشف حساب بنك", route: "/banks/statement" },
    ],
  },
  {
    title: "الإستعلام",
    icon: Search,
    items: [
      { label: "بحث شامل للفواتير", route: "/search/invoices" },
      { label: "الحساب العام للإشتراكات", route: "/search/subscriptions" },
      { label: "سجل النظام", route: "/search/logs" },
    ],
  },
  {
    title: "التقارير",
    icon: FileText,
    items: [
      { label: "أرصدة العملاء", route: "/reports/balances" },
      { label: "تقرير حسابات الصندوق", route: "/reports/cashbox" },
      { label: "الحركة اليومية للمغسلة", route: "/reports/daily" },
      { label: "طلبات مدفوعة لمستخدم", route: "/reports/paid-orders" },
      { label: "مبيعات مستخدم", route: "/reports/user-sales" },
      { label: "تجديدات مستخدم", route: "/reports/user-renewals" },
    ],
  },
  {
    title: "شؤون الموظفين",
    icon: Users,
    items: [
      { label: "الموظفين", route: "/employees/list" },
      { label: "أقسام الموظفين", route: "/employees/departments" },
      { label: "جنسيات الموظفين", route: "/employees/nationalities" },
      { label: "إجراء الخصم والإضافة", route: "/employees/deductions" },
      { label: "إعداد الراتب الشهري", route: "/employees/salary" },
      { label: "كشف إجراء الموظف", route: "/employees/actions" },
    ],
  },
  {
    title: "إحصائيات ورسوم بيانية",
    icon: BarChart3,
    items: [
      { label: "إجمالي التجديدات شهرياً", route: "/stats/monthly-renewals" },
      { label: "إجمالي الفواتير شهرياً", route: "/stats/monthly-invoices" },
      { label: "مبالغ الخصومات اليومية خلال شهر", route: "/stats/daily-discounts" },
      { label: "مبالغ الخصومات الشهرية خلال سنة", route: "/stats/monthly-discounts" },
      { label: "التجديدات اليومية خلال شهر", route: "/stats/daily-renewals" },
      { label: "التجديدات الشهرية خلال سنة", route: "/stats/monthly-renewals-year" },
      { label: "كميات الاصناف شهرياً", route: "/stats/monthly-items" },
      { label: "كميات الاصناف سنوياً", route: "/stats/yearly-items" },
    ],
  },
  {
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    items: [
      { label: "بيانات المنشأة", route: "/dashboard/company" },
      { label: "بيانات الفروع", route: "/dashboard/branches" },
      { label: "إدارة المستخدمين", route: "/dashboard/users" },
      { label: "إدارة الصلاحيات", route: "/dashboard/permissions" },
    ],
  },
  {
    title: "الإعدادات",
    icon: Settings,
    items: [
      { label: "الطبعات", route: "/settings/prints" },
      { label: "العملاء والإشتراكات", route: "/settings/customers" },
      { label: "الباقات", route: "/settings/packages" },
      { label: "العروض", route: "/settings/offers" },
      { label: "نقاط الولاء", route: "/settings/loyalty" },
      { label: "المناطق", route: "/settings/regions" },
      { label: "أوقات التوصيل", route: "/settings/delivery-times" },
    ],
  },
  {
    title: "الإشعارات",
    icon: Bell,
    items: [
      { label: "إرسالة الفاتورة على الواتس اب", route: "/notifications/whatsapp" },
      { label: "إرسال الفاتورة برسالة نصية", route: "/notifications/sms" },
      { label: "إرسال جاهزية الفاتورة برسالة نصية", route: "/notifications/ready-sms" },
      { label: "إرسال الفاتورة عبر البريد الإلكتروني", route: "/notifications/email" },
    ],
  },
  {
    title: "الرسائل",
    icon: Mail,
    items: [
      { label: "إرسال الرسائل النصية", route: "/messages/send" },
      { label: "إستعلام الرسائل", route: "/messages/query" },
      { label: "رصيدي", route: "/messages/balance" },
    ],
  },
];

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-8 text-center">القائمة الرئيسية</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sections.map((section) => (
            <div key={section.title} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                <section.icon className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm text-foreground">{section.title}</h2>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.route}
                    onClick={() => navigate(item.route)}
                    className="block w-full text-right text-xs text-primary hover:text-primary/80 hover:underline py-0.5 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
