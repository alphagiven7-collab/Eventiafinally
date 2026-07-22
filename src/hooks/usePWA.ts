'use client';

import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Désactiver et supprimer les anciens service workers pour corriger
    // le bug de rechargement infini sur Safari 15 (iPhone 7 Plus)
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });

    // Vider le cache existant
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  }, []);
}
