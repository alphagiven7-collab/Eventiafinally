const FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]/g;

export function cleanFilePart(value: string): string {
  const cleaned = value
    .normalize('NFC')
    .replace(FORBIDDEN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  return cleaned.slice(0, 80);
}

export function invitationPdfFilename(
  eventTitle: string,
  guestName: string | undefined,
  used: Map<string, number>,
): string {
  const eventPart = cleanFilePart(eventTitle) || 'Evenement';
  const guestPart = guestName ? cleanFilePart(guestName) : '';
  const base = (guestPart ? `Invitation_${eventPart}_${guestPart}` : `Invitation_${eventPart}`).slice(0, 140);
  const key = base.toLocaleLowerCase('fr');
  const count = (used.get(key) ?? 0) + 1;
  used.set(key, count);
  return `${count === 1 ? base : `${base}_${count}`}.pdf`;
}

export function invitationsZipFilename(eventTitle: string): string {
  const eventPart = cleanFilePart(eventTitle) || 'Evenement';
  return `Invitations_${eventPart}.zip`;
}
