-- Liste d'invités hébergée.
-- Le plafond de l'offre gratuite (5) est appliqué à l'insertion.
-- Le lien personnel retrouve l'invité par jeton, et sa réponse RSVP
-- est enregistrée même depuis un autre téléphone.

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS group_name TEXT,
  ADD COLUMN IF NOT EXISTS table_number TEXT;

CREATE OR REPLACE FUNCTION enforce_free_guest_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  existing integer;
BEGIN
  -- Une place payante pourra lever ce plafond plus tard.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.event_id::text)::bigint);
  SELECT count(*)::integer INTO existing
  FROM guests
  WHERE event_id = NEW.event_id;

  IF existing >= 5 THEN
    RAISE EXCEPTION 'FREE_GUEST_LIMIT'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guests_free_limit ON guests;
CREATE TRIGGER guests_free_limit
  BEFORE INSERT ON guests
  FOR EACH ROW
  EXECUTE FUNCTION enforce_free_guest_limit();

CREATE OR REPLACE FUNCTION lookup_guest_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  name text,
  status text,
  adults integer,
  children integer,
  token text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.event_id, g.name, g.status, g.adults, g.children, g.token
  FROM guests g
  JOIN events e ON e.id = g.event_id
  WHERE p_token IS NOT NULL
    AND p_token <> ''
    AND g.token = p_token
    AND e.is_published = true;
$$;

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
  found guests%ROWTYPE;
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

  SELECT * INTO found
  FROM guests
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = found.event_id
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
  WHERE id = found.id;

  INSERT INTO rsvps (event_id, guest_id, status, adults, children, message)
  VALUES (found.event_id, found.id, p_status, p_adults, p_children, p_message);

  guest_name := found.name;
  guest_status := p_status;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION lookup_guest_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION submit_guest_rsvp(text, text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_guest_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_guest_rsvp(text, text, integer, integer, text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert guests" ON guests;
DROP POLICY IF EXISTS "Anyone can view guests for published events" ON guests;
DROP POLICY IF EXISTS "Event owners can manage guests" ON guests;
DROP POLICY IF EXISTS "Users manage own guests" ON guests;
DROP POLICY IF EXISTS "Public view guest by token" ON guests;
DROP POLICY IF EXISTS "Public view published guests" ON guests;

CREATE POLICY "Users manage own guests" ON guests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
        AND events.user_id = auth.uid()
    )
  );
