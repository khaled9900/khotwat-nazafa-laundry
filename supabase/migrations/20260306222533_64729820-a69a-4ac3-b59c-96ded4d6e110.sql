
-- Packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  item_count INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages viewable by everyone" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Packages insertable by anyone" ON public.packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Packages updatable by anyone" ON public.packages FOR UPDATE USING (true);
CREATE POLICY "Packages deletable by anyone" ON public.packages FOR DELETE USING (true);

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offers viewable by everyone" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Offers insertable by anyone" ON public.offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Offers updatable by anyone" ON public.offers FOR UPDATE USING (true);
CREATE POLICY "Offers deletable by anyone" ON public.offers FOR DELETE USING (true);

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  estimated_time TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regions viewable by everyone" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Regions insertable by anyone" ON public.regions FOR INSERT WITH CHECK (true);
CREATE POLICY "Regions updatable by anyone" ON public.regions FOR UPDATE USING (true);
CREATE POLICY "Regions deletable by anyone" ON public.regions FOR DELETE USING (true);

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
