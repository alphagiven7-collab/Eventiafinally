-- Le numéro WhatsApp du super admin est lisible depuis la page Offres.
-- Seul le numéro est exposé, afin que l'organisateur puisse écrire pour payer.

CREATE OR REPLACE FUNCTION public.admin_whatsapp()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT NULLIF(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), '')
  FROM public.users
  WHERE role = 'super_admin'
    AND phone IS NOT NULL
    AND btrim(phone) <> ''
  ORDER BY created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.admin_whatsapp() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_whatsapp() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
