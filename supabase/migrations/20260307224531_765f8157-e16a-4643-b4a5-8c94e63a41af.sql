ALTER TABLE public.products ADD COLUMN price_per_meter numeric DEFAULT NULL;
ALTER TABLE public.products ALTER COLUMN stock DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN stock SET DEFAULT NULL;