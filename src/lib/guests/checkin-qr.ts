import { checkinPayload } from '@/lib/guests/store';

export async function checkinQrDataUrl(token: string, size = 220): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(checkinPayload(token), {
    margin: 1,
    width: size,
    errorCorrectionLevel: 'M',
    color: { dark: '#111827', light: '#ffffff' },
  });
}
