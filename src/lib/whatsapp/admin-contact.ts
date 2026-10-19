import { formatUsd, guestCapacity, packTotalUsd, TRIAL_INVITATIONS } from '@/constants/pricing';

export function digitsOnly(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

export function adminWhatsAppDigits(): string {
  return digitsOnly(process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '');
}

export function whatsAppChatUrl(phone: string, message: string): string | null {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function adminContactMessage(): string {
  return 'Bonjour, je vous contacte depuis les offres Eventia.';
}

export function adminPaymentMessage(count: number, email?: string | null, name?: string | null): string {
  const paid = Math.max(0, Math.floor(count || 0));
  const places = guestCapacity(paid);
  const lines = [
    'Bonjour, je souhaite payer un forfait Eventia.',
    '',
    `Forfait : ${paid} invités`,
    `Montant : ${formatUsd(packTotalUsd(paid))}`,
    `Places à débloquer : ${places} (${paid} payées + ${TRIAL_INVITATIONS} invitations d'essai)`,
  ];
  if (name?.trim()) lines.push('', `Nom : ${name.trim()}`);
  if (email?.trim()) lines.push(`E-mail : ${email.trim()}`);
  lines.push('', 'Merci de débloquer ces places après réception du paiement.');
  return lines.join('\n');
}
