-- Le super administrateur voit les comptes, les événements,
-- les invités et les réponses. La fonction évite une boucle
-- dans les règles de sécurité.

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

DROP POLICY IF EXISTS "Super admin manage all users" ON public.users;
CREATE POLICY "Super admin manage all users" ON public.users
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin reads all events" ON public.events;
CREATE POLICY "Super admin reads all events" ON public.events
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin reads all guests" ON public.guests;
CREATE POLICY "Super admin reads all guests" ON public.guests
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin reads all rsvps" ON public.rsvps;
CREATE POLICY "Super admin reads all rsvps" ON public.rsvps
  FOR SELECT USING (public.is_super_admin());
