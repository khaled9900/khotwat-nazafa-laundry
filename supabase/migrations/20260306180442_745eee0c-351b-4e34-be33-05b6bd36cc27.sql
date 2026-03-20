
-- Expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expense categories viewable by everyone" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Expense categories insertable by anyone" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Expense categories updatable by anyone" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Expense categories deletable by anyone" ON public.expense_categories FOR DELETE USING (true);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_number TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT NOT NULL DEFAULT '',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expenses viewable by everyone" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Expenses insertable by anyone" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Expenses updatable by anyone" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Expenses deletable by anyone" ON public.expenses FOR DELETE USING (true);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default categories
INSERT INTO public.expense_categories (name) VALUES
  ('إيجار'),
  ('رواتب'),
  ('كهرباء ومياه'),
  ('صيانة'),
  ('مواد تنظيف'),
  ('نقل وتوصيل'),
  ('تسويق وإعلان'),
  ('متنوعة');
