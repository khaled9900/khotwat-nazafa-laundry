import { supabase } from "@/integrations/supabase/client";

export interface LoyaltyConfig {
  points_per_riyal: number;
  riyal_per_point: number;
  min_redeem_points: number;
  is_active: boolean;
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  points_per_riyal: 1,
  riyal_per_point: 0.1,
  min_redeem_points: 50,
  is_active: true,
};

export const getLoyaltyConfig = async (): Promise<LoyaltyConfig> => {
  try {
    const { data } = await supabase
      .from("business_settings")
      .select("setting_value")
      .eq("setting_key", "loyalty_config")
      .single();
    if (data?.setting_value) {
      return { ...DEFAULT_CONFIG, ...(data.setting_value as any) };
    }
  } catch {}
  return DEFAULT_CONFIG;
};

export const getCustomerPoints = async (customerId: string): Promise<number> => {
  const { data } = await supabase
    .from("customers")
    .select("loyalty_points")
    .eq("id", customerId)
    .single();
  return (data as any)?.loyalty_points || 0;
};

export const earnPoints = async (
  customerId: string,
  invoiceId: string,
  totalAmount: number,
  config: LoyaltyConfig
): Promise<number> => {
  if (!config.is_active) return 0;

  const pointsEarned = Math.floor(totalAmount * config.points_per_riyal);
  if (pointsEarned <= 0) return 0;

  // Get current points
  const currentPoints = await getCustomerPoints(customerId);
  const newPoints = currentPoints + pointsEarned;

  // Update customer points
  await supabase
    .from("customers")
    .update({ loyalty_points: newPoints } as any)
    .eq("id", customerId);

  // Log transaction
  await supabase.from("loyalty_transactions" as any).insert({
    customer_id: customerId,
    invoice_id: invoiceId,
    points: pointsEarned,
    transaction_type: "earn",
    description: `كسب ${pointsEarned} نقطة من فاتورة بقيمة ${totalAmount.toFixed(2)} ر.س`,
  });

  return pointsEarned;
};

export const redeemPoints = async (
  customerId: string,
  pointsToRedeem: number,
  config: LoyaltyConfig
): Promise<{ success: boolean; discountAmount: number; message: string }> => {
  if (!config.is_active) {
    return { success: false, discountAmount: 0, message: "نظام الولاء غير مفعّل" };
  }

  const currentPoints = await getCustomerPoints(customerId);

  if (currentPoints < pointsToRedeem) {
    return { success: false, discountAmount: 0, message: "رصيد النقاط غير كافٍ" };
  }

  if (pointsToRedeem < config.min_redeem_points) {
    return { success: false, discountAmount: 0, message: `الحد الأدنى للاستبدال ${config.min_redeem_points} نقطة` };
  }

  const discountAmount = pointsToRedeem * config.riyal_per_point;
  const newPoints = currentPoints - pointsToRedeem;

  // Update customer points
  await supabase
    .from("customers")
    .update({ loyalty_points: newPoints } as any)
    .eq("id", customerId);

  // Log transaction
  await supabase.from("loyalty_transactions" as any).insert({
    customer_id: customerId,
    points: -pointsToRedeem,
    transaction_type: "redeem",
    description: `استبدال ${pointsToRedeem} نقطة بخصم ${discountAmount.toFixed(2)} ر.س`,
  });

  return { success: true, discountAmount, message: `تم خصم ${discountAmount.toFixed(2)} ر.س` };
};
