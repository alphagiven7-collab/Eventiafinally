'use client';

import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('[PWA] Service Worker enregistré'))
      .catch(() => console.log('[PWA] Service Worker non enregistré (dev mode)'));
  }, []);
}