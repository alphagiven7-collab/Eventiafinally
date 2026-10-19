-- La confirmation renvoie toujours une ligne, même si l'historique RSVP
-- ne peut pas être écrit. FOUND n'est plus masqué par une variable.

CREATE OR REPLACE FUNCTION submit_guest_rsvp(
  p_token text,
  p_status text,
  p_adults integer DEFAULT 1,
  p_children integer DEFAULT 0,
  p_message text DEFAULT NULL
)
RETURNS TABLE (
  guest_name text,
  guest_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  guest_row guests%ROWTYPE;
BEGIN
  IF p_status NOT IN ('confirmed', 'declined') THEN
    RAISE EXCEPTION 'INVALID_STATUS'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p_adults IS NULL OR p_adults < 0 OR p_adults > 20 THEN
    p_adults := 1;
  END IF;
  IF p_children IS NULL OR p_children < 0 OR p_children > 20 THEN
    p_children := 0;
  END IF;
  IF p_message IS NOT NULL THEN
    p_message := left(p_message, 500);
  END IF;

  SELECT * INTO guest_row
  FROM guests
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = guest_row.event_id
      AND is_published = true
  ) THEN
    RAISE EXCEPTION 'EVENT_NOT_PUBLISHED'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE guests AS g
  SET status = p_status,
      adults = p_adults,
      children = p_children,
      message = COALESCE(p_message, g.message),
      updated_at = now()
  WHERE g.id = guest_row.id;

  BEGIN
    INSERT INTO rsvps (event_id, guest_id, status, adults, children, message)
    VALUES (guest_row.event_id, guest_row.id, p_status, p_adults, p_children, p_message);
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN QUERY SELECT guest_row.name::text, p_status::text;
END;
$$;

REVOKE ALL ON FUNCTION submit_guest_rsvp(text, text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_guest_rsvp(text, text, integer, integer, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
