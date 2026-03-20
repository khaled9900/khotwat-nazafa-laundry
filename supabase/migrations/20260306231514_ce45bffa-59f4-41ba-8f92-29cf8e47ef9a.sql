
-- Add status_updated_at column to track when status was last changed
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add customer_phone to invoices for notification purposes
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';

-- Update existing invoices: set status to 'new' for pending, keep 'completed' as 'delivered'
UPDATE public.invoices SET status = 'delivered' WHERE status = 'completed';

-- Set default status to 'new' for future invoices
ALTER TABLE public.invoices ALTER COLUMN status SET DEFAULT 'new';
