
-- Create drivers table
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "drivers_select" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "drivers_insert" ON public.drivers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "drivers_update" ON public.drivers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "drivers_delete" ON public.drivers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add delivery_address to invoices for neighborhood analytics
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_address text DEFAULT '';
