'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PIXEL_ID, trackPixel, trackPixelCustom } from '@/lib/analytics/pixel';

function clickEventFor(link: HTMLAnchorElement): (() => void) | null {
  const href = link.getAttribute('href') || '';
  if (/wa\.me|api\.whatsapp\.com/.test(href)) return () => trackPixel('Contact', { channel: 'whatsapp' });
  if (href.startsWith('/pricing')) return () => trackPixel('InitiateCheckout', { content_name: 'offres' });
  if (href.startsWith('/exemples')) return () => trackPixelCustom('ViewGallery');
  if (href.startsWith('/e/') && ['/', '/exemples'].includes(window.location.pathname)) return () => trackPixelCustom('ViewExample');
  if (href.startsWith('/create/')) return () => trackPixelCustom('StartCreation');
  return null;
}

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    trackPixel('PageView');
  }, [pathname]);

  useEffect(() => {
    if (!PIXEL_ID) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a');
      if (link instanceof HTMLAnchorElement) clickEventFor(link)?.();
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
