'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Share2, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { WhatsAppGlyph } from '@/components/landing/WhatsAppFloat';

interface ShareInvitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  eventId?: string;
}

export function ShareInvitationDialog({ isOpen, onClose, slug, title, eventId }: ShareInvitationDialogProps) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const link = `${origin}/e/${slug}`;
  const message = `Découvrez l’invitation : ${title}\n${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copiez ce lien :', link);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title, text: `Découvrez l’invitation : ${title}`, url: link });
    } catch {
      /* partage annulé */
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { setCopied(false); onClose(); }} title="Partager l’invitation">
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Liens personnels</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-100/80">
                Créez un lien par invité, avec son nom et sa table. Il pourra confirmer sa présence et recevoir sa carte d’entrée.
              </p>
            </div>
          </div>
          <Link
            href={eventId ? `/dashboard/invites?event=${encodeURIComponent(eventId)}&tool=add` : '/dashboard/invites'}
            onClick={onClose}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            <Users className="h-4 w-4" />
            Ajouter des invités et envoyer leurs liens
          </Link>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lien général</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">Pour présenter l’invitation à tout le monde. Ce lien ne permet pas de confirmer sa présence.</p>
          <div className="mt-2 break-all rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
            {link}
          </div>
          <div className="mt-3 grid gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 text-sm font-semibold text-white hover:brightness-105"
            >
              <WhatsAppGlyph className="h-4 w-4" />
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:bg-gray-800 dark:text-violet-200"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Lien copié' : 'Copier le lien'}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={() => void share()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <Share2 className="h-4 w-4" />
                Autres applications
              </button>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
}
