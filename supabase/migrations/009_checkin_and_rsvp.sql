-- Corrige la confirmation (la variable "found" masquait le booléen FOUND)
-- et ajoute le check-in du jour J plus la lecture complète du livre d'or.

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

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

  IF guest_row.id IS NULL THEN
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

  UPDATE guests
  SET status = p_status,
      adults = p_adults,
      children = p_children,
      message = COALESCE(p_message, message),
      updated_at = now()
  WHERE id = guest_row.id;

  INSERT INTO rsvps (event_id, guest_id, status, adults, children, message)
  VALUES (guest_row.event_id, guest_row.id, p_status, p_adults, p_children, p_message);

  guest_name := guest_row.name;
  guest_status := p_status;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION check_in_guest(p_token text)
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
  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT * INTO guest_row
  FROM guests
  WHERE token = p_token;

  IF guest_row.id IS NULL THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  was_inside := guest_row.checked_in_at IS NOT NULL;

  UPDATE guests
  SET checked_in_at = COALESCE(checked_in_at, now()),
      updated_at = now()
  WHERE id = guest_row.id;

  guest_name := guest_row.name;
  table_number := NULLIF(btrim(COALESCE(guest_row.table_number, '')), '');
  guest_status := guest_row.status;
  already_inside := was_inside;
  RETURN NEXT;
END;
$$;

DROP FUNCTION IF EXISTS list_event_guestbook(text, integer);
DROP FUNCTION IF EXISTS list_event_guestbook(text);

CREATE FUNCTION list_event_guestbook(p_slug text, p_limit integer DEFAULT 3)
RETURNS TABLE (
  guest_name text,
  message text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.name, left(btrim(g.message), 280)
  FROM guests g
  JOIN events e ON e.id = g.event_id
  WHERE e.slug = p_slug
    AND e.is_published = true
    AND g.message IS NOT NULL
    AND btrim(g.message) <> ''
    AND g.status = 'confirmed'
  ORDER BY g.updated_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 3), 1), 500);
$$;

REVOKE ALL ON FUNCTION submit_guest_rsvp(text, text, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION check_in_guest(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION list_event_guestbook(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_guest_rsvp(text, text, integer, integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_in_guest(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION list_event_guestbook(text, integer) TO anon, authenticated;
