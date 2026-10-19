'use client';

import { useEffect } from 'react';
import { ensureInstallPromptListener } from '@/lib/pwa/install-prompt';

export function usePWA() {
  useEffect(() => {
    ensureInstallPromptListener();
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let cancelled = false;

    async function register() {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (cancelled) return;
      await Promise.all(registrations
        .filter((registration) => !registration.active?.scriptURL.endsWith('/sw.js')
          && !registration.installing?.scriptURL.endsWith('/sw.js')
          && !registration.waiting?.scriptURL.endsWith('/sw.js'))
        .map((registration) => registration.unregister()));
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    }

    register().catch(() => {
      /* l’installation PWA reste optionnelle */
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
