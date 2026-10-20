-- L'admin crée, modifie, supprime et lit toutes les invitations et tous les invités.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Super admin inserts events" ON public.events;
CREATE POLICY "Super admin inserts events" ON public.events
  FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages guests" ON public.guests;
CREATE POLICY "Super admin manages guests" ON public.guests
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages rsvps" ON public.rsvps;
CREATE POLICY "Super admin manages rsvps" ON public.rsvps
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

NOTIFY pgrst, 'reload schema';
