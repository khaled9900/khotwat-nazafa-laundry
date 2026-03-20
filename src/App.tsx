import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BranchSelectPage from "./pages/BranchSelectPage";
import DashboardPage from "./pages/DashboardPage";
import MainMenuPage from "./pages/MainMenuPage";
import ProductsPage from "./pages/ProductsPage";
import AllReportsPage from "./pages/AllReportsPage";
import CustomersPage from "./pages/CustomersPage";
import ExpensesPage from "./pages/ExpensesPage";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UsersPage from "./pages/UsersPage";
import UserBranchesPage from "./pages/UserBranchesPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import SummaryPage from "./pages/SummaryPage";
import DailyReportPage from "./pages/DailyReportPage";
import PosPage from "./pages/PosPage";
import StatsPage from "./pages/StatsPage";
import EmployeesPage from "./pages/EmployeesPage";
import BanksPage from "./pages/BanksPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPageWrapper from "./pages/NotificationsPage";
import MarketingPage from "./pages/MarketingPage";
import SearchPage from "./pages/SearchPage";
import WarehousePage from "./pages/WarehousePage";
import SalesAnalysisPage from "./pages/SalesAnalysisPage";
import CleaningOrdersPage from "./pages/CleaningOrdersPage";
import ReadyOrdersPage from "./pages/ReadyOrdersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30 seconds
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BranchProvider>
        <ProductsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/branches" element={<ProtectedRoute><BranchSelectPage /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute requireAdmin><MainMenuPage /></ProtectedRoute>} />
            <Route path="/products/items" element={<ProtectedRoute requireAdmin><ProductsPage /></ProtectedRoute>} />
            
            {/* POS routes */}
            <Route path="/pos/orders" element={<ProtectedRoute requireAdmin><PosPage /></ProtectedRoute>} />
            <Route path="/pos/cancel" element={<ProtectedRoute requireAdmin><PosPage /></ProtectedRoute>} />
            <Route path="/pos/customers" element={<ProtectedRoute requireAdmin><CustomersPage /></ProtectedRoute>} />
            <Route path="/pos/inventory" element={<ProtectedRoute requireAdmin><PosPage /></ProtectedRoute>} />
            <Route path="/pos/clean" element={<ProtectedRoute requireAdmin><PosPage /></ProtectedRoute>} />
            <Route path="/pos/association" element={<ProtectedRoute requireAdmin><PosPage /></ProtectedRoute>} />
            <Route path="/pos/cashbox" element={<ProtectedRoute requireAdmin><PosPage /></ProtectedRoute>} />
            
            {/* Employees routes */}
            <Route path="/employees/list" element={<ProtectedRoute requireAdmin><EmployeesPage /></ProtectedRoute>} />
            <Route path="/employees/departments" element={<ProtectedRoute requireAdmin><EmployeesPage /></ProtectedRoute>} />
            <Route path="/employees/nationalities" element={<ProtectedRoute requireAdmin><EmployeesPage /></ProtectedRoute>} />
            <Route path="/employees/deductions" element={<ProtectedRoute requireAdmin><EmployeesPage /></ProtectedRoute>} />
            <Route path="/employees/salary" element={<ProtectedRoute requireAdmin><EmployeesPage /></ProtectedRoute>} />
            <Route path="/employees/actions" element={<ProtectedRoute requireAdmin><EmployeesPage /></ProtectedRoute>} />
            
            {/* Banks routes */}
            <Route path="/banks/list" element={<ProtectedRoute requireAdmin><BanksPage /></ProtectedRoute>} />
            <Route path="/banks/transactions" element={<ProtectedRoute requireAdmin><BanksPage /></ProtectedRoute>} />
            <Route path="/banks/statement" element={<ProtectedRoute requireAdmin><BanksPage /></ProtectedRoute>} />
            
            {/* Reports routes */}
            <Route path="/reports/daily" element={<ProtectedRoute requireAdmin><DailyReportPage /></ProtectedRoute>} />
            <Route path="/reports/balances" element={<ProtectedRoute requireAdmin><AllReportsPage /></ProtectedRoute>} />
            <Route path="/reports/cashbox" element={<ProtectedRoute requireAdmin><AllReportsPage /></ProtectedRoute>} />
            <Route path="/reports/paid-orders" element={<ProtectedRoute requireAdmin><AllReportsPage /></ProtectedRoute>} />
            <Route path="/reports/user-sales" element={<ProtectedRoute requireAdmin><AllReportsPage /></ProtectedRoute>} />
            <Route path="/reports/user-renewals" element={<ProtectedRoute requireAdmin><AllReportsPage /></ProtectedRoute>} />
            
            {/* Stats routes */}
            <Route path="/stats/monthly-invoices" element={<ProtectedRoute requireAdmin><AllReportsPage /></ProtectedRoute>} />
            <Route path="/stats/monthly-renewals" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            <Route path="/stats/daily-discounts" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            <Route path="/stats/monthly-discounts" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            <Route path="/stats/daily-renewals" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            <Route path="/stats/monthly-renewals-year" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            <Route path="/stats/monthly-items" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            <Route path="/stats/yearly-items" element={<ProtectedRoute requireAdmin><StatsPage /></ProtectedRoute>} />
            
            {/* Expenses */}
            <Route path="/expenses/list" element={<ProtectedRoute requireAdmin><ExpensesPage /></ProtectedRoute>} />
            <Route path="/expenses/vouchers" element={<ProtectedRoute requireAdmin><ExpensesPage /></ProtectedRoute>} />
            <Route path="/expenses/groups" element={<ProtectedRoute requireAdmin><ExpensesPage /></ProtectedRoute>} />
            <Route path="/expenses/monthly" element={<ProtectedRoute requireAdmin><ExpensesPage /></ProtectedRoute>} />
            <Route path="/expenses/statement" element={<ProtectedRoute requireAdmin><ExpensesPage /></ProtectedRoute>} />
            
            {/* Messages routes */}
            <Route path="/messages/send" element={<ProtectedRoute requireAdmin><MessagesPage /></ProtectedRoute>} />
            <Route path="/messages/query" element={<ProtectedRoute requireAdmin><MessagesPage /></ProtectedRoute>} />
            <Route path="/messages/balance" element={<ProtectedRoute requireAdmin><MessagesPage /></ProtectedRoute>} />
            
            {/* Notifications routes */}
            <Route path="/notifications/whatsapp" element={<ProtectedRoute requireAdmin><NotificationsPageWrapper /></ProtectedRoute>} />
            <Route path="/notifications/sms" element={<ProtectedRoute requireAdmin><NotificationsPageWrapper /></ProtectedRoute>} />
            <Route path="/notifications/ready-sms" element={<ProtectedRoute requireAdmin><NotificationsPageWrapper /></ProtectedRoute>} />
            <Route path="/notifications/email" element={<ProtectedRoute requireAdmin><NotificationsPageWrapper /></ProtectedRoute>} />
            
            {/* Orders by status */}
            <Route path="/orders/cleaning" element={<ProtectedRoute><CleaningOrdersPage /></ProtectedRoute>} />
            <Route path="/orders/ready" element={<ProtectedRoute><ReadyOrdersPage /></ProtectedRoute>} />
            
            {/* Warehouse */}
            <Route path="/warehouse" element={<ProtectedRoute><WarehousePage /></ProtectedRoute>} />
            
            {/* Marketing */}
            <Route path="/marketing" element={<ProtectedRoute requireAdmin><MarketingPage /></ProtectedRoute>} />
            
            {/* AI Analysis */}
            <Route path="/ai/sales-analysis" element={<ProtectedRoute requireAdmin><SalesAnalysisPage /></ProtectedRoute>} />
            
            {/* Search routes */}
            <Route path="/search/invoices" element={<ProtectedRoute requireAdmin><SearchPage /></ProtectedRoute>} />
            <Route path="/search/subscriptions" element={<ProtectedRoute requireAdmin><SearchPage /></ProtectedRoute>} />
            <Route path="/search/logs" element={<ProtectedRoute requireAdmin><SearchPage /></ProtectedRoute>} />
            
            {/* Settings */}
            <Route path="/settings/general" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/invoice" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/prints" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/customers" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/packages" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/offers" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/loyalty" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/regions" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/delivery-times" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            
            {/* Dashboard */}
            <Route path="/dashboard/company" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/branches" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
            <Route path="/dashboard/user-branches" element={<ProtectedRoute requireAdmin><UserBranchesPage /></ProtectedRoute>} />
            
            {/* Summary */}
            <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
            
            {/* Coming Soon - remaining product sub-pages */}
            <Route path="/products/groups" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            <Route path="/products/prices" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            <Route path="/products/services" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            <Route path="/products/additions" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            <Route path="/products/print-prices" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            <Route path="/dashboard/*" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            <Route path="/settings/*" element={<ProtectedRoute requireAdmin><ComingSoonPage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProductsProvider>
      </BranchProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
