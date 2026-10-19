import { TRIAL_INVITATIONS } from '@/constants/pricing';

/** Invitation encore au forfait d’essai (non débloquée par l’admin). */
export function isFreeGuestTier(guestLimit?: number | null): boolean {
  const limit = guestLimit == null ? TRIAL_INVITATIONS : Number(guestLimit);
  return !Number.isFinite(limit) || limit <= TRIAL_INVITATIONS;
}
