'use client';

import { useState, useEffect, useCallback } from 'react';
import { Guest, GuestStatus, EventWithSettings } from '@/types';
import { createClient } from '@/lib/supabase/client';
import GuestTable from '@/components/admin/GuestTable';
import GuestForm from '@/components/admin/GuestForm';
import StatsCards from '@/components/admin/StatsCards';
import CsvImporter from '@/components/admin/CsvImporter';
import WhatsAppSender from '@/components/admin/WhatsAppSender';
import ExportButtons from '@/components/admin/ExportButtons';

interface GuestManagerProps {
  event: EventWithSettings;
}

export default function GuestManager({ event }: GuestManagerProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const supabase = createClient();

  // Charger les invités depuis Supabase (filtré par event_id - UUID)
  const loadGuests = useCallback(async () => {
    if (!event?.id) return;
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Erreur chargement invités:', error);
    } finally {
      setLoading(false);
    }
  }, [event?.id, supabase]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Statistiques
  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.status === 'confirmed').length,
    declined: guests.filter(g => g.status === 'declined').length,
    pending: guests.filter(g => g.status === 'pending').length,
  };

  // Ajouter ou modifier un invité
  const handleSubmitGuest = async (data: Partial<Guest>) => {
    if (editingGuest) {
      // Mise à jour
      const { error } = await supabase
        .from('guests')
        .update({
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          group_name: data.group || null,
          adults: data.adults || 1,
          children: data.children || 0,
          table_number: data.table_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingGuest.id);

      if (error) {
        console.error('Erreur mise à jour:', error);
        return;
      }
    } else {
      // Création
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from('guests')
        .insert({
          event_id: event.id,
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          group_name: data.group || null,
          adults: data.adults || 1,
          children: data.children || 0,
          table_number: data.table_number || null,
          status: 'pending',
          token,
        });

      if (error) {
        console.error('Erreur création:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingGuest(null);
    loadGuests();
  };

  // Supprimer un invité
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Supprimer cet invité ?')) return;
    
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId);

    if (error) {
      console.error('Erreur suppression:', error);
      return;
    }
    loadGuests();
  };

  // Changer le statut d'un invité
  const handleStatusChange = async (guestId: string, status: GuestStatus) => {
    const { error } = await supabase
      .from('guests')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', guestId);

    if (error) {
      console.error('Erreur changement statut:', error);
      return;
    }
    loadGuests();
  };

  // Importer depuis CSV
  const handleCsvImport = async (importedGuests: Guest[]) => {
    const guestsToInsert = importedGuests.map(g => ({
      event_id: event.id,
      name: g.name,
      phone: g.phone || null,
      email: g.email || null,
      group_name: g.group || null,
      adults: g.adults || 1,
      children: g.children || 0,
      table_number: g.table_number || null,
      status: 'pending' as const,
      token: Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15),
    }));

    // Insertion par lots de 50
    for (let i = 0; i < guestsToInsert.length; i += 50) {
      const batch = guestsToInsert.slice(i, i + 50);
      const { error } = await supabase
        .from('guests')
        .insert(batch);

      if (error) {
        console.error('Erreur import lot', i, error);
      }
    }

    setShowCsvImporter(false);
    loadGuests();
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <StatsCards stats={stats} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setEditingGuest(null); setShowForm(true); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          + Ajouter un invité
        </button>
        <button
          onClick={() => setShowCsvImporter(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          📥 Importer CSV
        </button>
        <button
          onClick={() => setShowWhatsApp(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          📤 Envoyer WhatsApp
        </button>
        <ExportButtons guests={guests} event={event} />
      </div>

      {/* Tableau des invités */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <GuestTable
          guests={guests}
          onEdit={handleEditGuest}
          onDelete={handleDeleteGuest}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <GuestForm
          guest={editingGuest}
          onSubmit={handleSubmitGuest}
          onClose={() => { setShowForm(false); setEditingGuest(null); }}
        />
      )}

      {/* Modal Import CSV */}
      {showCsvImporter && (
        <CsvImporter
          onImport={handleCsvImport}
          onClose={() => setShowCsvImporter(false)}
        />
      )}

      {/* Modal WhatsApp */}
      {showWhatsApp && (
        <WhatsAppSender
          guests={guests}
          event={event}
          onClose={() => setShowWhatsApp(false)}
        />
      )}
    </div>
  );
}