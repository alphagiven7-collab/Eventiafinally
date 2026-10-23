'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, Eye, MapPin } from 'lucide-react';
import { ThemeToggle } from '@/providers/theme-toggle';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { listGalleryInvitations, type GalleryItem } from '@/lib/events/store';

export default function ExamplesPage() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    let cancelled = false;
    listGalleryInvitations(createClient()).then((rows) => {
      if (!cancelled) setItems(rows);
    });
    return () => { cancelled = true; };
  }, []);

  const loading = items === null && isSupabaseReady();

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-base font-bold">Eventia</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/create/wedding" className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
              Créer mon invitation
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500">Galerie</p>
        <h1 className="text-3xl font-extrabold leading-tight">Les invitations créées avec Eventia</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Des mariages réels, partagés par leurs auteurs. Ouvrez une carte pour voir l’invitation, en lecture seule.
        </p>

        {loading && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        )}

        {!loading && (!items || items.length === 0) && (
          <div className="mt-10 rounded-3xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 dark:border-gray-700">
            Aucune invitation n’est encore partagée dans la galerie.
          </div>
        )}

        {items && items.length > 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/e/${item.slug}`}
                className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="relative h-44 bg-gradient-to-br from-violet-100 via-rose-50 to-amber-50 dark:from-violet-950 dark:via-gray-900 dark:to-gray-900">
                  {item.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    <Eye className="h-3 w-3" />
                    Lecture seule
                  </span>
                </div>
                <div className="space-y-1.5 p-4">
                  <h2 className="truncate text-base font-bold">{item.title}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {item.event_date && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    {item.location && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
