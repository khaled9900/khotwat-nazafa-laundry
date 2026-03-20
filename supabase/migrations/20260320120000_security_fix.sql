-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY FIX: Lock down RLS + Add branch/user scoping + Safe invoice numbers
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Helper: check if user belongs to a branch ──────────────────────────────
CREATE OR REPLACE FUNCTION public.user_has_branch(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_branches
    WHERE user_id = _user_id AND branch_id = _branch_id
  )
$$;

-- ─── Helper: check if user is authenticated ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD branch_id + created_by to transactional tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- Invoices: add branch_id, created_by, updated_at
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_invoices_branch_id ON public.invoices (branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices (created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices (customer_id);

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expenses: add branch_id, created_by
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses (branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses (created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses (expense_date DESC);

-- Bank transactions: add created_by
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Employee actions: add created_by
ALTER TABLE public.employee_actions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX RLS: Replace USING(true) with proper authentication checks
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products can be inserted by anyone" ON public.products;
DROP POLICY IF EXISTS "Products can be updated by anyone" ON public.products;
DROP POLICY IF EXISTS "Products can be deleted by anyone" ON public.products;

CREATE POLICY "products_select_auth" ON public.products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Customers are viewable by everyone" ON public.customers;
DROP POLICY IF EXISTS "Customers can be inserted by anyone" ON public.customers;
DROP POLICY IF EXISTS "Customers can be updated by anyone" ON public.customers;
DROP POLICY IF EXISTS "Customers can be deleted by anyone" ON public.customers;

CREATE POLICY "customers_select_auth" ON public.customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert_auth" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers_update_auth" ON public.customers
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_delete_admin" ON public.customers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── INVOICES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Invoices are viewable by everyone" ON public.invoices;
DROP POLICY IF EXISTS "Invoices can be inserted by anyone" ON public.invoices;
DROP POLICY IF EXISTS "Invoices can be updated by anyone" ON public.invoices;
DROP POLICY IF EXISTS "Invoices can be deleted by anyone" ON public.invoices;

CREATE POLICY "invoices_select_auth" ON public.invoices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_insert_auth" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "invoices_update_auth" ON public.invoices
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Expenses viewable by everyone" ON public.expenses;
DROP POLICY IF EXISTS "Expenses insertable by anyone" ON public.expenses;
DROP POLICY IF EXISTS "Expenses updatable by anyone" ON public.expenses;
DROP POLICY IF EXISTS "Expenses deletable by anyone" ON public.expenses;

CREATE POLICY "expenses_select_auth" ON public.expenses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert_auth" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "expenses_update_admin" ON public.expenses
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "expenses_delete_admin" ON public.expenses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── EXPENSE CATEGORIES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Expense categories viewable by everyone" ON public.expense_categories;
DROP POLICY IF EXISTS "Expense categories insertable by anyone" ON public.expense_categories;
DROP POLICY IF EXISTS "Expense categories updatable by anyone" ON public.expense_categories;
DROP POLICY IF EXISTS "Expense categories deletable by anyone" ON public.expense_categories;

CREATE POLICY "expense_cat_select_auth" ON public.expense_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "expense_cat_insert_admin" ON public.expense_categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "expense_cat_update_admin" ON public.expense_categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "expense_cat_delete_admin" ON public.expense_categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── BRANCHES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Branches viewable by everyone" ON public.branches;
DROP POLICY IF EXISTS "Branches insertable by anyone" ON public.branches;
DROP POLICY IF EXISTS "Branches updatable by anyone" ON public.branches;
DROP POLICY IF EXISTS "Branches deletable by anyone" ON public.branches;

CREATE POLICY "branches_select_auth" ON public.branches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "branches_insert_admin" ON public.branches
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branches_update_admin" ON public.branches
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branches_delete_admin" ON public.branches
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── PACKAGES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Packages viewable by everyone" ON public.packages;
DROP POLICY IF EXISTS "Packages insertable by anyone" ON public.packages;
DROP POLICY IF EXISTS "Packages updatable by anyone" ON public.packages;
DROP POLICY IF EXISTS "Packages deletable by anyone" ON public.packages;

CREATE POLICY "packages_select_auth" ON public.packages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "packages_insert_admin" ON public.packages
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "packages_update_admin" ON public.packages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "packages_delete_admin" ON public.packages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── OFFERS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Offers viewable by everyone" ON public.offers;
DROP POLICY IF EXISTS "Offers insertable by anyone" ON public.offers;
DROP POLICY IF EXISTS "Offers updatable by anyone" ON public.offers;
DROP POLICY IF EXISTS "Offers deletable by anyone" ON public.offers;

CREATE POLICY "offers_select_auth" ON public.offers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "offers_insert_admin" ON public.offers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "offers_update_admin" ON public.offers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "offers_delete_admin" ON public.offers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── REGIONS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Regions viewable by everyone" ON public.regions;
DROP POLICY IF EXISTS "Regions insertable by anyone" ON public.regions;
DROP POLICY IF EXISTS "Regions updatable by anyone" ON public.regions;
DROP POLICY IF EXISTS "Regions deletable by anyone" ON public.regions;

CREATE POLICY "regions_select_auth" ON public.regions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "regions_insert_admin" ON public.regions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "regions_update_admin" ON public.regions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "regions_delete_admin" ON public.regions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── BANKS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "banks_select" ON public.banks;
DROP POLICY IF EXISTS "banks_insert" ON public.banks;
DROP POLICY IF EXISTS "banks_update" ON public.banks;
DROP POLICY IF EXISTS "banks_delete" ON public.banks;

CREATE POLICY "banks_select_auth" ON public.banks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "banks_insert_admin" ON public.banks
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "banks_update_admin" ON public.banks
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "banks_delete_admin" ON public.banks
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── BANK TRANSACTIONS ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bank_transactions_select" ON public.bank_transactions;
DROP POLICY IF EXISTS "bank_transactions_insert" ON public.bank_transactions;
DROP POLICY IF EXISTS "bank_transactions_update" ON public.bank_transactions;
DROP POLICY IF EXISTS "bank_transactions_delete" ON public.bank_transactions;

CREATE POLICY "bank_tx_select_auth" ON public.bank_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bank_tx_insert_admin" ON public.bank_transactions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bank_tx_update_admin" ON public.bank_transactions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bank_tx_delete_admin" ON public.bank_transactions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── DRIVERS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "drivers_select" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update" ON public.drivers;
DROP POLICY IF EXISTS "drivers_delete" ON public.drivers;

CREATE POLICY "drivers_select_auth" ON public.drivers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "drivers_insert_admin" ON public.drivers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "drivers_update_admin" ON public.drivers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "drivers_delete_admin" ON public.drivers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── LOYALTY TRANSACTIONS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "loyalty_transactions_select" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "loyalty_transactions_insert" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "loyalty_transactions_delete" ON public.loyalty_transactions;

CREATE POLICY "loyalty_tx_select_auth" ON public.loyalty_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "loyalty_tx_insert_auth" ON public.loyalty_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "loyalty_tx_delete_admin" ON public.loyalty_transactions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAFE INVOICE NUMBER GENERATOR (prevents race conditions)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sequence table to track invoice prefixes and counters atomically
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  prefix TEXT PRIMARY KEY,
  current_number INTEGER NOT NULL DEFAULT 0,
  max_per_prefix INTEGER NOT NULL DEFAULT 99999,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq_select_auth" ON public.invoice_sequences
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "seq_all_admin" ON public.invoice_sequences
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Atomic function: generates next invoice number without race conditions
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(_prefix TEXT DEFAULT 'A')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_num INTEGER;
  _max INTEGER;
  _result TEXT;
BEGIN
  -- Insert prefix if it doesn't exist, or get current
  INSERT INTO public.invoice_sequences (prefix, current_number, max_per_prefix)
  VALUES (_prefix, 0, 99999)
  ON CONFLICT (prefix) DO NOTHING;

  -- Atomically increment and return (FOR UPDATE locks the row)
  UPDATE public.invoice_sequences
  SET current_number = current_number + 1, updated_at = now()
  WHERE prefix = _prefix
  RETURNING current_number, max_per_prefix INTO _next_num, _max;

  -- Check overflow
  IF _next_num > _max THEN
    RAISE EXCEPTION 'Invoice prefix % has reached maximum %. Please change prefix.', _prefix, _max;
  END IF;

  _result := _prefix || lpad(_next_num::TEXT, 2, '0');
  RETURN _result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers (code);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees (department_id);
CREATE INDEX IF NOT EXISTS idx_employee_actions_employee ON public.employee_actions (employee_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank ON public.bank_transactions (bank_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON public.loyalty_transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);
