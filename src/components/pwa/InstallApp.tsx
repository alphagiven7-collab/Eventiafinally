'use client';

import { useEffect, useState } from 'react';
import {
  captureInstallClick,
  ensureInstallPromptListener,
  iosInstallHint,
  isIosDevice,
  isStandalonePwa,
  launchInstalledApp,
} from '@/lib/pwa/install-prompt';

const INSTALL_CARD_KEY = 'eventia-hide-install-card';

export default function InstallApp() {
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    ensureInstallPromptListener();
    setStandalone(isStandalonePwa());
    setIos(isIosDevice());
    try {
      setDismissed(localStorage.getItem(INSTALL_CARD_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (standalone || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INSTALL_CARD_KEY, '1');
    } catch {
      /* la carte reste masquée pour cette visite */
    }
  };

  const install = () => {
    const outcome = captureInstallClick();
    void outcome.then((result) => {
      if (result === 'accepted' || result === 'standalone') launchInstalledApp();
      else if (result === 'ios') window.alert(iosInstallHint());
    });
  };

  return (
    <div className="relative mb-4 rounded-2xl border border-violet-200 bg-white p-3 pr-12 shadow-sm dark:border-violet-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Retirer la carte d’installation"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        ×
      </button>
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Mettre Eventia sur le téléphone</p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
        Elle s’ouvre ensuite depuis l’écran d’accueil, avec votre compte déjà prêt.
      </p>
      {ios && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{iosInstallHint()}</p>}
      <button type="button" onClick={() => void install()} className="mt-3 min-h-11 w-full rounded-xl bg-violet-600 text-sm font-bold text-white">
        Installer
      </button>
    </div>
  );
}
