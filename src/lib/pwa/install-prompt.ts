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

function clearPrompt(): void {
  deferredPrompt = null;
  const host = installWindow();
  if (host) host.__eventiaInstallPrompt = null;
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

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function isAndroidInAppBrowser(): boolean {
  if (!isAndroidDevice()) return false;
  const agent = navigator.userAgent || '';
  return /; wv\)|WhatsApp|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat/i.test(agent);
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

function openInChrome(url: string): void {
  const parsed = new URL(url, window.location.origin);
  const fallback = parsed.href;
  window.location.href = `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

export function launchInstalledApp(path?: string): void {
  if (path) rememberGuestEntry(path);
  const start = new URL('/', window.location.origin);
  start.searchParams.set('source', 'pwa');
  if (isStandalonePwa()) {
    window.location.replace(path && path.startsWith('/e/') ? path : start.pathname + start.search);
    return;
  }
  if (isAndroidDevice()) {
    const target = path && path.startsWith('/e/') ? new URL(path, window.location.origin) : start;
    window.location.href = `intent://${target.host}${target.pathname}${target.search}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(start.href)};end`;
    return;
  }
  window.location.href = start.href;
}

/** À appeler dans le clic, avant tout autre await, pour garder le geste Android. */
export function captureInstallClick(): Promise<'accepted' | 'dismissed' | 'standalone' | 'ios' | 'unavailable' | 'chrome'> {
  ensureInstallPromptListener();
  if (isStandalonePwa()) return Promise.resolve('standalone');
  if (isAndroidInAppBrowser()) {
    openInChrome(window.location.href);
    return Promise.resolve('chrome');
  }
  if (isIosDevice()) return Promise.resolve('ios');
  const event = currentPrompt();
  if (!event) return Promise.resolve('unavailable');
  return event.prompt().then(() => event.userChoice).then((choice) => {
    clearPrompt();
    return choice.outcome;
  });
}

export async function tryInstallPwa(): Promise<'accepted' | 'dismissed' | 'standalone' | 'ios' | 'unavailable' | 'chrome'> {
  return captureInstallClick();
}
