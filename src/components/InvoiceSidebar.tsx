import { Minus, Plus, Trash2, X, Percent, Clock, FileText, MessageSquare, Printer, Search, ChevronDown, Ruler, CalendarDays, Star, Gift, User, Phone, MapPin, Truck } from "lucide-react";
import type { CartItem } from "@/data/products";
import { useState, useEffect, useRef } from "react";
import ThermalReceipt from "@/components/ThermalReceipt";
import A4Invoice from "@/components/A4Invoice";
import { saveInvoice } from "@/hooks/useInvoices";
import { generateInvoiceNumber } from "@/utils/invoiceNumberGenerator";
import { getLoyaltyConfig, getCustomerPoints, earnPoints, redeemPoints, type LoyaltyConfig } from "@/hooks/useLoyalty";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  code: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface InvoiceSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSaveInvoice: () => void;
  onUpdateItemDimensions: (id: string, field: 'itemLength' | 'itemWidth' | 'meters', value: number) => void;
  onUpdateItemNotes: (id: string, notes: string) => void;
}

const DEFAULT_VAT_RATE = 0.15;

const InvoiceSidebar = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSaveInvoice,
  onUpdateItemDimensions,
  onUpdateItemNotes,
}: InvoiceSidebarProps) => {
  const { t } = useTranslation();
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [sendSMS, setSendSMS] = useState(true);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("الدفع عند الإستلام");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showA4, setShowA4] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [receiptData, setReceiptData] = useState<{
    cart: CartItem[];
    subtotal: number;
    discount: number;
    discountPercent: number;
    vat: number;
    total: number;
    customerName: string;
    customerCode: number | null;
    paymentMethod: string;
    deliveryDate: string;
  } | null>(null);

  // Customer selection state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const driverDropdownRef = useRef<HTMLDivElement>(null);

  // Drivers state
  const [drivers, setDrivers] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  // Loyalty state
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  // Tax rate from settings
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);

  // Load loyalty config + invoice settings
  useEffect(() => {
    getLoyaltyConfig().then(setLoyaltyConfig);
    // Load tax rate from settings
    import("@/utils/invoiceNumberGenerator").then(({ getInvoicePageSettings }) => {
      getInvoicePageSettings().then((s) => {
        setVatRate(s.taxRate / 100);
      });
    });
  }, []);

  // Load customer points when selected
  useEffect(() => {
    if (selectedCustomer) {
      getCustomerPoints(selectedCustomer.id).then(setCustomerPoints);
    } else {
      setCustomerPoints(0);
      setPointsToRedeem(0);
      setLoyaltyDiscount(0);
    }
  }, [selectedCustomer]);

  const handleRedeemPoints = async () => {
    if (!selectedCustomer || !loyaltyConfig || pointsToRedeem <= 0) return;
    const result = await redeemPoints(selectedCustomer.id, pointsToRedeem, loyaltyConfig);
    if (result.success) {
      setLoyaltyDiscount(result.discountAmount);
      setCustomerPoints((prev) => prev - pointsToRedeem);
      toast.success(`🎁 ${result.message}`);
    } else {
      toast.error(result.message);
    }
  };

  // Load customers
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from("customers").select("id, code, name, phone, email, address").order("name");
      if (data) setCustomers(data as Customer[]);
    };
    const fetchDrivers = async () => {
      const { data } = await supabase.from("drivers").select("id, name, phone").eq("is_active", true).order("name");
      if (data) setDrivers(data);
    };
    fetchCustomers();
    fetchDrivers();
  }, []);

  // Filter customers based on search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(customers);
    } else {
      const q = customerSearch.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            String(c.code).includes(q)
        )
      );
    }
  }, [customerSearch, customers]);

  // Filter drivers
  useEffect(() => {
    if (!driverName.trim()) {
      setFilteredDrivers(drivers);
    } else {
      const q = driverName.toLowerCase();
      setFilteredDrivers(drivers.filter((d) => d.name.toLowerCase().includes(q)));
    }
  }, [driverName, drivers]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(e.target as Node)) {
        setShowDriverDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomerPhone(customer.phone || "");
    setDeliveryAddress(customer.address || "");
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomerPhone("");
  };

  const addNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }
    if (newCustomerPhone && !/^5\d{8}$/.test(newCustomerPhone)) {
      toast.error("رقم الجوال يجب أن يبدأ بـ 5 ويكون 9 أرقام");
      return;
    }
    try {
      const { data, error } = await supabase.from("customers").insert({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
      }).select("id, code, name, phone, email, address").single();
      if (error) throw error;
      if (data) {
        setCustomers(prev => [...prev, data as Customer]);
        selectCustomer(data as Customer);
        setShowAddCustomer(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
        toast.success("تم إضافة العميل بنجاح ✅");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطأ في إضافة العميل");
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const meters = (item.itemLength || 0) * (item.itemWidth || 0);
    if (meters > 0 && item.price_per_meter) {
      return sum + item.price_per_meter * meters * item.quantity;
    }
    if (meters > 0) {
      return sum + item.price * meters * item.quantity;
    }
    return sum + item.price * item.quantity;
  }, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discount - loyaltyDiscount;
  const vat = afterDiscount * vatRate;
  const total = afterDiscount + vat + deliveryFee;

  return (
    <div className="w-[340px] flex flex-col bg-card border-e border-border h-full shrink-0">
      {/* Customer search */}
      <div className="p-3 border-b border-border" ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              placeholder={t("search_customer")}
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                  setSelectedCustomer(null);
                }
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            {selectedCustomer && (
              <button
                onClick={clearCustomer}
                className="absolute top-1/2 -translate-y-1/2 end-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Customer dropdown */}
            {showCustomerDropdown && (
              <div className="absolute top-full mt-1 start-0 end-0 bg-card border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                    {t("no_customers")}
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      className={`w-full text-start px-3 py-2 text-sm hover:bg-secondary/60 transition-colors border-b border-border last:border-0 ${
                        selectedCustomer?.id === customer.id ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      <div className="font-medium text-xs flex items-center gap-1.5">
                        <span className="font-mono text-primary bg-primary/10 px-1 rounded text-[10px]">{customer.code}</span>
                        {customer.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        {customer.phone && <span>📱 {customer.phone}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="bg-accent text-accent-foreground px-3 py-1.5 rounded text-sm font-bold hover:bg-accent/90 transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("add")}
          </button>
        </div>
        {/* Selected customer details */}
        {selectedCustomer && (
          <div className="mt-2 p-2.5 bg-primary/5 rounded-lg border border-primary/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">{t("customer")} #{selectedCustomer.code}</span>
              <button onClick={clearCustomer} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{selectedCustomer.name}</span>
            </div>
            {selectedCustomer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground" dir="ltr">{selectedCustomer.phone}</span>
              </div>
            )}
            {selectedCustomer.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground">{selectedCustomer.address}</span>
              </div>
            )}
          </div>
        )}
        {/* Loyalty Points */}
        {selectedCustomer && loyaltyConfig?.is_active && (
          <div className="mt-1.5 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-amber-700">نقاط الولاء</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{customerPoints} نقطة</span>
            </div>
            {customerPoints >= (loyaltyConfig?.min_redeem_points || 50) && (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={loyaltyConfig.min_redeem_points}
                  max={customerPoints}
                  value={pointsToRedeem || ""}
                  onChange={(e) => setPointsToRedeem(Math.min(Number(e.target.value), customerPoints))}
                  placeholder={`أدخل النقاط (حد أدنى ${loyaltyConfig.min_redeem_points})`}
                  className="flex-1 border border-amber-500/30 rounded px-2 py-1 text-xs bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
                <button
                  onClick={handleRedeemPoints}
                  disabled={pointsToRedeem < loyaltyConfig.min_redeem_points}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Gift className="h-3 w-3" />
                  استبدال
                </button>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-bold">🎁 خصم الولاء</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-600">-{loyaltyDiscount.toFixed(2)} ر.س</span>
                  <button onClick={() => { setLoyaltyDiscount(0); setPointsToRedeem(0); }} className="text-destructive hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              كل {(1 / loyaltyConfig.points_per_riyal).toFixed(0)} ر.س = {1} نقطة • كل {(1 / loyaltyConfig.riyal_per_point).toFixed(0)} نقطة = {1} ر.س خصم
            </p>
          </div>
        )}
        {/* Add Customer Dialog */}
        {showAddCustomer && (
          <div className="mt-2 p-2.5 bg-secondary/50 rounded-md border border-border space-y-2">
            <p className="text-xs font-bold text-foreground">إضافة عميل جديد</p>
            <input
              type="text"
              placeholder="اسم العميل *"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              autoFocus
            />
             <div>
              <input
                type="tel"
                placeholder="رقم الجوال (9 أرقام تبدأ بـ 5)"
                value={newCustomerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setNewCustomerPhone(val);
                }}
                maxLength={9}
                className={`w-full border rounded px-2.5 py-1.5 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 ${
                  newCustomerPhone && !/^5\d{8}$/.test(newCustomerPhone) ? 'border-destructive' : 'border-border'
                }`}
                dir="ltr"
              />
              {newCustomerPhone && !/^5\d{8}$/.test(newCustomerPhone) && (
                <p className="text-[10px] text-destructive mt-0.5">يجب أن يبدأ بـ 5 ويكون 9 أرقام</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addNewCustomer}
                className="flex-1 bg-primary text-primary-foreground py-1.5 rounded text-xs font-bold hover:bg-primary/90"
              >
                حفظ
              </button>
              <button
                onClick={() => { setShowAddCustomer(false); setNewCustomerName(""); setNewCustomerPhone(""); }}
                className="flex-1 bg-secondary text-secondary-foreground py-1.5 rounded text-xs font-bold hover:bg-secondary/80"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Urgent + price list */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border text-sm">
        <span className="text-muted-foreground">{t("price_list_basic")}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">{t("urgent")}</span>
          <button
            onClick={() => setIsUrgent(!isUrgent)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              isUrgent ? "bg-accent" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-all ${
                isUrgent ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cart Items - scrollable area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <FileText className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">{t("no_items")}</p>
            <p className="text-xs mt-1">{t("select_items")}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded bg-background border border-border text-sm animate-scale-in"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-xs truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(() => {
                        const m = (item.itemLength || 0) * (item.itemWidth || 0);
                        const unitPrice = (m > 0 && item.price_per_meter) ? item.price_per_meter : item.price;
                        if (m > 0) {
                          return `${unitPrice.toFixed(2)} × ${m.toFixed(1)}م² × ${item.quantity}`;
                        }
                        return `${item.price.toFixed(2)} × ${item.quantity}`;
                      })()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {(() => {
                      const m = (item.itemLength || 0) * (item.itemWidth || 0);
                      const unitPrice = (m > 0 && item.price_per_meter) ? item.price_per_meter : item.price;
                      if (m > 0) return (unitPrice * m * item.quantity).toFixed(2);
                      return (item.price * item.quantity).toFixed(2);
                    })()}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="h-6 w-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="h-6 w-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="h-6 w-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {/* Dimension fields - mandatory */}
                <div className="flex flex-col gap-1 mt-1.5">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Ruler className="h-3 w-3 text-muted-foreground shrink-0" />
                    <input
                      type="number"
                      placeholder="طول *"
                      value={item.itemLength || ""}
                      onChange={(e) => {
                        const len = parseFloat(e.target.value) || 0;
                        onUpdateItemDimensions(item.id, 'itemLength', len);
                        const meters = parseFloat((len * (item.itemWidth || 0)).toFixed(2));
                        onUpdateItemDimensions(item.id, 'meters', meters);
                      }}
                      className={`w-14 border rounded px-1.5 py-0.5 bg-background text-center text-[10px] ${
                        !item.itemLength ? 'border-amber-400' : 'border-border'
                      }`}
                      min="0"
                      step="0.1"
                    />
                    <span className="text-muted-foreground">×</span>
                    <input
                      type="number"
                      placeholder="عرض *"
                      value={item.itemWidth || ""}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || 0;
                        onUpdateItemDimensions(item.id, 'itemWidth', w);
                        const meters = parseFloat(((item.itemLength || 0) * w).toFixed(2));
                        onUpdateItemDimensions(item.id, 'meters', meters);
                      }}
                      className={`w-14 border rounded px-1.5 py-0.5 bg-background text-center text-[10px] ${
                        !item.itemWidth ? 'border-amber-400' : 'border-border'
                      }`}
                      min="0"
                      step="0.1"
                    />
                    <span className="text-muted-foreground">=</span>
                    <span className="font-bold text-foreground text-[10px] min-w-[40px] text-center">
                      {((item.itemLength || 0) * (item.itemWidth || 0)).toFixed(1)} م²
                    </span>
                  </div>
                  {(item.itemLength || 0) > 0 && (item.itemWidth || 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground ps-5">
                      {item.price_per_meter ? (
                        <>
                          <span>{((item.itemLength || 0) * (item.itemWidth || 0)).toFixed(1)} م² × {item.price_per_meter.toFixed(2)} ر.س/م²</span>
                          <span>=</span>
                          <span className="font-bold text-primary">
                            {((item.itemLength || 0) * (item.itemWidth || 0) * item.price_per_meter).toFixed(2)} ر.س
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{((item.itemLength || 0) * (item.itemWidth || 0)).toFixed(1)} م² × {item.price.toFixed(2)} ر.س/م²</span>
                          <span>=</span>
                          <span className="font-bold text-primary">
                            {((item.itemLength || 0) * (item.itemWidth || 0) * item.price).toFixed(2)} ر.س
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Notes field */}
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="ملاحظات (نوع الغسيل، تعليمات...)"
                    value={item.notes || ""}
                    onChange={(e) => onUpdateItemNotes(item.id, e.target.value)}
                    className="flex-1 border border-border rounded px-1.5 py-0.5 bg-background text-[10px] placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary section */}
      <div className="border-t border-border p-3 space-y-1.5 text-sm bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium">{t("items_total")}</span>
          <div className="flex items-center gap-4">
            <span>{subtotal.toFixed(2)}</span>
            <span className="text-muted-foreground text-xs">ق</span>
            <span className="text-muted-foreground">{itemCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium">{t("discount")}</span>
          <div className="flex items-center gap-2">
            <span>{discount.toFixed(2)}</span>
            <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded text-[10px] font-bold">
              {discountPercent.toFixed(2)}%
            </span>
            <button className="text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {loyaltyDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium flex items-center gap-1">
              <Gift className="h-3.5 w-3.5 text-amber-500" />
              خصم الولاء
            </span>
            <span className="font-bold text-emerald-600">-{loyaltyDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium">{t("delivery_service")}</span>
          <div className="flex items-center gap-2">
            <span>{deliveryFee.toFixed(2)}</span>
            <span className="bg-accent text-accent-foreground px-2.5 py-0.5 rounded text-[10px] font-bold">
              {deliveryFee}
            </span>
            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`w-8 h-4 rounded-full transition-colors relative ${
                deliveryFee > 0 ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-card shadow transition-all ${
                  deliveryFee > 0 ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium">{t("vat")}</span>
          <div className="flex items-center gap-4">
            <span>{vat.toFixed(2)}</span>
            <span className="text-muted-foreground text-xs">0%</span>
          </div>
        </div>

        <div className="text-left">
          <button className="text-primary text-xs hover:underline">{t("add_coupon")}</button>
        </div>

        {/* رقم الجوال */}
        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            رقم الجوال
          </span>
          <input
            type="tel"
            placeholder="رقم الجوال..."
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="border border-border rounded px-2 py-0.5 text-xs bg-background w-36"
            dir="ltr"
          />
        </div>

        {/* تاريخ التسليم */}
        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            تاريخ التسليم
          </span>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="border border-border rounded px-2 py-0.5 text-xs bg-background"
          />
        </div>

        {/* اسم السائق - autocomplete */}
        <div className="flex items-center justify-between relative" ref={driverDropdownRef}>
          <span className="text-foreground font-medium flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            اسم السائق
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="اسم السائق..."
              value={driverName}
              onChange={(e) => {
                setDriverName(e.target.value);
                setShowDriverDropdown(true);
              }}
              onFocus={() => setShowDriverDropdown(true)}
              className="border border-border rounded px-2 py-0.5 text-xs bg-background w-36"
            />
            {showDriverDropdown && filteredDrivers.length > 0 && (
              <div className="absolute top-full mt-1 end-0 w-48 bg-card border border-border rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
                {filteredDrivers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDriverName(d.name);
                      setShowDriverDropdown(false);
                    }}
                    className="w-full text-start px-3 py-1.5 text-xs hover:bg-secondary/60 transition-colors border-b border-border last:border-0 flex items-center gap-2"
                  >
                    <Truck className="h-3 w-3 text-primary shrink-0" />
                    <span className="font-medium">{d.name}</span>
                    {d.phone && <span className="text-muted-foreground text-[10px]" dir="ltr">{d.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* العنوان / الحي */}
        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            العنوان / الحي
          </span>
          <input
            type="text"
            placeholder="الحي أو العنوان..."
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="border border-border rounded px-2 py-0.5 text-xs bg-background w-36"
          />
        </div>
      </div>

      {/* Quick + Home delivery */}
      <div className="border-t border-border px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{t("home_delivery")}</span>
          <button className={`w-8 h-4 rounded-full bg-border relative`}>
            <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-card shadow" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1 border border-border rounded">
            <button className="h-7 w-7 flex items-center justify-center hover:bg-secondary transition-colors">
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xs px-2">Quick</span>
            <button className="h-7 w-7 flex items-center justify-center hover:bg-secondary transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button className="h-7 w-7 rounded bg-primary text-primary-foreground flex items-center justify-center">
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{t("multiple_payment")}</span>
          <button className={`w-8 h-4 rounded-full bg-border relative`}>
            <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-card shadow" />
          </button>
          <div className="flex-1" />
          <select className="border border-border rounded px-2 py-1 text-xs bg-background flex-1">
            <option>{t("pay_on_delivery")}</option>
            <option>{t("cash")}</option>
            <option>{t("network")}</option>
            <option>{t("transfer")}</option>
          </select>
        </div>
      </div>

      {/* Save + Print buttons */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={async () => {
              const num = await generateInvoiceNumber();
              setInvoiceNumber(num);
              setReceiptData({
                cart: [...cart],
                subtotal, discount, discountPercent, vat, total,
                customerName: selectedCustomer?.name || customerSearch, customerCode: selectedCustomer?.code || null, paymentMethod, deliveryDate,
              });
              setShowReceipt(true);
              try {
                const result = await saveInvoice({
                  cart: [...cart], subtotal, tax: vat, total, paymentMethod, invoiceNumber: num,
                  customerId: selectedCustomer?.id || null, deliveryDate: deliveryDate || null, driverName: driverName || null, customerPhone: customerPhone || null, deliveryAddress: deliveryAddress || null,
                });
                toast.success("تم حفظ الفاتورة بنجاح ✅");
                // Earn loyalty points
                if (selectedCustomer && loyaltyConfig?.is_active && total > 0) {
                  const earned = await earnPoints(selectedCustomer.id, "", total, loyaltyConfig);
                  if (earned > 0) {
                    toast.success(`⭐ حصل العميل على ${earned} نقطة ولاء!`, { duration: 4000 });
                    setCustomerPoints((prev) => prev + earned);
                  }
                }
                setLoyaltyDiscount(0);
                setPointsToRedeem(0);
              } catch { toast.error("خطأ في حفظ الفاتورة"); }
              onSaveInvoice();
            }}
            disabled={cart.length === 0}
            className="flex-1 bg-accent text-accent-foreground py-2 rounded font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-between px-3"
          >
            <span>{t("save")}</span>
            <span>{total.toFixed(2)}</span>
          </button>
        </div>
        <button
          onClick={async () => {
            if (cart.length === 0) return;
            const num = await generateInvoiceNumber();
            setInvoiceNumber(num);
            setReceiptData({
              cart: [...cart],
              subtotal, discount, discountPercent, vat, total,
              customerName: selectedCustomer?.name || customerSearch, customerCode: selectedCustomer?.code || null, paymentMethod, deliveryDate,
            });
            setShowReceipt(true);
          }}
          disabled={cart.length === 0}
          className="w-full mt-1.5 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-1.5 rounded text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Printer className="h-3.5 w-3.5" />
          {t("preview_print_invoice")}
        </button>
      </div>

      {/* SMS + New invoice */}
      <div className="px-3 pb-3 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendSMS}
            onChange={(e) => setSendSMS(e.target.checked)}
            className="rounded"
          />
          {t("send_sms_label")}
        </label>
        <button
          onClick={() => {
            onClearCart();
            clearCustomer();
          }}
          className="text-primary text-sm hover:underline w-full text-center"
        >
          {t("new_invoice")}
        </button>
      </div>

      {/* Receipt Modals */}
      {showReceipt && receiptData && !showA4 && (
        <ThermalReceipt
          cart={receiptData.cart}
          invoiceNumber={invoiceNumber}
          customerName={receiptData.customerName}
          customerCode={receiptData.customerCode}
          subtotal={receiptData.subtotal}
          discount={receiptData.discount}
          discountPercent={receiptData.discountPercent}
          vat={receiptData.vat}
          total={receiptData.total}
          paymentMethod={receiptData.paymentMethod}
          deliveryDate={receiptData.deliveryDate}
          onClose={() => { setShowReceipt(false); setReceiptData(null); setShowA4(false); }}
          onSwitchToA4={() => setShowA4(true)}
        />
      )}
      {showReceipt && receiptData && showA4 && (
        <A4Invoice
          cart={receiptData.cart}
          invoiceNumber={invoiceNumber}
          customerName={receiptData.customerName}
          customerCode={receiptData.customerCode}
          customerPhone={selectedCustomer?.phone}
          customerAddress={selectedCustomer?.address}
          subtotal={receiptData.subtotal}
          discount={receiptData.discount}
          discountPercent={receiptData.discountPercent}
          vat={receiptData.vat}
          total={receiptData.total}
          paymentMethod={receiptData.paymentMethod}
          deliveryDate={receiptData.deliveryDate}
          onClose={() => { setShowReceipt(false); setReceiptData(null); setShowA4(false); }}
          onSwitchToThermal={() => setShowA4(false)}
        />
      )}
    </div>
  );
};

export default InvoiceSidebar;
