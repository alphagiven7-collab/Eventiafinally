-- L'admin débloque, bloque, modifie ou supprime n'importe quel événement.
-- Une invitation bloquée n'est plus lisible par les invités.

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

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS guest_limit integer;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_note text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

UPDATE public.events
SET guest_limit = 3
WHERE guest_limit IS NULL;

DROP POLICY IF EXISTS "Super admin reads all events" ON public.events;
CREATE POLICY "Super admin reads all events" ON public.events
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin updates events" ON public.events;
CREATE POLICY "Super admin updates events" ON public.events
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin deletes events" ON public.events;
CREATE POLICY "Super admin deletes events" ON public.events
  FOR DELETE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages event settings" ON public.event_settings;
CREATE POLICY "Super admin manages event settings" ON public.event_settings
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
DROP POLICY IF EXISTS "Users view own events" ON public.events;
CREATE POLICY "Users view own events" ON public.events
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_published = true AND COALESCE(is_blocked, false) = false)
  );

DROP POLICY IF EXISTS "Public read published settings" ON public.event_settings;
CREATE POLICY "Public read published settings" ON public.event_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_settings.event_id
        AND events.is_published = true
        AND COALESCE(events.is_blocked, false) = false
    )
  );

CREATE OR REPLACE FUNCTION public.admin_unlock_event(
  p_event_id uuid,
  p_guest_limit integer,
  p_note text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;
  IF p_guest_limit IS NULL OR p_guest_limit < 3 THEN
    RAISE EXCEPTION 'INVALID_LIMIT';
  END IF;

  UPDATE public.events
  SET guest_limit = p_guest_limit,
      payment_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
      updated_at = now()
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  UPDATE public.event_settings
  SET payload = jsonb_set(COALESCE(payload, '{}'::jsonb), '{guestLimit}', to_jsonb(p_guest_limit), true),
      updated_at = now()
  WHERE event_id = p_event_id;

  RETURN p_guest_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_event_blocked(p_event_id uuid, p_blocked boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  UPDATE public.events
  SET is_blocked = COALESCE(p_blocked, false),
      updated_at = now()
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  RETURN COALESCE(p_blocked, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_event(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  DELETE FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_unlock_event(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_event_blocked(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_unlock_event(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_event_blocked(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_event(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
