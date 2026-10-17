/** Au-delà de l'offre gratuite : 0,30 $ par invité supplémentaire. */
export const PRICE_PER_GUEST_USD = 0.3;

/** Offre gratuite : 5 invités, lien public réel. */
export const FREE_GUEST_LIMIT = 5;

export function formatUsd(amount: number): string {
  const formatted = amount.toFixed(2).replace('.', ',');
  return `${formatted} $`;
}

export function extraGuestCount(guestCount: number): number {
  return Math.max(0, Math.floor(guestCount) - FREE_GUEST_LIMIT);
}

export function invitationTotalUsd(guestCount: number): number {
  return Math.round(extraGuestCount(guestCount) * PRICE_PER_GUEST_USD * 100) / 100;
}

export function freeGuestLimitMessage(): string {
  return `L'offre gratuite partage ${FREE_GUEST_LIMIT} invités. Au-delà, chaque invité supplémentaire coûte ${formatUsd(PRICE_PER_GUEST_USD)}.`;
}
