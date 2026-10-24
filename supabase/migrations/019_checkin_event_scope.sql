-- Accueil du jour J : une arrivée est toujours liée à un mariage précis.
-- La carte d'un autre mariage est refusée, et seul le propriétaire du mariage
-- (ou un super admin) peut enregistrer une arrivée. Un invité ne peut plus
-- s'enregistrer lui-même depuis son lien.

DROP FUNCTION IF EXISTS check_in_guest(text);
DROP FUNCTION IF EXISTS check_in_guest(text, uuid);

CREATE FUNCTION check_in_guest(p_token text, p_event_id uuid)
RETURNS TABLE (
  guest_name text,
  table_number text,
  guest_status text,
  already_inside boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_row guests%ROWTYPE;
  was_inside boolean;
BEGIN
  IF auth.uid() IS NULL OR p_event_id IS NULL THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT * INTO guest_row FROM guests WHERE token = p_token;

  IF guest_row.id IS NULL THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND' USING ERRCODE = 'no_data_found';
  END IF;

  IF guest_row.event_id <> p_event_id THEN
    RAISE EXCEPTION 'WRONG_EVENT' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  was_inside := guest_row.checked_in_at IS NOT NULL;

  IF guest_row.status = 'confirmed' AND NOT was_inside THEN
    UPDATE guests
    SET checked_in_at = now(),
        updated_at = now()
    WHERE id = guest_row.id;
  END IF;

  guest_name := guest_row.name;
  table_number := NULLIF(btrim(COALESCE(guest_row.table_number, '')), '');
  guest_status := guest_row.status;
  already_inside := was_inside;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION check_in_guest(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION check_in_guest(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION check_in_guest(text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
