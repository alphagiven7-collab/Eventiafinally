type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

// L'identifiant d'un pixel est public (visible dans le code de toute page). La variable d'environnement le remplace si besoin.
const DEFAULT_PIXEL_ID = '292383073559162';

export const PIXEL_ID = /^\d{5,20}$/.test(process.env.NEXT_PUBLIC_FB_PIXEL_ID || '')
  ? (process.env.NEXT_PUBLIC_FB_PIXEL_ID as string)
  : DEFAULT_PIXEL_ID;

function send(kind: 'track' | 'trackCustom', name: string, params?: Record<string, unknown>) {
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  // Les pages d'administration ne comptent jamais dans les statistiques publicitaires.
  if (window.location.pathname.startsWith('/admin')) return;
  try {
    window.fbq(kind, name, params);
  } catch {
    /* le suivi ne doit jamais gêner le site */
  }
}

/** Événement standard Meta : PageView, Lead, Contact, InitiateCheckout, CompleteRegistration, Purchase… */
export function trackPixel(name: string, params?: Record<string, unknown>) {
  send('track', name, params);
}

/** Événement personnalisé, visible dans le Gestionnaire d'événements. */
export function trackPixelCustom(name: string, params?: Record<string, unknown>) {
  send('trackCustom', name, params);
}

/** Envoie l'événement une seule fois par navigateur et par clé (ex. un mariage débloqué). */
export function trackPixelOnce(key: string, send_: () => void) {
  if (!PIXEL_ID || typeof window === 'undefined') return;
  const storageKey = `eventia-pixel:${key}`;
  try {
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, '1');
  } catch {
    return;
  }
  send_();
}

/** Code de base Meta : crée la file d'attente `fbq`, puis charge le script en différé. */
export function pixelBootstrap(id: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');`;
}
