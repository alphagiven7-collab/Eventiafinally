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

export function checkinCardFileName(guestName: string): string {
  const slug = guestName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug ? `carte-entree-${slug}.png` : 'carte-entree.png';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Le code d’entrée n’a pas pu être dessiné.'));
    image.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length || maxLines < 1) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  const visible = lines.slice(0, maxLines);
  const consumed = visible.join(' ');
  if (words.join(' ').length > consumed.length && visible.length) {
    let last = visible[visible.length - 1].replace(/…$/, '');
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    visible[visible.length - 1] = `${last}…`;
  }
  return visible;
}

export async function checkinEntryCardDataUrl(input: {
  token: string;
  guestName: string;
  tableLabel?: string;
  eventTitle?: string;
}): Promise<string> {
  const name = input.guestName.trim() || 'Invité';
  const qrUrl = await checkinQrDataUrl(input.token, 640);
  const qr = await loadImage(qrUrl);
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* la carte reste lisible avec la police de secours */
    }
  }

  const width = 900;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return qrUrl;

  ctx.fillStyle = '#F8F4F0';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, width - 72, height - 72);
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, width - 104, height - 104);

  ctx.fillStyle = '#6B5B4F';
  ctx.font = '600 22px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText('CARTE D’ENTRÉE', width / 2, 130);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#1A1A2E';
  ctx.font = '600 40px "Playfair Display", Georgia, serif';
  const titleLines = wrapLines(ctx, input.eventTitle?.trim() || 'Invitation', 700, 2);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, 200 + index * 50);
  });

  const nameTop = 200 + titleLines.length * 50 + 36;
  ctx.font = '600 58px "Playfair Display", Georgia, serif';
  const nameLines = wrapLines(ctx, name, 740, 2);
  nameLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, nameTop + index * 68);
  });

  let cursor = nameTop + nameLines.length * 68 + 8;
  const table = input.tableLabel?.trim();
  if (table) {
    ctx.font = '600 24px Montserrat, sans-serif';
    ctx.fillStyle = '#6B5B4F';
    ctx.fillText(table, width / 2, cursor + 20);
    cursor += 56;
  }

  const qrSize = 520;
  const qrX = (width - qrSize) / 2;
  const qrY = Math.min(cursor + 24, 560);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
  ctx.strokeStyle = '#E8E0D8';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#6B5B4F';
  ctx.font = '500 22px Montserrat, sans-serif';
  ctx.fillText(name, width / 2, 1168);
  ctx.font = '400 18px Montserrat, sans-serif';
  ctx.fillText('Montrez cette carte à l’entrée', width / 2, 1208);

  return canvas.toDataURL('image/png');
}
