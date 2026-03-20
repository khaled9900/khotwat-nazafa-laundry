import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/data/products";

export const saveInvoice = async (data: {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  invoiceNumber: string;
  customerId?: string | null;
  deliveryDate?: string | null;
  driverName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  branchId?: string | null;
}) => {
  // Get current user for audit
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإنشاء فاتورة");

  const items = data.cart.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    emoji: item.emoji,
    itemLength: item.itemLength || null,
    itemWidth: item.itemWidth || null,
    meters: item.meters || null,
  }));

  const { error } = await supabase.from("invoices").insert({
    invoice_number: data.invoiceNumber,
    items: items,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    payment_method: data.paymentMethod,
    status: "cleaning",
    customer_id: data.customerId || null,
    delivery_date: data.deliveryDate || null,
    driver_name: data.driverName || "",
    customer_phone: data.customerPhone || "",
    delivery_address: data.deliveryAddress || "",
    branch_id: data.branchId || null,
    created_by: user.id,
  } as any);

  if (error) {
    console.error("Error saving invoice:", error);
    throw error;
  }
};
