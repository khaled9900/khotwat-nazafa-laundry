import { supabase } from "@/integrations/supabase/client";

export interface InvoicePageSettings {
  prefix: string;
  maxPerLetter: number;
  taxRate: number;
  defaultService: string;
  autoChangeLetter: boolean;
  laundryCycleActive: boolean;
  normalPrepTime: number;
  urgentPrepTime: number;
  pinLeftSide: boolean;
}

const defaultSettings: InvoicePageSettings = {
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

export const getInvoicePageSettings = async (): Promise<InvoicePageSettings> => {
  // Try localStorage first for speed (read-only cache, not authoritative)
  try {
    const cached = localStorage.getItem("invoicePageSettings");
    if (cached) return { ...defaultSettings, ...JSON.parse(cached) };
  } catch { /* ignore parse errors */ }

  // Fetch from DB (source of truth)
  const { data } = await supabase
    .from("business_settings" as any)
    .select("setting_value")
    .eq("setting_key", "invoice_page_settings")
    .limit(1) as any;

  if (data && data.length > 0 && data[0].setting_value) {
    const merged = { ...defaultSettings, ...(data[0].setting_value as any) };
    localStorage.setItem("invoicePageSettings", JSON.stringify(merged));
    return merged;
  }

  return defaultSettings;
};

/**
 * Generate the next invoice number using the atomic DB function.
 * This prevents race conditions when multiple users create invoices simultaneously.
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  const settings = await getInvoicePageSettings();
  const prefix = settings.prefix || "A";

  // Call the atomic server-side function (uses FOR UPDATE lock)
  const { data, error } = await supabase.rpc("generate_next_invoice_number", {
    _prefix: prefix,
  });

  if (error) {
    console.error("Error generating invoice number:", error);
    // Fallback: use timestamp-based number to avoid blocking the user
    const ts = Date.now().toString(36).toUpperCase();
    return `${prefix}-${ts}`;
  }

  return data as string;
};
