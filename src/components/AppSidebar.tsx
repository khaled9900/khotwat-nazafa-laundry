import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Building2,
  Search,
  FileText,
  BarChart3,
  Mail,
  Megaphone,
  Settings,
  LayoutDashboard,
  ChevronDown,
  Menu,
  X,
  Warehouse,
  Brain,
  Clock,
  PackageCheck,
  ArrowLeftCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface MenuChild {
  labelKey: string;
  route: string;
  adminOnly?: boolean;
}

interface MenuItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  route?: string;
  children?: MenuChild[];
  adminOnly?: boolean;
  hasTransition?: "cleaning_to_ready" | "ready_to_warehouse";
}

const menuItems: MenuItem[] = [
  { id: "home", labelKey: "home", icon: Home, route: "/" },
  { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, route: "/dashboard" },
  { id: "summary", labelKey: "business_summary", icon: BarChart3, route: "/summary" },
  {
    id: "products",
    labelKey: "products_services",
    icon: Package,
    adminOnly: true,
    children: [
      { labelKey: "product_groups", route: "/products/groups" },
      { labelKey: "products", route: "/products/items" },
      { labelKey: "price_lists", route: "/products/prices" },
      { labelKey: "services", route: "/products/services" },
      { labelKey: "product_additions", route: "/products/additions" },
      { labelKey: "print_prices", route: "/products/print-prices" },
    ],
  },
  {
    id: "pos",
    labelKey: "pos_customers",
    icon: ShoppingCart,
    adminOnly: true,
    children: [
      { labelKey: "orders", route: "/pos/orders" },
      { labelKey: "cancel_order", route: "/pos/cancel" },
      { labelKey: "customer_management", route: "/pos/customers" },
      { labelKey: "inventory", route: "/pos/inventory" },
      { labelKey: "clean_orders", route: "/pos/clean" },
      { labelKey: "association", route: "/pos/association" },
      { labelKey: "cashbox_delivery", route: "/pos/cashbox" },
    ],
  },
  {
    id: "employees",
    labelKey: "employees",
    icon: Users,
    adminOnly: true,
    children: [
      { labelKey: "employee_list", route: "/employees/list" },
      { labelKey: "departments", route: "/employees/departments" },
      { labelKey: "nationalities", route: "/employees/nationalities" },
      { labelKey: "deductions", route: "/employees/deductions" },
      { labelKey: "monthly_salary", route: "/employees/salary" },
      { labelKey: "employee_actions", route: "/employees/actions" },
    ],
  },
  {
    id: "expenses",
    labelKey: "expenses",
    icon: Wallet,
    adminOnly: true,
    children: [
      { labelKey: "expense_list", route: "/expenses/list" },
      { labelKey: "expense_groups", route: "/expenses/groups" },
      { labelKey: "expense_vouchers", route: "/expenses/vouchers" },
      { labelKey: "monthly_expenses", route: "/expenses/monthly" },
      { labelKey: "expense_statement", route: "/expenses/statement" },
    ],
  },
  {
    id: "banks",
    labelKey: "banks",
    icon: Building2,
    adminOnly: true,
    children: [
      { labelKey: "bank_data", route: "/banks/list" },
      { labelKey: "bank_transactions", route: "/banks/transactions" },
      { labelKey: "bank_statement", route: "/banks/statement" },
    ],
  },
  {
    id: "search",
    labelKey: "search_inquiry",
    icon: Search,
    adminOnly: true,
    children: [
      { labelKey: "search_invoices", route: "/search/invoices" },
      { labelKey: "subscriptions_account", route: "/search/subscriptions" },
      { labelKey: "system_log", route: "/search/logs" },
    ],
  },
  {
    id: "reports",
    labelKey: "reports",
    icon: FileText,
    adminOnly: true,
    children: [
      { labelKey: "customer_balances", route: "/reports/balances" },
      { labelKey: "cashbox_report", route: "/reports/cashbox" },
      { labelKey: "daily_activity", route: "/reports/daily" },
      { labelKey: "paid_orders_user", route: "/reports/paid-orders" },
      { labelKey: "user_sales", route: "/reports/user-sales" },
      { labelKey: "user_renewals", route: "/reports/user-renewals" },
    ],
  },
  {
    id: "stats",
    labelKey: "stats_charts",
    icon: BarChart3,
    adminOnly: true,
    children: [
      { labelKey: "monthly_renewals", route: "/stats/monthly-renewals" },
      { labelKey: "monthly_invoices", route: "/stats/monthly-invoices" },
      { labelKey: "daily_discounts", route: "/stats/daily-discounts" },
      { labelKey: "monthly_items", route: "/stats/monthly-items" },
      { labelKey: "yearly_items", route: "/stats/yearly-items" },
    ],
  },
  {
    id: "messages",
    labelKey: "messages",
    icon: Mail,
    adminOnly: true,
    children: [
      { labelKey: "send_sms", route: "/messages/send" },
      { labelKey: "query_messages", route: "/messages/query" },
      { labelKey: "my_balance", route: "/messages/balance" },
    ],
  },
  { id: "cleaning-orders", labelKey: "cleaning_orders", icon: Clock, route: "/orders/cleaning", hasTransition: "cleaning_to_ready" as const },
  { id: "ready-orders", labelKey: "ready_orders", icon: PackageCheck, route: "/orders/ready", hasTransition: "ready_to_warehouse" as const },
  { id: "warehouse", labelKey: "warehouse", icon: Warehouse, route: "/warehouse" },
  { id: "ai-analysis", labelKey: "ai_analysis", icon: Brain, route: "/ai/sales-analysis", adminOnly: true },
  { id: "marketing", labelKey: "marketing_tools", icon: Megaphone, route: "/marketing", adminOnly: true },
  {
    id: "settings",
    labelKey: "settings",
    icon: Settings,
    adminOnly: true,
    children: [
      { labelKey: "general_settings", route: "/settings/general" },
      { labelKey: "prints", route: "/settings/prints" },
      { labelKey: "customers_subscriptions", route: "/settings/customers" },
      { labelKey: "packages", route: "/settings/packages" },
      { labelKey: "offers", route: "/settings/offers" },
      { labelKey: "loyalty_points", route: "/settings/loyalty" },
      { labelKey: "regions", route: "/settings/regions" },
      { labelKey: "delivery_times", route: "/settings/delivery-times" },
    ],
  },
  {
    id: "control_panel",
    labelKey: "control_panel",
    icon: LayoutDashboard,
    adminOnly: true,
    children: [
      { labelKey: "company_data", route: "/dashboard/company" },
      { labelKey: "branch_data", route: "/dashboard/branches" },
      { labelKey: "user_management", route: "/dashboard/users" },
      { labelKey: "user_branches", route: "/dashboard/user-branches" },
      { labelKey: "permissions", route: "/dashboard/permissions" },
    ],
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ isOpen, onToggle }: AppSidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: "cleaning_to_ready" | "ready_to_warehouse" | null; count: number }>({ open: false, type: null, count: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { role } = useAuth();

  const isAdmin = role === "admin";

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => isAdmin || !item.adminOnly)
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => isAdmin || !child.adminOnly),
      }))
      .filter((item) => item.route || (item.children && item.children.length > 0));
  }, [isAdmin]);

  const isActiveRoute = (route?: string) => Boolean(route && location.pathname === route);
  const isActiveGroup = (item: MenuItem) => Boolean(item.children?.some((child) => location.pathname === child.route));

  useEffect(() => {
    const activeGroupIds = filteredMenuItems.filter((item) => isActiveGroup(item)).map((item) => item.id);
    if (activeGroupIds.length === 0) return;

    setExpandedItems((prev) => Array.from(new Set([...prev, ...activeGroupIds])));
  }, [location.pathname, filteredMenuItems]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const closeOnMobileAfterNavigate = () => {
    if (window.innerWidth < 768 && isOpen) onToggle();
  };

  const handleClick = (item: MenuItem) => {
    if (item.children) {
      if (!isOpen) onToggle();
      toggleExpand(item.id);
      return;
    }

    if (item.route) {
      navigate(item.route);
      closeOnMobileAfterNavigate();
    }
  };

  const handleTransitionClick = async (type: "cleaning_to_ready" | "ready_to_warehouse", e: React.MouseEvent) => {
    e.stopPropagation();
    const fromStatus = type === "cleaning_to_ready" ? "cleaning" : "ready";

    const { data } = await supabase
      .from("invoices")
      .select("id")
      .eq("status", fromStatus);

    if (!data || data.length === 0) {
      toast.info("لا توجد طلبات للترحيل");
      return;
    }

    setConfirmDialog({ open: true, type, count: data.length });
  };

  const executeTransition = async () => {
    if (!confirmDialog.type) return;
    const fromStatus = confirmDialog.type === "cleaning_to_ready" ? "cleaning" : "ready";
    const toStatus = confirmDialog.type === "cleaning_to_ready" ? "ready" : "warehouse";
    const label = confirmDialog.type === "cleaning_to_ready" ? "جاهزة للتسليم" : "المستودع";

    const { error } = await supabase
      .from("invoices")
      .update({ status: toStatus, status_updated_at: new Date().toISOString() })
      .eq("status", fromStatus);

    if (!error) {
      toast.success(`تم ترحيل ${confirmDialog.count} طلب إلى ${label}`);
    } else {
      toast.error("حدث خطأ أثناء الترحيل");
    }
    setConfirmDialog({ open: false, type: null, count: 0 });
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-foreground/20 z-40 md:hidden" onClick={onToggle} />}

      <aside
        className={`fixed md:sticky top-0 right-0 h-screen z-50 md:z-auto bg-card border-s border-border flex flex-col transition-all duration-200 shrink-0 ${
          isOpen ? "w-64" : "w-0 md:w-12"
        } overflow-hidden`}
      >
        <div className="flex items-center justify-between p-2 border-b border-border shrink-0">
          {isOpen && <span className="text-sm font-bold text-foreground pr-2">{t("main_menu")}</span>}
          <button onClick={onToggle} className="h-8 w-8 rounded flex items-center justify-center hover:bg-secondary transition-colors shrink-0">
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-1">
          {filteredMenuItems.map((item) => {
            const groupActive = isActiveGroup(item);
            const directActive = isActiveRoute(item.route);
            const itemActive = directActive || groupActive;

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleClick(item)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary/60 ${
                    itemActive ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                  } ${!isOpen ? "justify-center px-0" : ""}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {isOpen && (
                    <>
                      <span className="flex-1 text-start text-xs">{t(item.labelKey)}</span>
                      {item.hasTransition && (
                        <button
                          onClick={(e) => handleTransitionClick(item.hasTransition!, e)}
                          className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                          title={item.hasTransition === "cleaning_to_ready" ? "ترحيل الكل لجاهزة للتسليم" : "ترحيل الكل للمستودع"}
                        >
                          <ArrowLeftCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {item.children && (
                        <ChevronDown className={`h-3 w-3 transition-transform ${expandedItems.includes(item.id) ? "rotate-180" : ""}`} />
                      )}
                    </>
                  )}
                </button>

                {isOpen && item.children && expandedItems.includes(item.id) && (
                  <div className="bg-secondary/30 border-b border-border">
                    {item.children.map((child) => (
                      <button
                        key={child.route}
                        onClick={() => {
                          navigate(child.route);
                          closeOnMobileAfterNavigate();
                        }}
                        className={`w-full text-start px-8 py-1.5 text-xs transition-colors hover:bg-secondary/60 hover:text-primary ${
                          isActiveRoute(child.route) ? "text-primary font-bold bg-secondary/50" : "text-muted-foreground"
                        }`}
                      >
                        {t(child.labelKey)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, count: 0 })}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الترحيل</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "cleaning_to_ready"
                ? `هل تريد ترحيل ${confirmDialog.count} طلب من "قيد التنفيذ" إلى "جاهزة للتسليم"؟`
                : `هل تريد ترحيل ${confirmDialog.count} طلب من "جاهزة للتسليم" إلى "المستودع"؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={executeTransition}>تأكيد الترحيل</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppSidebar;
