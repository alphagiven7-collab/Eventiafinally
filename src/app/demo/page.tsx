'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import InvitationExperience from '@/components/invitation/InvitationExperience';
import { DemoGuest, LiveDemo, readLiveDemo, writeLiveDemo } from '@/lib/demo/session';
import { FREE_DEMO_GUEST_LIMIT, demoGuestLimitMessage, formatUsd, PRICE_PER_GUEST_USD } from '@/constants/pricing';

export default function DemoPage() {
  const [demo, setDemo] = useState<LiveDemo | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [activeGuest, setActiveGuest] = useState<string | undefined>();

  useEffect(() => {
    setDemo(readLiveDemo());
    setReady(true);
  }, []);

  const persist = (next: LiveDemo) => {
    const result = writeLiveDemo(next);
    if (result.error) {
      setNotice(result.error);
      return;
    }
    setDemo(next);
  };

  const addGuest = () => {
    if (!demo) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (demo.guests.length >= FREE_DEMO_GUEST_LIMIT) {
      setNotice(demoGuestLimitMessage());
      return;
    }
    const guest: DemoGuest = { id: crypto.randomUUID(), name: trimmed };
    persist({ ...demo, guests: [...demo.guests, guest] });
    setActiveGuest(trimmed);
    setName('');
    setNotice('');
  };

  if (!ready || !demo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f6]">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Démo visible seulement ici</h1>
          <p className="text-sm text-gray-600 mb-4">
            Une démo n&apos;est pas enregistrée et ne se partage pas. Cet écran ne montre la démo que là où elle vient d&apos;être créée.
          </p>
          {ready && (
            <Link href="/create/wedding" className="inline-block bg-rose-500 text-white py-3 px-6 rounded-xl text-sm font-semibold">
              Créer une démo
            </Link>
          )}
        </div>
      </div>
    );
  }

  const blocked = demo.guests.length >= FREE_DEMO_GUEST_LIMIT;

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-amber-950">Démo privée, non partageable</p>
          <p className="text-xs text-amber-900 mt-1">
            Visible seulement ici, le temps de cet onglet. Rien n&apos;est enregistré. Au-delà de {FREE_DEMO_GUEST_LIMIT} invités, la démo s&apos;arrête. L&apos;envoi du lien commence à {formatUsd(PRICE_PER_GUEST_USD)} par invité.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Invités de test {demo.guests.length}/{FREE_DEMO_GUEST_LIMIT}
          </p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom pour l'aperçu"
              disabled={blocked}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={addGuest}
              disabled={blocked}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              Voir
            </button>
          </div>
          {blocked && <p className="text-xs text-rose-700 mt-2">{demoGuestLimitMessage()}</p>}
          {notice && !blocked && <p className="text-xs text-rose-700 mt-2">{notice}</p>}
          {demo.guests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {demo.guests.map((guest) => (
                <button
                  key={guest.id}
                  type="button"
                  onClick={() => setActiveGuest(guest.name)}
                  className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700"
                >
                  {guest.name}
                </button>
              ))}
            </div>
          )}
          <Link href="/pricing" className="inline-block mt-3 text-xs font-semibold text-rose-600">
            Enregistrer et partager cette invitation
          </Link>
        </div>
      </div>

      <InvitationExperience event={demo.event} guestName={activeGuest} />
    </div>
  );
}
