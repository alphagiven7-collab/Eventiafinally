'use client';

import { useState, useEffect } from 'react';
import { EventWithSettings, Guest } from '@/types';
import { getUserEvents } from '@/lib/utils/eventManager';
import { generateGuestLink } from '@/lib/utils/eventLoader';

export default function DashboardPage() {
  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithSettings | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    group: '',
    adults: 1,
    children: 0,
    message: '',
  });

  useEffect(() => {
    loadUserEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadGuests(selectedEvent.slug);
    }
  }, [selectedEvent]);

  const loadUserEvents = async () => {
    // Charger les événements créés par l'utilisateur
    const userEvents = await import('@/lib/utils/eventManager').then(m => m.getUserEvents());
    setEvents(userEvents);
    if (userEvents.length > 0) {
      setSelectedEvent(userEvents[0]);
    }
    setLoading(false);
  };

  const loadGuests = async (eventSlug: string) => {
    // Charger les invités depuis localStorage
    const guestsData = localStorage.getItem(`guests_${eventSlug}`);
    if (guestsData) {
      const parsedGuests = JSON.parse(guestsData);
      // Réassocier les invités à l'événement
      const guestsWithEvent = parsedGuests.map((g: Guest) => ({
        ...g,
        event_id: eventSlug
      }));
      setGuests(guestsWithEvent);
    } else {
      setGuests([]);
    }
  };

  const saveGuestsToStorage = (eventSlug: string, guestsList: Guest[]) => {
    localStorage.setItem(`guests_${eventSlug}`, JSON.stringify(guestsList));
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const eventSlug = selectedEvent.slug;
    const token = Math.random().toString(36).substring(2, 15);
    
    const newGuest: Guest = {
      id: Date.now().toString(),
      event_id: eventSlug,
      ...formData,
      status: 'pending',
      token,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedGuests = [...guests, newGuest];
    setGuests(updatedGuests);
    saveGuestsToStorage(eventSlug, updatedGuests);
    
    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      group: '',
      adults: 1,
      children: 0,
      message: '',
    });
    setShowAddForm(false);
  };

  const handleEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;

    const updatedGuest = {
      ...editingGuest,
      ...formData,
      updated_at: new Date().toISOString(),
    };

    const updatedGuests = guests.map(g => g.id === editingGuest.id ? updatedGuest : g);
    setGuests(updatedGuests);
    saveGuestsToStorage(selectedEvent!.slug, updatedGuests);
    
    setEditingGuest(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      group: '',
      adults: 1,
      children: 0,
      message: '',
    });
  };

  const handleDeleteGuest = (guestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet invité ?')) return;
    
    const updatedGuests = guests.filter(g => g.id !== guestId);
    setGuests(updatedGuests);
    saveGuestsToStorage(selectedEvent!.slug, updatedGuests);
  };

  const handleSendWhatsApp = (guest: Guest) => {
    if (!selectedEvent || !guest.phone) return;
    
    const inviteLink = generateGuestLink(selectedEvent.slug, guest.token);
    const message = `Bonjour ${guest.name},\n\nVous êtes invité(e) à ${selectedEvent.title}.\n\nCliquez sur ce lien pour confirmer votre présence :\n${inviteLink}\n\nAu plaisir de vous voir !`;
    
    const phoneNumber = guest.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const exportToCSV = () => {
    if (guests.length === 0) return;

    const headers = ['Nom', 'Téléphone', 'Email', 'Groupe', 'Adultes', 'Enfants', 'Statut', 'Message'];
    const rows = guests.map(g => [
      g.name,
      g.phone,
      g.email,
      g.group,
      g.adults.toString(),
      g.children.toString(),
      g.status,
      g.message || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invites_${selectedEvent?.slug}_${Date.now()}.csv`;
    a.click();
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const newGuests: Guest[] = [];

        lines.slice(1).forEach((line, index) => {
          const [name, phone, email, group, adults, children] = line.split(',');
          if (name) {
            newGuests.push({
              id: Date.now().toString() + index,
              event_id: selectedEvent!.slug,
              name: name.trim(),
              phone: phone?.trim() || '',
              email: email?.trim() || '',
              group: group?.trim() || '',
              adults: parseInt(adults) || 1,
              children: parseInt(children) || 0,
              status: 'pending',
              token: Math.random().toString(36).substring(2, 15),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        });

        const updatedGuests = [...guests, ...newGuests];
        setGuests(updatedGuests);
        saveGuestsToStorage(selectedEvent!.slug, updatedGuests);
        alert(`${newGuests.length} invités importés avec succès !`);
      } catch (error) {
        alert('Erreur lors de l\'import CSV. Vérifiez le format du fichier.');
      }
    };
    reader.readAsText(file);
  };

  const getStats = () => {
    const total = guests.length;
    const confirmed = guests.filter(g => g.status === 'confirmed').length;
    const declined = guests.filter(g => g.status === 'declined').length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const totalPeople = guests.reduce((sum, g) => sum + g.adults + g.children, 0);

    return { total, confirmed, declined, pending, totalPeople };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-[10px] text-gray-500">Gérez vos invités et suivez les RSVP</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Event Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Événement</label>
          <select
            value={selectedEvent?.slug || ''}
            onChange={(e) => {
              const event = events.find(ev => ev.slug === e.target.value);
              setSelectedEvent(event || null);
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {events.map(event => (
              <option key={event.slug} value={event.slug}>{event.title}</option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">Total invités</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">Confirmés</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">Refusés</p>
                <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">Total personnes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPeople}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition"
                >
                  + Ajouter invité
                </button>
                <label className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition cursor-pointer">
                  📥 Import CSV
                  <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
                </label>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-xl hover:bg-gray-600 transition"
                >
                  📤 Export CSV
                </button>
              </div>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingGuest) && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingGuest ? 'Modifier invité' : 'Ajouter un invité'}
                </h3>
                <form onSubmit={editingGuest ? handleEditGuest : handleAddGuest}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nom complet *"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone (avec indicatif)"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Groupe"
                      value={formData.group}
                      onChange={(e) => setFormData({...formData, group: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Adultes"
                      min="1"
                      value={formData.adults}
                      onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value) || 1})}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Enfants"
                      min="0"
                      value={formData.children}
                      onChange={(e) => setFormData({...formData, children: parseInt(e.target.value) || 0})}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <textarea
                    placeholder="Message (optionnel)"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={2}
                    className="w-full mt-4 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition"
                    >
                      {editingGuest ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingGuest(null);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Guests Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Groupe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Personnes</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {guests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          Aucun invité pour le moment. Ajoutez-en ou importez un CSV.
                        </td>
                      </tr>
                    ) : (
                      guests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{guest.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{guest.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{guest.group || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {guest.adults + guest.children}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              guest.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              guest.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {guest.status === 'confirmed' ? 'Confirmé' :
                               guest.status === 'declined' ? 'Refusé' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingGuest(guest);
                                  setFormData({
                                    name: guest.name,
                                    phone: guest.phone || '',
                                    email: guest.email || '',
                                    group: guest.group || '',
                                    adults: guest.adults,
                                    children: guest.children,
                                    message: guest.message || '',
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleSendWhatsApp(guest)}
                                className="text-green-600 hover:text-green-700 text-xs font-medium"
                              >
                                WhatsApp
                              </button>
                              <button
                                onClick={() => handleDeleteGuest(guest.id)}
                                className="text-red-600 hover:text-red-700 text-xs font-medium"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}