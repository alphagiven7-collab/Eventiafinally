-- L'administration peut modifier un événement, notamment la limite
-- d'invités après un paiement, et noter comment le paiement a été reçu.

DROP POLICY IF EXISTS "Super admin updates events" ON public.events;
CREATE POLICY "Super admin updates events" ON public.events
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS guest_limit integer;

UPDATE public.events
SET guest_limit = 3
WHERE guest_limit IS NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_note text;

NOTIFY pgrst, 'reload schema';
