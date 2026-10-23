'use client';

import { useState } from 'react';
import Link from 'next/link';

function promotionSql(email: string): string {
  const safeEmail = email.replace(/'/g, "''");
  const target = safeEmail || 'ADRESSE_UTILISEE_A_L_INSCRIPTION';
  return `UPDATE public.users
SET role = 'super_admin'
WHERE email = '${target}';

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Super admin manage all users" ON public.users;
CREATE POLICY "Super admin manage all users" ON public.users
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin reads all events" ON public.events;
CREATE POLICY "Super admin reads all events" ON public.events
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin reads all guests" ON public.guests;
CREATE POLICY "Super admin reads all guests" ON public.guests
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin reads all rsvps" ON public.rsvps;
CREATE POLICY "Super admin reads all rsvps" ON public.rsvps
  FOR SELECT USING (public.is_super_admin());

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

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Super admin deletes events" ON public.events;
CREATE POLICY "Super admin deletes events" ON public.events
  FOR DELETE USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages event settings" ON public.event_settings;
CREATE POLICY "Super admin manages event settings" ON public.event_settings
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
DROP POLICY IF EXISTS "Users view own events" ON public.events;
CREATE POLICY "Users view own events" ON public.events
  FOR SELECT USING (
    auth.uid() = user_id
    OR (is_published = true AND COALESCE(is_blocked, false) = false)
  );

DROP POLICY IF EXISTS "Public read published settings" ON public.event_settings;
CREATE POLICY "Public read published settings" ON public.event_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_settings.event_id
        AND events.is_published = true
        AND COALESCE(events.is_blocked, false) = false
    )
  );

CREATE OR REPLACE FUNCTION public.admin_unlock_event(p_event_id uuid, p_guest_limit integer, p_note text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;
  UPDATE public.events
  SET guest_limit = p_guest_limit,
      payment_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
      updated_at = now()
  WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  UPDATE public.event_settings
  SET payload = jsonb_set(COALESCE(payload, '{}'::jsonb), '{guestLimit}', to_jsonb(p_guest_limit), true)
  WHERE event_id = p_event_id;
  RETURN p_guest_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_event_blocked(p_event_id uuid, p_blocked boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;
  UPDATE public.events SET is_blocked = COALESCE(p_blocked, false), updated_at = now() WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  RETURN COALESCE(p_blocked, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_event(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;
  DELETE FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_unlock_event(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_event_blocked(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_unlock_event(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_event_blocked(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_event(uuid) TO authenticated;

DROP POLICY IF EXISTS "Super admin inserts events" ON public.events;
CREATE POLICY "Super admin inserts events" ON public.events
  FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages guests" ON public.guests;
CREATE POLICY "Super admin manages guests" ON public.guests
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages rsvps" ON public.rsvps;
CREATE POLICY "Super admin manages rsvps" ON public.rsvps
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

NOTIFY pgrst, 'reload schema';`;
}

export default function AdminAccess({
  email,
  onRetry,
}: {
  email?: string | null;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const sql = promotionSql(email || '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Eventia</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Administration</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Vous êtes connecté avec <span className="font-semibold break-all">{email || 'votre compte'}</span>.
          L’e-mail et le mot de passe sont ceux de l’inscription. Ce compte est encore organisateur.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Dans Supabase, ouvrez SQL Editor, collez ce script, puis lancez-le. Revenez ici et touchez Vérifier mon accès.
        </p>
        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-gray-900 p-4 text-[11px] leading-relaxed text-gray-100">
          {sql}
        </pre>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="min-h-12 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
          >
            {copied ? 'Script copié' : 'Copier le script'}
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-12 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-700 dark:border-violet-800 dark:bg-gray-800 dark:text-violet-200"
          >
            Vérifier mon accès
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300"
          >
            Retour aux mariages
          </Link>
        </div>
      </div>
    </div>
  );
}
