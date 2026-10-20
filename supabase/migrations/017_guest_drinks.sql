-- Préférences de boisson liées à l'invité, via son lien personnel.

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS drink_preferences text;

CREATE OR REPLACE FUNCTION public.save_guest_drinks(
  p_token text,
  p_drinks text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  guest_row guests%ROWTYPE;
  clean text;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  clean := left(regexp_replace(coalesce(p_drinks, ''), '[^a-zA-Z0-9,_-]', '', 'g'), 400);

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

  UPDATE guests
  SET drink_preferences = NULLIF(clean, ''),
      updated_at = now()
  WHERE id = guest_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_guest_drinks(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_guest_drinks(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
