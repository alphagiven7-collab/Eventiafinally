'use client';

import { useEffect, useState } from 'react';
import {
  ensureInstallPromptListener,
  hasInstallPrompt,
  iosInstallHint,
  isIosDevice,
  isStandalonePwa,
  tryInstallPwa,
} from '@/lib/pwa/install-prompt';

export default function InstallApp() {
  const [canInstall, setCanInstall] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalonePwa()) return;
    try {
      if (sessionStorage.getItem('eventia-install-hidden') === '1') return;
    } catch {
      /* stockage indisponible */
    }
    ensureInstallPromptListener();
    setHidden(false);
    setCanInstall(hasInstallPrompt());
    const onPrompt = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIosDevice()) setIosHelp(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || (!canInstall && !iosHelp)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      sessionStorage.setItem('eventia-install-hidden', '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    const outcome = await tryInstallPwa();
    if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
  };

  return (
    <div className="mb-4 rounded-2xl border border-violet-200 bg-white p-3 shadow-sm dark:border-violet-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Installer l’application</p>
          {canInstall ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Ajoutez Eventia sur l’écran d’accueil de ce téléphone ou de cette tablette.</p>
          ) : (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{iosInstallHint()}</p>
          )}
        </div>
        <button type="button" onClick={dismiss} className="text-xs text-gray-400" aria-label="Fermer">
          Fermer
        </button>
      </div>
      {canInstall && (
        <button type="button" onClick={() => void install()} className="mt-3 min-h-11 w-full rounded-xl bg-violet-600 text-sm font-bold text-white">
          Installer l’application
        </button>
      )}
    </div>
  );
}
