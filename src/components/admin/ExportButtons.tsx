'use client';

import { Guest, EventWithSettings } from '@/types';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportButtonsProps {
  guests: Guest[];
  event?: EventWithSettings;
}

export default function ExportButtons({ guests, event }: ExportButtonsProps) {
  const exportToCSV = () => {
    const headers = ['Nom', 'Téléphone', 'Email', 'Groupe', 'Adultes', 'Enfants', 'Statut', 'Table'];
    const csvContent = [
      headers.join(','),
      ...guests.map(g => [
        g.name,
        g.phone || '',
        g.email || '',
        g.group || '',
        g.adults,
        g.children,
        g.status,
        g.table_number || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.slug || 'invites'}-export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToICS = () => {
    if (!event) return;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Invitia//Event//FR',
      'BEGIN:VEVENT',
      `UID:${event.slug}@invitia.app`,
      `DTSTART:${formatToICSDate(event.event_date)}`,
      `DTEND:${formatToICSDate(event.event_date)}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.venue || ''}`,
      `DESCRIPTION:${event.description || event.mainText || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.slug}.ics`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatToICSDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
        title="Exporter en CSV"
      >
        <FileText className="w-3 h-3" />
        CSV
      </button>
      <button
        onClick={exportToICS}
        disabled={!event}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
        title="Exporter calendrier"
      >
        <FileSpreadsheet className="w-3 h-3" />
        ICS
      </button>
    </div>
  );
}