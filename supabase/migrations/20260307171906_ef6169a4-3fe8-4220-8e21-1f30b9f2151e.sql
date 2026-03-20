
-- Link users to branches
CREATE TABLE public.user_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  is_manager boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, branch_id)
);

ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

-- Everyone can view user_branches
CREATE POLICY "user_branches_select" ON public.user_branches FOR SELECT USING (true);

-- Only admins can manage user_branches
CREATE POLICY "user_branches_insert" ON public.user_branches FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_branches_update" ON public.user_branches FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_branches_delete" ON public.user_branches FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
