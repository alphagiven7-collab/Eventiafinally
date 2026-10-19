/** 0,30 $ par invité. Les forfaits multiplient ce prix par le nombre d'invités. */
export const PRICE_PER_GUEST_USD = 0.3;

/** Invitations d'essai, en plus du forfait choisi. */
export const TRIAL_INVITATIONS = 3;

export const GUEST_PACKS = [50, 100, 200] as const;

/** Ancien nom conservé : la limite sans forfait est l'essai de 3 invitations. */
export const FREE_GUEST_LIMIT = TRIAL_INVITATIONS;

export function formatUsd(amount: number): string {
  const formatted = amount.toFixed(2).replace('.', ',');
  return `${formatted} $`;
}

export function packTotalUsd(guestCount: number): number {
  const count = Math.max(0, Math.floor(guestCount));
  return Math.round(count * PRICE_PER_GUEST_USD * 100) / 100;
}

export function guestCapacity(packSize?: number | null): number {
  return TRIAL_INVITATIONS + Math.max(0, Math.floor(packSize || 0));
}

export function extraGuestCount(guestCount: number): number {
  return Math.max(0, Math.floor(guestCount) - TRIAL_INVITATIONS);
}

export function invitationTotalUsd(guestCount: number): number {
  return packTotalUsd(Math.max(0, Math.floor(guestCount)));
}

export function freeGuestLimitMessage(limit = TRIAL_INVITATIONS): string {
  return `Cette invitation comprend ${limit} place${limit > 1 ? 's' : ''}, dont ${TRIAL_INVITATIONS} invitations d'essai. Pour en ajouter, choisissez un forfait : 50 invités (${formatUsd(packTotalUsd(50))}), 100 (${formatUsd(packTotalUsd(100))}) ou 200 (${formatUsd(packTotalUsd(200))}).`;
}
