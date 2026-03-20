
-- Add loyalty_points column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- Create loyalty transactions log
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL DEFAULT 'earn',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other tables)
CREATE POLICY "loyalty_transactions_select" ON public.loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "loyalty_transactions_insert" ON public.loyalty_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "loyalty_transactions_delete" ON public.loyalty_transactions FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create loyalty settings in business_settings
INSERT INTO public.business_settings (setting_key, setting_value)
VALUES ('loyalty_config', '{"points_per_riyal": 1, "riyal_per_point": 0.1, "min_redeem_points": 50, "is_active": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
