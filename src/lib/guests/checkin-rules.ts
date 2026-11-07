type CheckInEvent = {
  id: string;
  event_date?: string;
  is_published?: boolean;
  isBlocked?: boolean;
};

/** Une carte d'entrée ne vaut que pour le mariage auquel son invité appartient. */
export function cardBelongsToEvent(guestEventId: string | undefined, eventId: string): boolean {
  const guestId = guestEventId?.trim();
  const currentId = eventId.trim();
  return Boolean(guestId) && Boolean(currentId) && guestId === currentId;
}

/** Le mariage choisi s'il existe, sinon le plus proche d'aujourd'hui (publiés d'abord). */
export function pickDefaultEvent(events: CheckInEvent[], preferredId: string, now = Date.now()): string {
  const normalizedPreferredId = preferredId.trim();
  if (normalizedPreferredId) {
    const match = events.find((event) => (event.id || '').trim() === normalizedPreferredId);
    if (match) return match.id;
  }
  const open = events.filter((event) => event.is_published && !event.isBlocked);
  const pool = open.length > 0 ? open : events;
  const distance = (event: CheckInEvent) => {
    const time = event.event_date ? new Date(event.event_date).getTime() : Number.NaN;
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : Math.abs(time - now);
  };
  return [...pool].sort((a, b) => distance(a) - distance(b))[0]?.id ?? '';
}
