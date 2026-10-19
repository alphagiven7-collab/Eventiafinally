'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export default function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHelp, setIosHelp] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (sessionStorage.getItem('eventia-install-hidden') === '1') return;
    } catch {
      /* stockage indisponible */
    }
    setHidden(false);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIos()) setIosHelp(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || (!promptEvent && !iosHelp)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      sessionStorage.setItem('eventia-install-hidden', '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setPromptEvent(null);
    dismiss();
  };

  return (
    <div className="mb-4 rounded-2xl border border-violet-200 bg-white p-3 shadow-sm dark:border-violet-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Installer l’application</p>
          {promptEvent ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Ajoutez Eventia sur l’écran d’accueil de ce téléphone ou de cette tablette.</p>
          ) : (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Sur iPhone ou iPad : touchez Partager, puis « Sur l’écran d’accueil ».</p>
          )}
        </div>
        <button type="button" onClick={dismiss} className="text-xs text-gray-400" aria-label="Fermer">
          Fermer
        </button>
      </div>
      {promptEvent && (
        <button type="button" onClick={() => void install()} className="mt-3 min-h-11 w-full rounded-xl bg-violet-600 text-sm font-bold text-white">
          Installer l’application
        </button>
      )}
    </div>
  );
}
