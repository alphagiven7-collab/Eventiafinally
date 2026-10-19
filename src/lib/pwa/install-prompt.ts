type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenerAttached = false;

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function iosInstallHint(): string {
  return 'Sur iPhone ou iPad : touchez Partager, puis « Sur l’écran d’accueil ».';
}

export function ensureInstallPromptListener(): void {
  if (typeof window === 'undefined' || listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
}

export function hasInstallPrompt(): boolean {
  return deferredPrompt != null;
}

export async function tryInstallPwa(): Promise<'accepted' | 'dismissed' | 'standalone' | 'ios' | 'unavailable'> {
  ensureInstallPromptListener();
  if (isStandalonePwa()) return 'standalone';
  if (deferredPrompt) {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choice.outcome;
  }
  if (isIosDevice()) return 'ios';
  return 'unavailable';
}
