'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { TRIAL_INVITATIONS } from '@/constants/pricing';
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

export default function FreeWhatsAppButton() {
  const { user, loading } = useAuth();
  const phone = useAdminWhatsApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !isSupabaseReady()) {
      setVisible(true);
      return;
    }

    let cancelled = false;
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
        const paid = (events.data || []).some((row) => Number(row.guest_limit) > TRIAL_INVITATIONS);
        setVisible(!paid);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (!visible) return null;

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
