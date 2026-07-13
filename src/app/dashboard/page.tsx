'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import GuestTable from '@/components/admin/GuestTable';
import GuestForm from '@/components/admin/GuestForm';
import CsvImporter from '@/components/admin/CsvImporter';
import WhatsAppSender from '@/components/admin/WhatsAppSender';
import ExportButtons from '@/components/admin/ExportButtons';
import { EventWithSettings, Guest, GuestStatus } from '@/types';
import { getEventBySlug } from '@/data/events';
import { createBrowserClient } from '@supabase/ssr';

const EVENT_ID = 'yanick-keren'; // Pour le MVP, on utilise un événement fixe

export default function DashboardPage() {
  const router = useRouter();
  const [event, setEvent] = useState<EventWithSettings | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [showWhatsAppSender, setShowWhatsAppSender] = useState(false);

  // Charger l'événement et les invités
  useEffect(() => {
    const eventData = getEventBySlug(EVENT_ID);
    setEvent(eventData);
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      // Pour le MVP, on utilise localStorage (pas encore Supabase configuré)
      const stored = localStorage.getItem(`guests_${EVENT_ID}`);
      const storedGuests: Guest[] = stored ? JSON.parse(stored) : [];
      setGuests(storedGuests);
    } catch (error) {
      console.error('Error loading guests:', error);
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (guestData: Partial<Guest>) => {
    const newGuest: Guest = {
      id: Date.now().toString(),
      event_id: EVENT_ID,
      name: guestData.name || '',
      phone: guestData.phone || '',
      email: guestData.email || '',
      group: guestData.group || '',
      status: 'pending',
      adults: guestData.adults || 1,
      children: guestData.children || 0,
      table_number: guestData.table_number || '',
      message: guestData.message || '',
      token: generateToken(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedGuests = [...guests, newGuest];
    setGuests(updatedGuests);
    localStorage.setItem(`guests_${EVENT_ID}`, JSON.stringify(updatedGuests));
    setShowGuestForm(false);
  };

  const handleUpdateGuest = async (guestData: Partial<Guest>) => {
    if (!editingGuest) return;

    const updatedGuests = guests.map(g =>
      g.id === editingGuest.id
        ? { ...g, ...guestData, updated_at: new Date().toISOString() }
        : g
    );

    setGuests(updatedGuests);
    localStorage.setItem(`guests_${EVENT_ID}`, JSON.stringify(updatedGuests));
    setEditingGuest(null);
    setShowGuestForm(false);
  };

  const handleDeleteGuest = (guestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet invité ?')) return;

    const updatedGuests = guests.filter(g => g.id !== guestId);
    setGuests(updatedGuests);
    localStorage.setItem(`guests_${EVENT_ID}`, JSON.stringify(updatedGuests));
  };

  const handleImportCSV = (importedGuests: Guest[]) => {
    const updatedGuests = [...guests, ...importedGuests];
    setGuests(updatedGuests);
    localStorage.setItem(`guests_${EVENT_ID}`, JSON.stringify(updatedGuests));
    setShowCsvImporter(false);
  };

  const handleStatusChange = (guestId: string, status: GuestStatus) => {
    const updatedGuests = guests.map(g =>
      g.id === guestId ? { ...g, status, updated_at: new Date().toISOString() } : g
    );
    setGuests(updatedGuests);
    localStorage.setItem(`guests_${EVENT_ID}`, JSON.stringify(updatedGuests));
  };

  const generateToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Calculer les statistiques
  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.status === 'confirmed').length,
    declined: guests.filter(g => g.status === 'declined').length,
    pending: guests.filter(g => g.status === 'pending').length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Événement introuvable. Veuillez configurer un événement.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-sm text-gray-600 mt-1">{event.title}</p>
          </div>
        </div>

        {/* Statistiques */}
        <StatsCards stats={stats} />

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingGuest(null);
              setShowGuestForm(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Ajouter invité
          </button>
          <button
            onClick={() => setShowCsvImporter(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            📥 Importer CSV
          </button>
          <button
            onClick={() => setShowWhatsAppSender(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            💬 WhatsApp
          </button>
          <ExportButtons guests={guests} event={event} />
        </div>

        {/* Table des invités */}
        <GuestTable
          guests={guests}
          onEdit={(guest) => {
            setEditingGuest(guest);
            setShowGuestForm(true);
          }}
          onDelete={handleDeleteGuest}
          onStatusChange={handleStatusChange}
        />

        {/* Modales */}
        {showGuestForm && (
          <GuestForm
            guest={editingGuest}
            onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest}
            onClose={() => {
              setShowGuestForm(false);
              setEditingGuest(null);
            }}
          />
        )}

        {showCsvImporter && (
          <CsvImporter
            onImport={handleImportCSV}
            onClose={() => setShowCsvImporter(false)}
          />
        )}

        {showWhatsAppSender && (
          <WhatsAppSender
            guests={guests}
            onClose={() => setShowWhatsAppSender(false)}
            event={event}
          />
        )}
      </div>
    </AdminLayout>
  );
}