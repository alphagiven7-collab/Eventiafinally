'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import {
  formatUsd,
  GUEST_PACKS,
  guestCapacity,
  packTotalUsd,
  PRICE_PER_GUEST_USD,
  TRIAL_INVITATIONS,
} from '@/constants/pricing';
import { ThemeToggle } from '@/providers/theme-toggle';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import {
  adminContactMessage,
  adminPaymentMessage,
  adminWhatsAppDigits,
  digitsOnly,
  whatsAppChatUrl,
} from '@/lib/whatsapp/admin-contact';

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-white">
      <path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l5.9-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.7.7-3.4-.2-.3A9 9 0 1 1 12 21zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.5 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z" />
    </svg>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [guests, setGuests] = useState(100);
  const [phone, setPhone] = useState(adminWhatsAppDigits);
  const [missingNumber, setMissingNumber] = useState(false);
  const count = Math.max(0, Math.floor(Number.isFinite(guests) ? guests : 0));
  const total = useMemo(() => packTotalUsd(count), [count]);
  const unit = formatUsd(PRICE_PER_GUEST_USD);
  const name = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const paymentUrl = whatsAppChatUrl(phone, adminPaymentMessage(count, user?.email, name));
  const contactUrl = whatsAppChatUrl(phone, adminContactMessage());

  useEffect(() => {
    if (!isSupabaseReady()) return;
    const supabase = createClient();
    void supabase.rpc('admin_whatsapp').then(({ data }) => {
      const digits = digitsOnly(typeof data === 'string' ? data : '');
      if (digits) setPhone(digits);
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseReady() || !user?.id) return;
    void createClient()
      .from('users')
      .select('phone, role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === 'super_admin') {
          const digits = digitsOnly(data.phone);
          if (digits) setPhone(digits);
        }
      });
  }, [user?.id]);

  const openWhatsApp = (url: string | null) => {
    if (!url) {
      setMissingNumber(true);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-rose-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold">Eventia</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="px-3 py-2 text-xs font-semibold bg-violet-600 text-white rounded-xl">
              Événements
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-2">Offres</p>
          <h1 className="text-3xl font-extrabold">{unit} par invité</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Les {TRIAL_INVITATIONS} invitations d&apos;essai s&apos;ajoutent au forfait. Un forfait de 50 invités garde ses 50 places, et les {TRIAL_INVITATIONS} invitations d&apos;essai en plus.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {GUEST_PACKS.map((pack) => (
            <button
              key={pack}
              type="button"
              onClick={() => setGuests(pack)}
              className={`min-h-12 text-left rounded-2xl border p-3 bg-white dark:bg-gray-900 ${
                count === pack ? 'border-rose-400' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-xs font-semibold">{pack} invités</p>
              <p className="text-lg font-extrabold mt-1">{formatUsd(packTotalUsd(pack))}</p>
              <p className="text-[10px] text-gray-500 mt-1">+ {TRIAL_INVITATIONS} d&apos;essai</p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <label htmlFor="guest-count" className="block text-xs font-semibold text-gray-500 mb-2">
            Nombre d&apos;invités du forfait
          </label>
          <input
            id="guest-count"
            type="number"
            min={1}
            inputMode="numeric"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-lg bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-rose-400"
          />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {count} × {unit}
            {count > 200 ? '. Au-delà de 200, le total suit le nombre choisi.' : ''}
          </p>
          <p className="text-4xl font-extrabold mt-1">{formatUsd(total)}</p>
          <p className="mt-2 pr-16 text-xs text-gray-500">
            {count} places payées + {TRIAL_INVITATIONS} invitations d&apos;essai = {guestCapacity(count)} places.
            Le paiement se confirme avec l&apos;admin sur WhatsApp.
          </p>
          {missingNumber && (
            <p className="mt-3 text-sm text-rose-600">
              Le numéro WhatsApp de l&apos;admin n&apos;est pas encore enregistré. Il se règle dans Profil.
            </p>
          )}
          <button
            type="button"
            onClick={() => openWhatsApp(paymentUrl)}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold text-white"
            style={{ backgroundColor: '#25D366' }}
          >
            Payer {count} invités · {formatUsd(total)}
          </button>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              'RSVP, tables et carte d’entrée',
              'Deux modèles d’invitation',
              'Brouillon, aperçu, puis publication',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex min-h-12 w-[calc(100%-4.5rem)] items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-bold text-white"
          >
            Retourner aux événements
          </Link>
        </div>
      </main>
      <button
        type="button"
        onClick={() => openWhatsApp(contactUrl)}
        aria-label="Contacter l'admin sur WhatsApp"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor: '#25D366' }}
      >
        <WhatsAppMark />
      </button>
    </div>
  );
}
