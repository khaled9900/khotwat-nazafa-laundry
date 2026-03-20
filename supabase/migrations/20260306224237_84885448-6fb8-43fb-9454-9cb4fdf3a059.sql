
-- Employee departments
CREATE TABLE IF NOT EXISTS public.employee_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_departments_select" ON public.employee_departments FOR SELECT USING (true);
CREATE POLICY "employee_departments_insert" ON public.employee_departments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "employee_departments_update" ON public.employee_departments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "employee_departments_delete" ON public.employee_departments FOR DELETE USING (auth.uid() IS NOT NULL);

-- Employee nationalities
CREATE TABLE IF NOT EXISTS public.employee_nationalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_nationalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_nationalities_select" ON public.employee_nationalities FOR SELECT USING (true);
CREATE POLICY "employee_nationalities_insert" ON public.employee_nationalities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "employee_nationalities_update" ON public.employee_nationalities FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "employee_nationalities_delete" ON public.employee_nationalities FOR DELETE USING (auth.uid() IS NOT NULL);

-- Employees
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  department_id UUID REFERENCES public.employee_departments(id) ON DELETE SET NULL,
  nationality_id UUID REFERENCES public.employee_nationalities(id) ON DELETE SET NULL,
  salary NUMERIC NOT NULL DEFAULT 0,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_select" ON public.employees FOR SELECT USING (true);
CREATE POLICY "employees_insert" ON public.employees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "employees_update" ON public.employees FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "employees_delete" ON public.employees FOR DELETE USING (auth.uid() IS NOT NULL);

-- Employee actions (deductions/additions)
CREATE TABLE IF NOT EXISTS public.employee_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'deduction',
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_actions_select" ON public.employee_actions FOR SELECT USING (true);
CREATE POLICY "employee_actions_insert" ON public.employee_actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "employee_actions_update" ON public.employee_actions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "employee_actions_delete" ON public.employee_actions FOR DELETE USING (auth.uid() IS NOT NULL);

-- Banks
CREATE TABLE IF NOT EXISTS public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_number TEXT NOT NULL DEFAULT '',
  balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banks_select" ON public.banks FOR SELECT USING (true);
CREATE POLICY "banks_insert" ON public.banks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "banks_update" ON public.banks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "banks_delete" ON public.banks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Bank transactions
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES public.banks(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'deposit',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_transactions_select" ON public.bank_transactions FOR SELECT USING (true);
CREATE POLICY "bank_transactions_insert" ON public.bank_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "bank_transactions_update" ON public.bank_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "bank_transactions_delete" ON public.bank_transactions FOR DELETE USING (auth.uid() IS NOT NULL);
