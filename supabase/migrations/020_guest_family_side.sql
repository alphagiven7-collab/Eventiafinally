ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS family_side TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guests_family_side_check'
      AND conrelid = 'public.guests'::regclass
  ) THEN
    ALTER TABLE guests
      ADD CONSTRAINT guests_family_side_check
      CHECK (family_side IN ('groom', 'bride'));
  END IF;
END
$$;
