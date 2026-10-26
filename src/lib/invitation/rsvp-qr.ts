export type RsvpQrDisplayMode = 'immediate' | 'after-confirmation';
export type RsvpQrStatus = 'confirmed' | 'declined' | 'pending' | undefined;

export function shouldShowCheckinQr(
  mode: RsvpQrDisplayMode,
  status: RsvpQrStatus,
  revealedByConfirmation = false,
) {
  if (status === 'declined') return false;
  return mode === 'immediate' || revealedByConfirmation;
}
