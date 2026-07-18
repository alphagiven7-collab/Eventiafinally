'use client';

import { usePWA } from '@/hooks/usePWA';

export function PWAActivator() {
  usePWA();
  return null;
}