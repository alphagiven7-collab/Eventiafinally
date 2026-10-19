type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallWindow = Window & { __eventiaInstallPrompt?: BeforeInstallPromptEvent | null };

const GUEST_ENTRY = 'eventia-guest-entry';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenerAttached = false;

function installWindow(): InstallWindow | null {
  if (typeof window === 'undefined') return null;
  return window as InstallWindow;
}

function currentPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt || installWindow()?.__eventiaInstallPrompt || null;
}

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
  const host = installWindow();
  if (host?.__eventiaInstallPrompt) deferredPrompt = host.__eventiaInstallPrompt;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    if (host) host.__eventiaInstallPrompt = deferredPrompt;
  });
}

export function hasInstallPrompt(): boolean {
  return currentPrompt() != null;
}

export function rememberGuestEntry(path: string): void {
  if (!path.startsWith('/e/')) return;
  try {
    localStorage.setItem(GUEST_ENTRY, path);
  } catch {
    /* le lien reste dans l’invitation enregistrée */
  }
}

export function readGuestEntry(): string {
  try {
    const value = localStorage.getItem(GUEST_ENTRY) || '';
    if (value.startsWith('/e/')) return value;
  } catch {
    /* stockage indisponible */
  }
  return '';
}

export async function tryInstallPwa(): Promise<'accepted' | 'dismissed' | 'standalone' | 'ios' | 'unavailable'> {
  ensureInstallPromptListener();
  if (isStandalonePwa()) return 'standalone';
  const promptEvent = currentPrompt();
  if (promptEvent) {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredPrompt = null;
    const host = installWindow();
    if (host) host.__eventiaInstallPrompt = null;
    return choice.outcome;
  }
  if (isIosDevice()) return 'ios';
  return 'unavailable';
}
