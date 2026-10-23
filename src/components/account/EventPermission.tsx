'use client';

import { FREE_EVENT_LIMIT } from '@/constants/pricing';
import { adminEventPermissionMessage } from '@/lib/whatsapp/admin-contact';
import { openAdminWhatsApp, useAdminWhatsApp } from '@/components/account/FreeWhatsAppButton';

export default function EventPermission({
  email,
  name,
}: {
  email?: string | null;
  name?: string | null;
}) {
  const phone = useAdminWhatsApp();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
        {FREE_EVENT_LIMIT} mariages au maximum
      </p>
      <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
        Pour en créer un autre, demandez la permission à l’admin.
      </p>
      <button
        type="button"
        onClick={() => {
          if (!openAdminWhatsApp(adminEventPermissionMessage(email, name), phone)) {
            window.location.href = '/pricing';
          }
        }}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold text-white"
        style={{ backgroundColor: '#25D366' }}
      >
        Demander la permission
      </button>
    </div>
  );
}
