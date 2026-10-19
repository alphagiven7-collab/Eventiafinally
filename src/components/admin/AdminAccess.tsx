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
            Retour aux événements
          </Link>
        </div>
      </div>
    </div>
  );
}
