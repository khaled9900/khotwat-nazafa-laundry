CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business settings selectable by admin" ON public.business_settings;
DROP POLICY IF EXISTS "Business settings insertable by admin" ON public.business_settings;
DROP POLICY IF EXISTS "Business settings updatable by admin" ON public.business_settings;
DROP POLICY IF EXISTS "Business settings deletable by admin" ON public.business_settings;

CREATE POLICY "Business settings selectable by admin"
ON public.business_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Business settings insertable by admin"
ON public.business_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Business settings updatable by admin"
ON public.business_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Business settings deletable by admin"
ON public.business_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();