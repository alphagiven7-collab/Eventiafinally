-- L'accueil du jour J n'enregistre l'arrivée que si la présence est confirmée.

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
