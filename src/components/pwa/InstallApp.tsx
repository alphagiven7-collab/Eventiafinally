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

export default function InstallApp() {
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    ensureInstallPromptListener();
    setStandalone(isStandalonePwa());
    setIos(isIosDevice());
  }, []);

  if (standalone) return null;

  const install = () => {
    const outcome = captureInstallClick();
    void outcome.then((result) => {
      if (result === 'accepted' || result === 'standalone') launchInstalledApp();
      else if (result === 'ios') window.alert(iosInstallHint());
    });
  };

  return (
    <div className="mb-4 rounded-2xl border border-violet-200 bg-white p-3 shadow-sm dark:border-violet-800 dark:bg-gray-900">
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Installer l’application</p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
        Eventia s’ouvre ensuite depuis l’écran d’accueil, avec votre compte déjà ouvert.
      </p>
      {ios && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{iosInstallHint()}</p>}
      <button type="button" onClick={() => void install()} className="mt-3 min-h-11 w-full rounded-xl bg-violet-600 text-sm font-bold text-white">
        Installer l’application
      </button>
    </div>
  );
}
