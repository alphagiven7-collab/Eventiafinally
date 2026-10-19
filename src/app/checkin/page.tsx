'use client';

import { useState } from 'react';
import Link from 'next/link';
import QRScanner from '@/components/checkin/QRScanner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { checkInGuest, CheckInResult, lookupGuestByToken, tokenFromInviteLink } from '@/lib/guests/store';

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInContent />
    </ProtectedRoute>
  );
}

type Arrival = {
  guest?: CheckInResult;
  message?: string;
};

function arrivalCopy(result: Arrival) {
  const guest = result.guest;
  const table = guest?.tableNumber ? `Table ${guest.tableNumber}` : 'Sans table';
  if (!guest) {
    return {
      tone: 'refused' as const,
      kicker: 'Pas reconnu',
      title: 'Ce code ne marche pas',
      name: '',
      detail: '',
      message: result.message || 'Ce n’est pas une carte d’entrée. Demandez le message reçu des mariés.',
    };
  }
  if (guest.status === 'declined') {
    return {
      tone: 'refused' as const,
      kicker: 'A dit non',
      title: 'Ne peut pas venir',
      name: guest.name,
      detail: table,
      message: 'Cette personne a répondu qu’elle ne viendrait pas.',
    };
  }
  if (guest.status !== 'confirmed') {
    return {
      tone: 'waiting' as const,
      kicker: 'Pas encore dit oui',
      title: 'Attendez',
      name: guest.name,
      detail: table,
      message: 'Cette personne n’a pas confirmé. Demandez-lui d’ouvrir son invitation et de dire qu’elle vient.',
    };
  }
  if (guest.alreadyInside) {
    return {
      tone: 'known' as const,
      kicker: 'Déjà là',
      title: 'Bon retour',
      name: guest.name,
      detail: table,
      message: 'Cette personne est déjà entrée. Laissez-la passer.',
    };
  }
  return {
    tone: 'welcome' as const,
    kicker: 'C’est bon',
    title: 'Bienvenue',
    name: guest.name,
    detail: table,
    message: 'La place est prête. Vous pouvez entrer.',
  };
}

function CheckInContent() {
  const [inputMode, setInputMode] = useState<'scan' | 'manual'>('scan');
  const [tokenInput, setTokenInput] = useState('');
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [scanning, setScanning] = useState(false);

  const confirmArrival = async (raw: string) => {
    const token = tokenFromInviteLink(raw);
    if (!token || !isSupabaseReady()) {
      setArrival({ message: 'On ne trouve personne. Utilisez la carte d’entrée.' });
      return;
    }
    const client = createClient();
    const known = await lookupGuestByToken(client, token);
    if (known && known.status !== 'confirmed') {
      setArrival({
        guest: {
          name: known.name,
          tableNumber: known.table_number,
          status: known.status,
          alreadyInside: false,
        },
      });
      return;
    }
    const result = await checkInGuest(client, token);
    if (result.error || !result.guest) {
      setArrival({ message: result.error || 'On ne trouve personne.' });
      return;
    }
    setArrival({ guest: result.guest });
  };

  const handleManualCheckin = () => {
    if (!tokenInput.trim()) return;
    void confirmArrival(tokenInput);
    setTokenInput('');
  };

  const handleScanSuccess = (decodedText: string) => {
    setScanning(false);
    void confirmArrival(decodedText);
  };

  const scanNext = () => {
    setArrival(null);
    setTokenInput('');
    if (inputMode === 'scan') setScanning(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F4F0]">
      <header className="bg-[#1A1A2E] px-5 py-4 text-white">
        <div className="mx-auto w-full max-w-md">
          <Link href="/dashboard" className="inline-flex text-sm font-semibold underline underline-offset-4">
            Retour aux événements
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Accueillir les invités</h1>
          <p className="mt-1 text-sm leading-relaxed text-white/80">
            Scannez la carte sur le téléphone, ou celle qui a été enregistrée.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
        {arrival ? (
          <ArrivalMessage result={arrival} onNext={scanNext} />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setInputMode('scan')}
                className={`min-h-11 rounded-xl text-sm font-semibold transition ${
                  inputMode === 'scan' ? 'bg-[#1A1A2E] text-white' : 'text-[#6B5B4F]'
                }`}
              >
                Caméra
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('manual');
                  setScanning(false);
                }}
                className={`min-h-11 rounded-xl text-sm font-semibold transition ${
                  inputMode === 'manual' ? 'bg-[#1A1A2E] text-white' : 'text-[#6B5B4F]'
                }`}
              >
                Écrire
              </button>
            </div>

            {inputMode === 'scan' ? (
              <section className="flex flex-col items-center rounded-[28px] border border-[#E8E0D8] bg-white px-5 py-6 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">À l’entrée</p>
                <h2 className="mt-2 text-2xl text-[#1A1A2E]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Scannez la carte
                </h2>
                <div className="relative mt-5 aspect-square w-full overflow-hidden rounded-2xl bg-[#F8F4F0]">
                  {scanning ? (
                    <QRScanner onScanSuccess={handleScanSuccess} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-6">
                      <p className="text-sm leading-relaxed text-[#6B5B4F]">La caméra s’ouvre ici.</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  disabled={scanning}
                  className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#1A1A2E] text-sm font-bold text-white disabled:opacity-50"
                >
                  {scanning ? 'Caméra ouverte…' : 'Ouvrir la caméra'}
                </button>
              </section>
            ) : (
              <section className="flex flex-col items-stretch rounded-[28px] border border-[#E8E0D8] bg-white px-5 py-6 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Sans caméra</p>
                <h2 className="mt-2 text-2xl text-[#1A1A2E]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Coller le code
                </h2>
                <label htmlFor="checkin-token" className="mt-5 text-left text-sm font-semibold text-[#1A1A2E]">
                  Code ou lien
                </label>
                <input
                  id="checkin-token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Collez le code ici"
                  className="mt-2 w-full rounded-2xl border border-[#E8E0D8] bg-[#F8F4F0] px-4 py-3 text-center text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleManualCheckin}
                  className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#1A1A2E] text-sm font-bold text-white"
                >
                  Faire entrer
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ArrivalMessage({ result, onNext }: { result: Arrival; onNext: () => void }) {
  const copy = arrivalCopy(result);
  const tone = {
    welcome: 'border-[#D4AF37] bg-[#FFFDF8]',
    known: 'border-[#E8E0D8] bg-white',
    waiting: 'border-[#E8C872] bg-[#FFF8E8]',
    refused: 'border-[#E7C1B8] bg-[#FFF6F4]',
  }[copy.tone];

  return (
    <section className={`flex min-h-[70vh] flex-col items-center justify-center rounded-[28px] border px-6 py-10 text-center shadow-sm ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6B5B4F]">{copy.kicker}</p>
      <h2
        className="mt-3 max-w-xs text-4xl leading-tight text-[#1A1A2E]"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {copy.title}
      </h2>
      {copy.name ? (
        <p className="mt-5 max-w-xs text-xl font-semibold leading-snug text-[#1A1A2E]">{copy.name}</p>
      ) : null}
      {copy.detail ? (
        <p className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[#F8F4F0] px-4 text-sm font-semibold text-[#6B5B4F]">
          {copy.detail}
        </p>
      ) : null}
      <p className="mt-5 max-w-xs text-base leading-relaxed text-[#1A1A2E]">{copy.message}</p>
      <button
        type="button"
        onClick={onNext}
        className="mt-8 flex min-h-12 w-full max-w-xs items-center justify-center rounded-2xl bg-[#1A1A2E] text-sm font-bold text-white"
      >
        Personne suivante
      </button>
    </section>
  );
}
