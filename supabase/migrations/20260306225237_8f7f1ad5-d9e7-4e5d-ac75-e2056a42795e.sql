-- Add auto-incrementing customer code
ALTER TABLE public.customers ADD COLUMN code SERIAL;

-- Create unique index on code
CREATE UNIQUE INDEX customers_code_unique ON public.customers (code);