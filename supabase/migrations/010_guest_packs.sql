-- La capacité d'un événement = 3 invitations d'essai + le forfait choisi.
-- Sans forfait, la limite reste 3. L'application enregistre guest_limit
-- quand l'organisateur valide un forfait de 50, 100, 200 ou un nombre libre.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guest_limit integer;

UPDATE events
SET guest_limit = 3
WHERE guest_limit IS NULL;

CREATE OR REPLACE FUNCTION enforce_free_guest_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  existing integer;
  allowed integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.event_id::text)::bigint);

  SELECT COALESCE(guest_limit, 3) INTO allowed
  FROM events
  WHERE id = NEW.event_id;

  IF allowed IS NULL OR allowed < 3 THEN
    allowed := 3;
  END IF;

  SELECT count(*)::integer INTO existing
  FROM guests
  WHERE event_id = NEW.event_id;

  IF existing >= allowed THEN
    RAISE EXCEPTION 'FREE_GUEST_LIMIT'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;
