'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { getEventBySlug } from '@/data/events';
import { fetchGuestLimitBySlug } from '@/lib/events/store';
import { isFreeGuestTier } from '@/lib/pricing/tier';
import {
  adminContactMessage,
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

export function openAdminWhatsApp(message: string, phone: string) {
  const url = whatsAppChatUrl(phone, message);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function useAdminWhatsApp() {
  const [phone, setPhone] = useState(adminWhatsAppDigits);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    void createClient().rpc('admin_whatsapp').then(({ data }) => {
      const digits = digitsOnly(typeof data === 'string' ? data : '');
      if (digits) setPhone(digits);
    });
  }, []);

  return phone;
}

async function guestLimitForInvitationSlug(slug: string): Promise<number | null | undefined> {
  if (isSupabaseReady()) {
    const hosted = await fetchGuestLimitBySlug(createClient(), slug);
    if (hosted != null) return hosted;
  }
  return getEventBySlug(slug)?.guestLimit;
}

export default function FreeWhatsAppButton() {
  const pathname = usePathname();

  // L’accueil possède son propre bouton de contact avec une bulle d’aide.
  if (pathname === '/') return null;

  return <ContextualWhatsAppButton key={pathname} />;
}

function ContextualWhatsAppButton() {
  const { user, loading } = useAuth();
  const phone = useAdminWhatsApp();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const invitationMatch = pathname.match(/^\/e\/([^/]+)/);
    if (invitationMatch) {
      const slug = decodeURIComponent(invitationMatch[1]);
      void guestLimitForInvitationSlug(slug).then((limit) => {
        if (!cancelled) setVisible(isFreeGuestTier(limit));
      });
      return () => {
        cancelled = true;
      };
    }

    if (!user || !isSupabaseReady()) {
      return;
    }

    const supabase = createClient();
    void supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (cancelled) return;
        if (data?.role === 'super_admin') {
          setVisible(false);
          return;
        }
        const events = await supabase.from('events').select('guest_limit').eq('user_id', user.id);
        if (cancelled) return;
        if (events.error) {
          setVisible(true);
          return;
        }
        const paid = (events.data || []).some((row) => !isFreeGuestTier(row.guest_limit));
        setVisible(!paid);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading, pathname]);

  const showContact = !loading && (visible || (!/^\/e\/[^/]+/.test(pathname) && (!user || !isSupabaseReady())));
  if (!showContact) return null;

  return (
    <button
      type="button"
      aria-label="Contacter l'admin sur WhatsApp"
      onClick={() => {
        if (!openAdminWhatsApp(adminContactMessage(), phone)) {
          window.location.href = '/pricing';
        }
      }}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
      style={{ backgroundColor: '#25D366' }}
    >
      <WhatsAppMark />
    </button>
  );
}
