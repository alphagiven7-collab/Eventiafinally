// ============================================
// INVITIA - Utilities
// ============================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { STORAGE_KEYS } from '@/constants';

// === TAILWIND ===
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// === SLUG ===
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50)
    + '-' 
    + Math.random().toString(36).substring(2, 6);
}

// === DATES ===
export function formatDate(date: string | Date, formatStr: string = 'dd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: fr });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}

export function formatDateTime(date: string, time?: string): string {
  const dateStr = formatDate(date, 'EEEE d MMMM yyyy');
  if (time) {
    return `${dateStr} à ${formatTime(time)}`;
  }
  return dateStr;
}

export function getCountdown(date: string): { days: number; message: string } {
  const eventDate = parseISO(date);
  const now = new Date();
  
  if (isBefore(eventDate, now)) {
    return { days: 0, message: 'Événement passé' };
  }
  
  const days = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return { days: 0, message: "C'est aujourd'hui !" };
  }
  
  if (days === 1) {
    return { days: 1, message: 'Demain !' };
  }
  
  return { days, message: `Plus que ${days} jour${days > 1 ? 's' : ''}` };
}

// === STORAGE ===
export function saveDraft<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export function loadDraft<T>(key: string): T | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearDraft(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}

// === URL ===
export function getEventUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/e/${slug}`;
}

// === WHATSAPP ===
export function getWhatsAppShareUrl(event: { title: string; eventDate: string; eventTime?: string; location: string; slug: string }): string {
  const eventUrl = getEventUrl(event.slug);
  const dateStr = formatDate(event.eventDate, 'EEEE d MMMM yyyy');
  const timeStr = event.eventTime ? ` à ${formatTime(event.eventTime)}` : '';
  
  const message = `🎉 Vous êtes invité(e) !

${event.title}
📅 ${dateStr}${timeStr}
📍 ${event.location}

Cliquez ici pour voir les détails et confirmer votre présence:
${eventUrl}

 Envoyé via Invitia`;
  
  if (typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    return `whatsapp://send?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// === VALIDATION ===
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{8,20}$/.test(phone);
}

// === COPY TO CLIPBOARD ===
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
