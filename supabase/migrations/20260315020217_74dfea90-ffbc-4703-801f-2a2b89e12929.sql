
-- Table to control which disciplines a user can manage
CREATE TABLE public.user_discipline_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline text NOT NULL CHECK (discipline IN ('MMA', 'Boxeo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, discipline)
);

-- Enable RLS
ALTER TABLE public.user_discipline_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own discipline access
CREATE POLICY "Users can read own discipline access"
  ON public.user_discipline_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins/super_admins can manage all discipline access
CREATE POLICY "Admins can manage discipline access"
  ON public.user_discipline_access
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
