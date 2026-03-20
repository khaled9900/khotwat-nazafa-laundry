import { supabase } from "@/integrations/supabase/client";

export interface OrderStageSettings {
  cleaningDays: number;
  readyDays: number;
}

const DEFAULT_SETTINGS: OrderStageSettings = {
  cleaningDays: 4,
  readyDays: 65,
};

export const getOrderStageSettings = (): OrderStageSettings => {
  try {
    const saved = localStorage.getItem("orderStageSettings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
};

export const saveOrderStageSettings = async (settings: OrderStageSettings) => {
  localStorage.setItem("orderStageSettings", JSON.stringify(settings));
  try {
    await supabase
      .from("business_settings" as any)
      .upsert(
        { setting_key: "order_stage_settings", setting_value: settings },
        { onConflict: "setting_key" }
      );
  } catch (err) {
    console.error("Error saving order stage settings:", err);
  }
};

/**
 * Auto-transition order statuses based on configurable time rules:
 * - cleaning → ready: after cleaningDays from invoice date
 * - ready → warehouse: after (cleaningDays + readyDays) from invoice date
 */
export const autoTransitionOrders = async () => {
  const settings = getOrderStageSettings();
  const now = new Date();

  const cleaningThreshold = new Date(now.getTime() - settings.cleaningDays * 24 * 60 * 60 * 1000).toISOString();
  const warehouseThreshold = new Date(now.getTime() - (settings.cleaningDays + settings.readyDays) * 24 * 60 * 60 * 1000).toISOString();

  // Transition cleaning → ready
  await supabase
    .from("invoices")
    .update({ status: "ready", status_updated_at: now.toISOString() })
    .eq("status", "cleaning")
    .lt("created_at", cleaningThreshold);

  // Transition ready → warehouse
  await supabase
    .from("invoices")
    .update({ status: "warehouse", status_updated_at: now.toISOString() })
    .eq("status", "ready")
    .lt("created_at", warehouseThreshold);
};
