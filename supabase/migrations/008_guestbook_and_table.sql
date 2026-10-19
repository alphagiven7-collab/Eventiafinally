-- Table de l'invité sur son lien personnel, et lecture publique
-- des trois derniers messages du livre d'or.

DROP FUNCTION IF EXISTS lookup_guest_by_token(text);

CREATE FUNCTION lookup_guest_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  name text,
  status text,
  adults integer,
  children integer,
  token text,
  table_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.event_id, g.name, g.status, g.adults, g.children, g.token, g.table_number
  FROM guests g
  JOIN events e ON e.id = g.event_id
  WHERE p_token IS NOT NULL
    AND p_token <> ''
    AND g.token = p_token
    AND e.is_published = true;
$$;

CREATE OR REPLACE FUNCTION list_event_guestbook(p_slug text)
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
  LIMIT 3;
$$;

REVOKE ALL ON FUNCTION lookup_guest_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION list_event_guestbook(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_guest_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION list_event_guestbook(text) TO anon, authenticated;
