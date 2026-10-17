/** Prix d'une invitation enregistrée : 0,30 $ par invité. */
export const PRICE_PER_GUEST_USD = 0.3;

/** Démo gratuite : visible seulement par la personne qui la teste. */
export const FREE_DEMO_GUEST_LIMIT = 10;

export function formatUsd(amount: number): string {
  const formatted = amount.toFixed(2).replace('.', ',');
  return `${formatted} $`;
}

export function invitationTotalUsd(guestCount: number): number {
  const count = Math.max(0, Math.floor(guestCount));
  return Math.round(count * PRICE_PER_GUEST_USD * 100) / 100;
}

export function demoGuestLimitMessage(): string {
  return `La démo s'arrête à ${FREE_DEMO_GUEST_LIMIT} invités. Elle n'est pas enregistrée et ne peut pas être partagée. Pour envoyer le lien, chaque invité coûte ${formatUsd(PRICE_PER_GUEST_USD)}.`;
}
