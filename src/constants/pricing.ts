/** Prix d'une invitation : 0,30 $ par invité. */
export const PRICE_PER_GUEST_USD = 0.3;

export function formatUsd(amount: number): string {
  const formatted = amount.toFixed(2).replace('.', ',');
  return `${formatted} $`;
}

export function invitationTotalUsd(guestCount: number): number {
  const count = Math.max(0, Math.floor(guestCount));
  return Math.round(count * PRICE_PER_GUEST_USD * 100) / 100;
}
