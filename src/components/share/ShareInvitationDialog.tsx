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
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lien général</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">Pour présenter l’invitation à tout le monde.</p>
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

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Liens personnels</p>
          <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-100/80">
            Chaque invité reçoit son propre lien, avec son nom et sa table. Il peut ainsi confirmer sa présence et recevoir sa carte d’entrée. Le lien général ne le permet pas.
          </p>
          <Link
            href={eventId ? `/dashboard/invites?event=${encodeURIComponent(eventId)}&tool=add` : '/dashboard/invites'}
            onClick={onClose}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-amber-900 shadow-sm hover:bg-amber-100 dark:bg-gray-800 dark:text-amber-100"
          >
            <Users className="h-4 w-4" />
            Ajouter des invités et envoyer leurs liens
          </Link>
        </div>
      </div>
    </Modal>
  );
}
