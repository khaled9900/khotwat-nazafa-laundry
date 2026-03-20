
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  manager TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branches viewable by everyone" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Branches insertable by anyone" ON public.branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Branches updatable by anyone" ON public.branches FOR UPDATE USING (true);
CREATE POLICY "Branches deletable by anyone" ON public.branches FOR DELETE USING (true);
