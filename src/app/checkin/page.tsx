'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import QRScanner from '@/components/checkin/QRScanner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import { listInvitations } from '@/lib/events/store';
import { checkInGuest, CheckInResult, listAllEventGuests, lookupGuestByToken, tokenFromInviteLink } from '@/lib/guests/store';
import { cardBelongsToEvent, pickDefaultEvent } from '@/lib/guests/checkin-rules';
import { EventWithSettings, Guest } from '@/types';

const LAST_EVENT_KEY = 'eventia_checkin_event';

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <CheckInContent />
      </Suspense>
    </ProtectedRoute>
  );
}

type Arrival = {
  guest?: CheckInResult;
  message?: string;
  wrongEvent?: boolean;
  eventTitle?: string;
};

function arrivalCopy(result: Arrival) {
  const guest = result.guest;
  const table = guest?.tableNumber ? `Table ${guest.tableNumber}` : 'Sans table';
  if (result.wrongEvent) {
    return {
      tone: 'refused' as const,
      kicker: 'Autre mariage',
      title: 'Pas pour ce mariage',
      name: '',
      detail: '',
      message: `Cette carte appartient à un autre mariage. Vous accueillez actuellement : ${result.eventTitle || 'ce mariage'}.`,
    };
  }
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

function readStoredEvent(): string {
  try {
    return localStorage.getItem(LAST_EVENT_KEY) || '';
  } catch {
    return '';
  }
}

function CheckInContent() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(isSupabaseReady());
  const [chosenId, setChosenId] = useState(params.get('event') || '');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [inputMode, setInputMode] = useState<'scan' | 'manual' | 'name'>('scan');
  const [tokenInput, setTokenInput] = useState('');
  const [search, setSearch] = useState('');
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!user?.id || !isSupabaseReady()) return;
    let cancelled = false;
    listInvitations(createClient(), user.id).then((rows) => {
      if (cancelled) return;
      setEvents(rows);
      setLoadingEvents(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const eventId = useMemo(
    () => (events.length > 0 ? pickDefaultEvent(events, chosenId || readStoredEvent()) : ''),
    [events, chosenId],
  );
  const currentEvent = events.find((event) => event.id === eventId) || null;

  const refreshGuests = useCallback(async () => {
    if (!eventId || !isSupabaseReady()) return;
    const result = await listAllEventGuests(createClient(), eventId);
    if (!result.error) setGuests(result.guests);
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !isSupabaseReady()) return;
    let cancelled = false;
    listAllEventGuests(createClient(), eventId).then((result) => {
      if (!cancelled && !result.error) setGuests(result.guests);
    });
    return () => { cancelled = true; };
  }, [eventId]);

  const stats = useMemo(() => {
    const arrived = guests.filter((guest) => guest.checked_in_at).length;
    const confirmed = guests.filter((guest) => guest.status === 'confirmed').length;
    return {
      arrived,
      stillExpected: Math.max(0, confirmed - arrived),
      pending: guests.filter((guest) => guest.status === 'pending').length,
    };
  }, [guests]);

  const chooseEvent = (id: string) => {
    setChosenId(id);
    setGuests([]);
    setArrival(null);
    setScanning(false);
    try {
      localStorage.setItem(LAST_EVENT_KEY, id);
    } catch {
      /* le choix reste valable pour cette visite */
    }
  };

  const confirmArrival = async (raw: string) => {
    if (!eventId) {
      setArrival({ message: 'Choisissez d’abord le mariage à accueillir.' });
      return;
    }
    const token = tokenFromInviteLink(raw);
    if (!token || !isSupabaseReady()) {
      setArrival({ message: 'On ne trouve personne. Utilisez la carte d’entrée.' });
      return;
    }
    const client = createClient();
    const known = await lookupGuestByToken(client, token);
    if (!known) {
      setArrival({ message: 'Ce code ne correspond à aucun invité.' });
      return;
    }
    // Une carte ne vaut que pour le mariage auquel elle appartient.
    if (!cardBelongsToEvent(known.event_id, eventId)) {
      setArrival({ wrongEvent: true, eventTitle: currentEvent?.title });
      return;
    }
    if (known.status !== 'confirmed') {
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
    const result = await checkInGuest(client, token, eventId);
    if (result.wrongEvent) {
      setArrival({ wrongEvent: true, eventTitle: currentEvent?.title });
      return;
    }
    if (result.error || !result.guest) {
      setArrival({ message: result.error || 'On ne trouve personne.' });
      return;
    }
    setArrival({ guest: result.guest });
    void refreshGuests();
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
    setSearch('');
    if (inputMode === 'scan') setScanning(true);
  };

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];
    return guests.filter((guest) => guest.name.toLowerCase().includes(query)).slice(0, 8);
  }, [guests, search]);

  const tab = (mode: 'scan' | 'manual' | 'name', label: string) => (
    <button
      type="button"
      onClick={() => {
        setInputMode(mode);
        setScanning(false);
      }}
      className={`min-h-11 rounded-xl text-sm font-semibold transition ${
        inputMode === mode ? 'bg-[#1A1A2E] text-white' : 'text-[#6B5B4F]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F4F0]">
      <header className="bg-[#1A1A2E] px-5 py-4 text-white">
        <div className="mx-auto w-full max-w-md">
          <Link href="/dashboard" className="inline-flex text-sm font-semibold underline underline-offset-4">
            Retour aux mariages
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Accueillir les invités</h1>
          {events.length > 1 ? (
            <div className="mt-3">
              <label htmlFor="checkin-event" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Mariage accueilli
              </label>
              <select
                id="checkin-event"
                value={eventId}
                onChange={(e) => chooseEvent(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white outline-none"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id} className="text-[#1A1A2E]">
                    {event.title}{event.is_published ? '' : ' (brouillon)'}
                  </option>
                ))}
              </select>
            </div>
          ) : currentEvent ? (
            <p className="mt-1 text-sm font-semibold text-white/90">{currentEvent.title}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            Seules les cartes de ce mariage sont acceptées.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
        {!loadingEvents && events.length === 0 ? (
          <section className="rounded-[28px] border border-[#E8E0D8] bg-white px-5 py-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-[#1A1A2E]">Aucun mariage à accueillir</h2>
            <p className="mt-2 text-sm text-[#6B5B4F]">Créez d’abord une invitation, puis revenez ici le jour J.</p>
            <Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1A1A2E] px-5 text-sm font-bold text-white">
              Mes mariages
            </Link>
          </section>
        ) : arrival ? (
          <ArrivalMessage result={arrival} onNext={scanNext} />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2" aria-live="polite">
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-emerald-600">{stats.arrived}</p>
                <p className="text-[11px] font-semibold text-[#6B5B4F]">Arrivés</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-[#1A1A2E]">{stats.stillExpected}</p>
                <p className="text-[11px] font-semibold text-[#6B5B4F]">Encore attendus</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-amber-600">{stats.pending}</p>
                <p className="text-[11px] font-semibold text-[#6B5B4F]">Sans réponse</p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 shadow-sm">
              {tab('scan', 'Caméra')}
              {tab('manual', 'Code')}
              {tab('name', 'Nom')}
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
                  disabled={scanning || !eventId}
                  className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#1A1A2E] text-sm font-bold text-white disabled:opacity-50"
                >
                  {scanning ? 'Caméra ouverte…' : 'Ouvrir la caméra'}
                </button>
              </section>
            ) : inputMode === 'manual' ? (
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
                  disabled={!eventId}
                  className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#1A1A2E] text-sm font-bold text-white disabled:opacity-50"
                >
                  Faire entrer
                </button>
              </section>
            ) : (
              <section className="flex flex-col items-stretch rounded-[28px] border border-[#E8E0D8] bg-white px-5 py-6 shadow-sm">
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Carte oubliée</p>
                <h2 className="mt-2 text-center text-2xl text-[#1A1A2E]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Chercher par nom
                </h2>
                <label htmlFor="checkin-name" className="mt-5 text-sm font-semibold text-[#1A1A2E]">
                  Nom de l’invité
                </label>
                <input
                  id="checkin-name"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Au moins 2 lettres"
                  className="mt-2 w-full rounded-2xl border border-[#E8E0D8] bg-[#F8F4F0] px-4 py-3 text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <ul className="mt-4 space-y-2">
                  {matches.map((guest) => (
                    <li key={guest.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8F4F0] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1A1A2E]">{guest.name}</p>
                        <p className="text-[11px] text-[#6B5B4F]">
                          {guest.table_number ? `Table ${guest.table_number}` : 'Sans table'}
                          {guest.checked_in_at ? ' · Déjà entré' : guest.status === 'confirmed' ? ' · Confirmé' : guest.status === 'declined' ? ' · A dit non' : ' · Sans réponse'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void confirmArrival(guest.token)}
                        className="min-h-10 shrink-0 rounded-xl bg-[#1A1A2E] px-3 text-xs font-bold text-white"
                      >
                        Faire entrer
                      </button>
                    </li>
                  ))}
                  {search.trim().length >= 2 && matches.length === 0 && (
                    <li className="px-1 text-center text-sm text-[#6B5B4F]">Aucun invité de ce mariage ne porte ce nom.</li>
                  )}
                </ul>
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
